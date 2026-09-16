from huggingface_hub import snapshot_download


REPO_ID = "BiernyVR/crop-disease-classifier"
MODEL_DIR = "model"

FILES = [
    "classes.json",
    "efficientnet_v2_s_best.onnx",
    "efficientnet_v2_s_best.onnx.data",
]


def main():
    print("Downloading crop disease model...")

    snapshot_download(
        repo_id=REPO_ID,
        local_dir=MODEL_DIR,
        allow_patterns=FILES,
    )

    print("Model downloaded successfully.")
    print(f"Model files are available in: {MODEL_DIR}")


if __name__ == "__main__":
    main()
