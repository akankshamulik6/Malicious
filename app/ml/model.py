import json
from pathlib import Path

import onnxruntime as ort


MODEL_DIR = Path("model")
MODEL_PATH = MODEL_DIR / "efficientnet_v2_s_best.onnx"
CLASSES_PATH = MODEL_DIR / "classes.json"


class CropDiseaseModel:
    def __init__(self):
        self.session = None
        self.classes = []
        self.model_available = False

        if MODEL_PATH.exists() and CLASSES_PATH.exists():
            with open(CLASSES_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.classes = data["classes"]

            self.session = ort.InferenceSession(
                str(MODEL_PATH),
                providers=["CPUExecutionProvider"],
            )

            self.model_available = True

    def predict(self, tensor):
        if not self.model_available:
            raise RuntimeError("MODEL_NOT_AVAILABLE")

        input_name = self.session.get_inputs()[0].name
        outputs = self.session.run(
            None,
            {input_name: tensor},
        )

        return outputs[0][0]


model = CropDiseaseModel()
