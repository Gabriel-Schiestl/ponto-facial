from fastapi import HTTPException, UploadFile, status

from .config import MAX_UPLOAD_BYTES

IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png"}


def read_image(upload: UploadFile, field: str) -> bytes:
    if upload.content_type not in IMAGE_TYPES:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            {"message": f"O campo '{field}' deve ser uma imagem JPG ou PNG."},
        )
    data = upload.file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            413,
            {"message": f"O campo '{field}' excede o limite de 5 MB."},
        )
    return data
