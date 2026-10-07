"""Respostas da API em camelCase, no formato usado pelo frontend."""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class Schema(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Employee(Schema):
    """Mesmo formato do tipo `Employee` em frontend/src/data/employees.ts."""

    id: str
    name: str
    photo: str | None
    department: str
    role: str
    schedule: str
    schedule_days: str
    face: Literal["configurada", "pendente"]
    status: Literal["ativo", "inativo"]


class EmployeeDetail(Employee):
    cpf: str
    email: str
    phone: str | None
    admission_date: date
    unit: str
    face_configured_at: datetime | None


class EmployeePage(Schema):
    items: list[Employee]
    total: int
    page: int
    page_size: int


class EmployeeTotals(Schema):
    registered: int
    active: int
    inactive: int
    face_configured: int
    face_pending: int


class QualityCheck(Schema):
    label: str
    ok: bool


class FaceValidation(Schema):
    valid: bool
    message: str
    checks: list[QualityCheck]


PunchType = Literal["entrada", "saida_intervalo", "retorno_intervalo", "saida"]


class Punch(Schema):
    id: int
    employee: Employee
    type: PunchType
    type_label: str
    registered_at: datetime
    receipt: str
    terminal: str | None
    location: str | None


class PunchResult(Punch):
    # True quando a leitura repete um registro feito há instantes (nada novo foi gravado).
    duplicate: bool = False
