import re
from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .. import face as face_service
from ..config import PHOTOS_DIR
from ..database import get_session
from ..models import Funcionario
from ..schemas import (
    Employee,
    EmployeeDetail,
    EmployeePage,
    EmployeeTotals,
    FaceValidation,
    QualityCheck,
)
from ..uploads import IMAGE_TYPES, read_image

router = APIRouter(prefix="/api/funcionarios", tags=["funcionários"])

SessionDep = Annotated[Session, Depends(get_session)]

MATRICULA_RE = re.compile(r"^[A-Za-z0-9-]{1,20}$")
# "Segunda a sexta · 08:00 às 17:00"
JORNADA_RE = re.compile(r"^(?P<dias>.+?)\s*·\s*(?P<inicio>\d{2}:\d{2})\s*(?:às|-|–)\s*(?P<fim>\d{2}:\d{2})$")


def bad_request(message: str) -> HTTPException:
    return HTTPException(422, {"message": message})


def employee_out(funcionario: Funcionario, request: Request) -> Employee:
    return Employee(
        id=funcionario.matricula,
        name=funcionario.nome,
        photo=str(request.url_for("employee_photo", matricula=funcionario.matricula))
        if funcionario.foto_arquivo
        else None,
        department=funcionario.departamento,
        role=funcionario.cargo,
        schedule=funcionario.jornada_horario,
        schedule_days=funcionario.jornada_dias,
        face="configurada" if funcionario.face_embedding else "pendente",
        status=funcionario.status,
    )


def employee_detail_out(funcionario: Funcionario, request: Request) -> EmployeeDetail:
    return EmployeeDetail(
        **employee_out(funcionario, request).model_dump(),
        cpf=funcionario.cpf,
        email=funcionario.email,
        phone=funcionario.telefone,
        admission_date=funcionario.data_admissao,
        unit=funcionario.unidade,
        face_configured_at=funcionario.face_configurada_em,
    )


def get_or_404(session: Session, matricula: str) -> Funcionario:
    funcionario = session.get(Funcionario, matricula.upper())
    if funcionario is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, {"message": "Funcionário não encontrado."})
    return funcionario


def parse_date(value: str) -> date:
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            pass
    raise bad_request("Data de admissão inválida. Use DD/MM/AAAA.")


def enroll_face(image: bytes) -> list[float]:
    """Gera o vetor facial da captura, recusando capturas de baixa qualidade."""
    try:
        embedding, _ = face_service.capture_for_enrollment(face_service.decode_image(image))
    except face_service.FaceError as error:
        raise HTTPException(
            422,
            {
                "message": error.message,
                "checks": [QualityCheck(label=c.label, ok=c.ok).model_dump() for c in error.checks],
            },
        ) from error
    return embedding.tolist()


@router.get("", response_model=EmployeePage, response_model_by_alias=True)
def list_employees(
    request: Request,
    session: SessionDep,
    busca: str | None = None,
    departamento: str | None = None,
    status_: Annotated[str | None, Query(alias="status")] = None,
    pagina: Annotated[int, Query(ge=1)] = 1,
    por_pagina: Annotated[int, Query(ge=1, le=100)] = 20,
):
    query = select(Funcionario)
    if busca and busca.strip():
        term = f"%{busca.strip()}%"
        query = query.where(or_(Funcionario.nome.ilike(term), Funcionario.matricula.ilike(term)))
    if departamento:
        query = query.where(Funcionario.departamento == departamento)
    if status_:
        query = query.where(Funcionario.status == status_.lower())

    total = session.scalar(select(func.count()).select_from(query.subquery()))
    rows = session.scalars(
        query.order_by(Funcionario.nome).offset((pagina - 1) * por_pagina).limit(por_pagina)
    ).all()
    return EmployeePage(
        items=[employee_out(f, request) for f in rows],
        total=total or 0,
        page=pagina,
        page_size=por_pagina,
    )


@router.get("/resumo", response_model=EmployeeTotals, response_model_by_alias=True)
def employee_totals(session: SessionDep):
    def count(*conditions) -> int:
        return session.scalar(select(func.count()).select_from(Funcionario).where(*conditions)) or 0

    registered = count()
    active = count(Funcionario.status == "ativo")
    configured = count(Funcionario.face_embedding.is_not(None))
    return EmployeeTotals(
        registered=registered,
        active=active,
        inactive=registered - active,
        face_configured=configured,
        face_pending=registered - configured,
    )


@router.post("/face/validar", response_model=FaceValidation, response_model_by_alias=True)
def validate_face(imagem: Annotated[UploadFile, File()]):
    """Pré-valida uma captura antes de salvar o cadastro (card "Identificação facial")."""
    try:
        _, checks = face_service.capture_for_enrollment(
            face_service.decode_image(read_image(imagem, "imagem"))
        )
    except face_service.FaceError as error:
        return FaceValidation(
            valid=False,
            message=error.message,
            checks=[QualityCheck(label=c.label, ok=c.ok) for c in error.checks],
        )
    return FaceValidation(
        valid=True,
        message="Captura pronta para salvar",
        checks=[QualityCheck(label=c.label, ok=c.ok) for c in checks],
    )


