from datetime import UTC, date, datetime, time, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import face as face_service
from ..config import PUNCH_COOLDOWN_SECONDS, TIMEZONE
from ..database import get_session
from ..models import Funcionario, RegistroPonto
from ..schemas import Punch, PunchResult
from ..uploads import read_image
from .funcionarios import employee_out, get_or_404

router = APIRouter(prefix="/api", tags=["ponto"])

SessionDep = Annotated[Session, Depends(get_session)]

# O tipo é definido pela sequência de registros do dia.
SEQUENCIA = ["entrada", "saida_intervalo", "retorno_intervalo", "saida"]
ROTULOS = {
    "entrada": "Entrada",
    "saida_intervalo": "Saída para intervalo",
    "retorno_intervalo": "Retorno do intervalo",
    "saida": "Saída",
}


def utc_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def local_day_bounds(day: date) -> tuple[datetime, datetime]:
    """Início e fim do dia no fuso local, convertidos para UTC sem fuso."""
    start = datetime.combine(day, time.min, TIMEZONE).astimezone(UTC).replace(tzinfo=None)
    return start, start + timedelta(days=1)


def punch_out(registro: RegistroPonto, request: Request, **extra) -> dict:
    return dict(
        id=registro.id,
        employee=employee_out(registro.funcionario, request),
        type=registro.tipo,
        type_label=ROTULOS[registro.tipo],
        registered_at=registro.registrado_em.replace(tzinfo=UTC).astimezone(TIMEZONE),
        receipt=registro.comprovante,
        terminal=registro.terminal,
        location=registro.local,
        **extra,
    )


@router.post("/ponto", response_model=PunchResult, response_model_by_alias=True)
def register_punch(
    request: Request,
    session: SessionDep,
    imagem: Annotated[UploadFile, File()],
    terminal: Annotated[str | None, Form()] = None,
    local: Annotated[str | None, Form()] = None,
):
    """Identifica o funcionário pelo rosto e registra o ponto.

    - 200: ponto registrado (ou `duplicate: true` se repetiu uma leitura recente)
    - 404: rosto detectado, mas não reconhecido
    - 409: todos os registros do dia já foram feitos
    - 422: nenhum rosto detectado / imagem inválida
    """
    candidates = dict(
        session.execute(
            select(Funcionario.matricula, Funcionario.face_embedding).where(
                Funcionario.status == "ativo", Funcionario.face_embedding.is_not(None)
            )
        ).all()
    )

    try:
        match = face_service.identify(
            face_service.decode_image(read_image(imagem, "imagem")), candidates
        )
    except face_service.FaceError as error:
        raise HTTPException(422, {"message": error.message}) from error

    if match is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            {"message": "Face não reconhecida. Nenhum ponto registrado."},
        )
    matricula, distance = match

    now = utc_now()
    start, end = local_day_bounds(now.replace(tzinfo=UTC).astimezone(TIMEZONE).date())
    today = session.scalars(
        select(RegistroPonto)
        .where(
            RegistroPonto.matricula == matricula,
            RegistroPonto.registrado_em >= start,
            RegistroPonto.registrado_em < end,
        )
        .order_by(RegistroPonto.registrado_em)
    ).all()

    if today and now - today[-1].registrado_em < timedelta(seconds=PUNCH_COOLDOWN_SECONDS):
        return punch_out(today[-1], request, duplicate=True)

    if len(today) >= len(SEQUENCIA):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            {"message": "Todos os registros de hoje já foram feitos."},
        )

    sequence = (
        session.scalar(
            select(func.count())
            .select_from(RegistroPonto)
            .where(RegistroPonto.registrado_em >= start, RegistroPonto.registrado_em < end)
        )
        or 0
    ) + 1
    local_now = now.replace(tzinfo=UTC).astimezone(TIMEZONE)

    registro = RegistroPonto(
        matricula=matricula,
        tipo=SEQUENCIA[len(today)],
        registrado_em=now,
        comprovante=f"{local_now:%Y%m%d}-{sequence:05d}",
        distancia=distance,
        terminal=terminal,
        local=local,
    )
    session.add(registro)
    session.commit()
    return punch_out(registro, request)


@router.get("/pontos", response_model=list[Punch], response_model_by_alias=True)
def list_punches(
    request: Request,
    session: SessionDep,
    funcionario: str | None = None,
    data: date | None = None,
):
    """Registros de um dia (padrão: hoje), opcionalmente de um único funcionário."""
    day = data or datetime.now(TIMEZONE).date()
    start, end = local_day_bounds(day)
    query = select(RegistroPonto).where(
        RegistroPonto.registrado_em >= start, RegistroPonto.registrado_em < end
    )
    if funcionario:
        query = query.where(RegistroPonto.matricula == get_or_404(session, funcionario).matricula)
    rows = session.scalars(query.order_by(RegistroPonto.registrado_em)).all()
    return [punch_out(r, request) for r in rows]
