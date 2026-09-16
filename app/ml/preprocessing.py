import numpy as np
from PIL import Image


IMAGE_SIZE = (224, 224)

MEAN = np.array(
    [0.485, 0.456, 0.406],
    dtype=np.float32,
)

STD = np.array(
    [0.229, 0.224, 0.225],
    dtype=np.float32,
)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    from io import BytesIO

    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    image = image.resize(
        IMAGE_SIZE,
        Image.Resampling.BILINEAR,
    )

    arr = np.array(image, dtype=np.float32) / 255.0

    arr = (arr - MEAN) / STD

    arr = np.transpose(arr, (2, 0, 1))

    tensor = np.expand_dims(arr, axis=0).astype(np.float32)

    return tensor