@router.post(
    "",
    response_model=EmployeeDetail,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(
    request: Request,
    session: SessionDep,
    nome: Annotated[str, Form(min_length=3)],
    cpf: Annotated[str, Form()],
    matricula: Annotated[str, Form()],
    email: Annotated[str, Form(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")],
    admissao: Annotated[str, Form()],
    departamento: Annotated[str, Form()],
    cargo: Annotated[str, Form()],
    unidade: Annotated[str, Form()],
    jornada: Annotated[str, Form()],
    telefone: Annotated[str | None, Form()] = None,
    status_: Annotated[str, Form(alias="status")] = "ativo",
    consentimento: Annotated[bool, Form()] = False,
    foto: Annotated[UploadFile | None, File()] = None,
    face: Annotated[UploadFile | None, File()] = None,
):
    """Cadastra um funcionário.

    `foto` é a foto de perfil; `face` é a captura da câmera usada no ponto.
    Sem `face`, o funcionário fica com identificação facial pendente.
    """
    matricula = matricula.strip().upper()
    if not MATRICULA_RE.match(matricula):
        raise bad_request("Matrícula inválida. Use letras, números e hífen.")

    cpf_digits = re.sub(r"\D", "", cpf)
    if len(cpf_digits) != 11:
        raise bad_request("CPF deve ter 11 dígitos.")

    jornada_match = JORNADA_RE.match(jornada.strip())
    if not jornada_match:
        raise bad_request("Jornada inválida. Exemplo: 'Segunda a sexta · 08:00 às 17:00'.")

    status_value = status_.strip().lower()
    if status_value not in ("ativo", "inativo"):
        raise bad_request("Status deve ser 'ativo' ou 'inativo'.")

    duplicate = session.scalar(
        select(Funcionario).where(
            or_(
                Funcionario.matricula == matricula,
                Funcionario.cpf == cpf_digits,
                Funcionario.email == email.lower(),
            )
        )
    )
    if duplicate:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            {"message": "Já existe um funcionário com esta matrícula, CPF ou e-mail."},
        )

    if face is not None and not consentimento:
        raise bad_request("O consentimento para uso dos dados faciais é obrigatório.")

    now = datetime.now(UTC).replace(tzinfo=None)
    funcionario = Funcionario(
        matricula=matricula,
        nome=nome.strip(),
        cpf=cpf_digits,
        email=email.strip().lower(),
        telefone=telefone.strip() if telefone else None,
        data_admissao=parse_date(admissao),
        departamento=departamento.strip(),
        cargo=cargo.strip(),
        unidade=unidade.strip(),
        status=status_value,
        jornada_horario=f"{jornada_match['inicio']} – {jornada_match['fim']}",
        jornada_dias=jornada_match["dias"],
        criado_em=now,
    )

    if face is not None:
        funcionario.face_embedding = enroll_face(read_image(face, "face"))
        funcionario.face_configurada_em = now
        funcionario.consentimento_em = now

    if foto is not None:
        data = read_image(foto, "foto")
        PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
        filename = matricula + IMAGE_TYPES[foto.content_type]
        (PHOTOS_DIR / filename).write_bytes(data)
        funcionario.foto_arquivo = filename

    session.add(funcionario)
    session.commit()
    return employee_detail_out(funcionario, request)


@router.get("/{matricula}", response_model=EmployeeDetail, response_model_by_alias=True)
def get_employee(matricula: str, request: Request, session: SessionDep):
    return employee_detail_out(get_or_404(session, matricula), request)


@router.get("/{matricula}/foto", name="employee_photo")
def employee_photo(matricula: str, session: SessionDep):
    funcionario = get_or_404(session, matricula)
    if not funcionario.foto_arquivo:
        raise HTTPException(status.HTTP_404_NOT_FOUND, {"message": "Funcionário sem foto."})
    return FileResponse(PHOTOS_DIR / funcionario.foto_arquivo)


@router.put("/{matricula}/face", response_model=EmployeeDetail, response_model_by_alias=True)
def configure_face(
    matricula: str,
    request: Request,
    session: SessionDep,
    imagem: Annotated[UploadFile, File()],
    consentimento: Annotated[bool, Form()] = False,
):
    """Configura ou refaz a identificação facial de um funcionário."""
    funcionario = get_or_404(session, matricula)
    if not consentimento:
        raise bad_request("O consentimento para uso dos dados faciais é obrigatório.")

    now = datetime.now(UTC).replace(tzinfo=None)
    funcionario.face_embedding = enroll_face(read_image(imagem, "imagem"))
    funcionario.face_configurada_em = now
    funcionario.consentimento_em = now
    session.commit()
    return employee_detail_out(funcionario, request)


@router.delete("/{matricula}/face", status_code=status.HTTP_204_NO_CONTENT)
def remove_face(matricula: str, session: SessionDep):
    """Apaga os dados faciais (ex.: revogação de consentimento)."""
    funcionario = get_or_404(session, matricula)
    funcionario.face_embedding = None
    funcionario.face_configurada_em = None
    funcionario.consentimento_em = None
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
