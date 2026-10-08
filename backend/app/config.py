import os
from pathlib import Path
from zoneinfo import ZoneInfo

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("PONTO_DATA_DIR", BASE_DIR / "data"))
PHOTOS_DIR = DATA_DIR / "fotos"

DATABASE_URL = os.getenv("PONTO_DATABASE_URL", f"sqlite:///{DATA_DIR / 'ponto.db'}")

CORS_ORIGINS = os.getenv("PONTO_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

TIMEZONE = ZoneInfo(os.getenv("PONTO_TIMEZONE", "America/Sao_Paulo"))

MAX_UPLOAD_BYTES = 5 * 1024 * 1024

# Reconhecimento facial (DeepFace)
FACE_MODEL = os.getenv("PONTO_FACE_MODEL", "Facenet512")
FACE_DETECTOR = os.getenv("PONTO_FACE_DETECTOR", "retinaface")
# Distância de cosseno máxima para considerar o rosto reconhecido.
# Vazio = limiar padrão do DeepFace para o modelo escolhido.
FACE_THRESHOLD = float(os.environ["PONTO_FACE_THRESHOLD"]) if os.getenv("PONTO_FACE_THRESHOLD") else None
# Detecção de fotos/telas apresentadas à câmera (requer `pip install torch`).
FACE_ANTI_SPOOFING = os.getenv("PONTO_FACE_ANTI_SPOOFING", "false").lower() == "true"

# Intervalo em que uma nova leitura do mesmo funcionário não gera outro registro.
PUNCH_COOLDOWN_SECONDS = int(os.getenv("PONTO_PUNCH_COOLDOWN_SECONDS", "60"))
