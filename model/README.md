 # Crop Disease Classification Model

Model: EfficientNetV2-S
Runtime: ONNX Runtime
Input: 224x224 RGB
Output: 38 classes
Confidence threshold: 0.60

Download model files using:

    python scripts/download_model.py

The model was trained using PlantVillage data. Real-world field performance may differ.

Grad-CAM is currently unavailable because inference uses ONNX Runtime.
