"""Baixa os pesos do reconhecimento facial antes de subir a API.

Uso: `python -m app.setup`. Os pesos ficam em `~/.deepface/weights`; quando já
existem, o DeepFace apenas os carrega.
"""

import logging
import sys

from . import config

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def main() -> int:
    from deepface import DeepFace

    steps = [
        (config.FACE_MODEL, "facial_recognition"),
        (config.FACE_DETECTOR, "face_detector"),
    ]
    if config.FACE_ANTI_SPOOFING:
        steps.append(("Fasnet", "spoofing"))

    for name, task in steps:
        logger.info("Preparando %s (%s)...", name, task)
        try:
            DeepFace.build_model(model_name=name, task=task)
        except Exception as error:  # download interrompido, sem rede etc.
            logger.error("Falha ao preparar %s: %s", name, error)
            return 1
    logger.info("Modelos de reconhecimento facial prontos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
