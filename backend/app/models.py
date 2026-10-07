from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Funcionario(Base):
    __tablename__ = "funcionarios"

    matricula: Mapped[str] = mapped_column(String(20), primary_key=True)
    nome: Mapped[str] = mapped_column(String(120))
    cpf: Mapped[str] = mapped_column(String(11), unique=True)
    email: Mapped[str] = mapped_column(String(120), unique=True)
    telefone: Mapped[str | None] = mapped_column(String(20))
    data_admissao: Mapped[date] = mapped_column(Date)
    departamento: Mapped[str] = mapped_column(String(60), index=True)
    cargo: Mapped[str] = mapped_column(String(80))
    unidade: Mapped[str] = mapped_column(String(60))
    status: Mapped[str] = mapped_column(String(10), default="ativo", index=True)
    jornada_horario: Mapped[str] = mapped_column(String(30))
    jornada_dias: Mapped[str] = mapped_column(String(40))
    foto_arquivo: Mapped[str | None] = mapped_column(String(80))

    # Somente o vetor facial é guardado; a imagem da captura é descartada.
    face_embedding: Mapped[list[float] | None] = mapped_column(JSON)
    face_configurada_em: Mapped[datetime | None] = mapped_column(DateTime)
    consentimento_em: Mapped[datetime | None] = mapped_column(DateTime)

    criado_em: Mapped[datetime] = mapped_column(DateTime)

    registros: Mapped[list["RegistroPonto"]] = relationship(
        back_populates="funcionario", cascade="all, delete-orphan"
    )


class RegistroPonto(Base):
    __tablename__ = "registros_ponto"

    id: Mapped[int] = mapped_column(primary_key=True)
    matricula: Mapped[str] = mapped_column(ForeignKey("funcionarios.matricula"), index=True)
    tipo: Mapped[str] = mapped_column(String(20))
    # Horário em UTC (sem fuso); convertido para o fuso local na resposta.
    registrado_em: Mapped[datetime] = mapped_column(DateTime, index=True)
    comprovante: Mapped[str] = mapped_column(String(20), unique=True)
    distancia: Mapped[float]
    terminal: Mapped[str | None] = mapped_column(String(60))
    local: Mapped[str | None] = mapped_column(String(80))

    funcionario: Mapped[Funcionario] = relationship(back_populates="registros")
