"""Detecção, validação de qualidade e reconhecimento facial com DeepFace."""

import logging
import math
import threading
from dataclasses import dataclass

import cv2
import numpy as np
from deepface import DeepFace

from . import config

logger = logging.getLogger(__name__)

# Os modelos do DeepFace não são seguros para chamadas concorrentes.
_lock = threading.Lock()

MIN_FACE_PX = 80
BRIGHTNESS_RANGE = (50, 210)
MIN_SHARPNESS = 25.0
MAX_EYE_TILT_DEG = 20.0
# Posição horizontal aceitável do ponto médio dos olhos dentro do rosto (desvio de perfil).
EYE_CENTER_RANGE = (0.35, 0.65)


class FaceError(Exception):
    def __init__(self, message: str, checks: list["QualityCheck"] | None = None):
        super().__init__(message)
        self.message = message
        self.checks = checks or []


@dataclass
class QualityCheck:
    label: str
    ok: bool


@dataclass
class Face:
    embedding: np.ndarray
    area: dict
    confidence: float


def _threshold() -> float:
    if config.FACE_THRESHOLD is not None:
        return config.FACE_THRESHOLD
    try:
        from deepface.modules.verification import find_threshold

        return float(find_threshold(config.FACE_MODEL, "cosine"))
    except Exception:
        return 0.30


THRESHOLD = _threshold()


def warmup() -> None:
    """Carrega modelo e detector para que a primeira leitura não demore."""
    blank = np.zeros((224, 224, 3), dtype=np.uint8)
    with _lock:
        DeepFace.represent(
            img_path=blank,
            model_name=config.FACE_MODEL,
            detector_backend=config.FACE_DETECTOR,
            enforce_detection=False,
        )
    logger.info("DeepFace pronto: modelo=%s detector=%s limiar=%.3f",
                config.FACE_MODEL, config.FACE_DETECTOR, THRESHOLD)


def decode_image(data: bytes) -> np.ndarray:
    image = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise FaceError("Não foi possível ler a imagem enviada. Use JPG ou PNG.")
    return image


def _normalize(vector: list[float]) -> np.ndarray:
    array = np.asarray(vector, dtype=np.float32)
    return array / np.linalg.norm(array)


def detect_faces(image: np.ndarray) -> list[Face]:
    try:
        with _lock:
            results = DeepFace.represent(
                img_path=image,
                model_name=config.FACE_MODEL,
                detector_backend=config.FACE_DETECTOR,
                enforce_detection=True,
                align=True,
                anti_spoofing=config.FACE_ANTI_SPOOFING,
            )
    except ValueError as error:
        if "spoof" in str(error).lower():
            raise FaceError("A imagem parece ser uma foto ou tela, não um rosto ao vivo.") from error
        raise FaceError("Nenhum rosto detectado na imagem.") from error

    return [
        Face(
            embedding=_normalize(result["embedding"]),
            area=result["facial_area"],
            confidence=float(result.get("face_confidence") or 0),
        )
        for result in results
    ]


def _crop(image: np.ndarray, area: dict) -> np.ndarray:
    x, y = max(area["x"], 0), max(area["y"], 0)
    return image[y : y + area["h"], x : x + area["w"]]


def _lighting_ok(image: np.ndarray, area: dict) -> bool:
    crop = _crop(image, area)
    if crop.size == 0:
        return False
    gray = cv2.cvtColor(cv2.resize(crop, (160, 160)), cv2.COLOR_BGR2GRAY)
    brightness = float(gray.mean())
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    return BRIGHTNESS_RANGE[0] <= brightness <= BRIGHTNESS_RANGE[1] and sharpness >= MIN_SHARPNESS


def _frontal_ok(area: dict) -> bool:
    if area["w"] < MIN_FACE_PX or area["h"] < MIN_FACE_PX:
        return False
    left, right = area.get("left_eye"), area.get("right_eye")
    if not left or not right:
        # Detector não devolveu os olhos: sinal de rosto de perfil ou obstruído.
        return False
    dx, dy = right[0] - left[0], right[1] - left[1]
    tilt = math.degrees(math.atan2(abs(dy), abs(dx) or 1))
    center = ((left[0] + right[0]) / 2 - area["x"]) / area["w"]
    return tilt <= MAX_EYE_TILT_DEG and EYE_CENTER_RANGE[0] <= center <= EYE_CENTER_RANGE[1]


def capture_for_enrollment(image: np.ndarray) -> tuple[np.ndarray, list[QualityCheck]]:
    """Valida a captura de cadastro e devolve o vetor facial.

    Os critérios são os mesmos exibidos na tela de cadastro. Lança FaceError
    com a lista de verificações quando algum critério falha.
    """
    faces = detect_faces(image)
    face = max(faces, key=lambda f: f.area["w"] * f.area["h"])
    checks = [
        QualityCheck("Um único rosto detectado", len(faces) == 1),
        QualityCheck("Iluminação e nitidez adequadas", _lighting_ok(image, face.area)),
        QualityCheck("Rosto de frente, sem obstruções", _frontal_ok(face.area)),
    ]
    if not all(check.ok for check in checks):
        raise FaceError("A captura não atende aos critérios de qualidade.", checks)
    return face.embedding, checks


def identify(image: np.ndarray, candidates: dict[str, list[float]]) -> tuple[str, float] | None:
    """Compara o maior rosto da imagem com os vetores cadastrados.

    Retorna (matrícula, distância) do funcionário mais próximo dentro do
    limiar, ou None quando ninguém é reconhecido.
    """
    if not candidates:
        return None
    face = max(detect_faces(image), key=lambda f: f.area["w"] * f.area["h"])

    ids = list(candidates)
    matrix = np.stack([_normalize(candidates[i]) for i in ids])
    distances = 1.0 - matrix @ face.embedding
    best = int(np.argmin(distances))
    distance = float(distances[best])
    logger.info("Melhor correspondência: %s (distância %.3f, limiar %.3f)", ids[best], distance, THRESHOLD)
    return (ids[best], distance) if distance <= THRESHOLD else None
