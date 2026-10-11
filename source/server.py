import os
import io
import json
import base64
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

# Import pipeline components
from models import BillLevel1Extraction
from extractor import extract_level1
from answerer import answer_question
from pipeline import run_level1, run_level2

app = Flask(__name__, static_folder="static")
CORS(app)

BASE_DIR = Path(__file__).resolve().parent.parent
TRAIN_BILLS_DIR = BASE_DIR / "extracted" / "WTQ Build _26" / "train" / "bills"
if not TRAIN_BILLS_DIR.exists():
    TRAIN_BILLS_DIR = BASE_DIR / "train" / "bills"

TEST_BILLS_DIR = BASE_DIR / "extracted" / "WTQ Build _26" / "test" / "bills"
if not TEST_BILLS_DIR.exists():
    TEST_BILLS_DIR = BASE_DIR / "test" / "bills"

TEST_CSV_DIR = BASE_DIR / "extracted" / "WTQ Build _26" / "test" / "csv"
if not TEST_CSV_DIR.exists():
    TEST_CSV_DIR = BASE_DIR / "test" / "csv"

OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Cache extracted results in-memory
extractions_cache = {}

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route("/output/<filename>")
def download_output(filename):
    file_path = OUTPUT_DIR / filename
    if file_path.exists():
        return send_file(file_path, as_attachment=True)
    return jsonify({"error": "Output file not found"}), 404

@app.route("/api/bills", methods=["GET"])
def list_bills():
    bills = []
    # Training bills
    if TRAIN_BILLS_DIR.exists():
        for f in sorted(TRAIN_BILLS_DIR.glob("*.*")):
            if f.suffix.lower() in [".png", ".jpg", ".jpeg"]:
                bills.append({
                    "id": f.stem,
                    "filename": f.name,
                    "type": "train",
                    "path": str(f)
                })
    # Test bills
    if TEST_BILLS_DIR.exists():
        for f in sorted(TEST_BILLS_DIR.glob("*.*")):
            if f.suffix.lower() in [".png", ".jpg", ".jpeg"]:
                bills.append({
                    "id": f.stem,
                    "filename": f.name,
                    "type": "test",
                    "path": str(f)
                })
    # Uploaded bills
    for f in sorted(UPLOAD_DIR.glob("*.*")):
        if f.suffix.lower() in [".png", ".jpg", ".jpeg"]:
            bills.append({
                "id": f.stem,
                "filename": f.name,
                "type": "upload",
                "path": str(f)
            })
    return jsonify({"bills": bills})

@app.route("/api/bill_image/<bill_id>", methods=["GET"])
def get_bill_image(bill_id):
    # Search in train, test, and uploads
    for d in [TRAIN_BILLS_DIR, TEST_BILLS_DIR, UPLOAD_DIR]:
        if d.exists():
            for f in d.glob(f"{bill_id}.*"):
                return send_file(f)
    return jsonify({"error": "Image not found"}), 404

@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    
    file_path = UPLOAD_DIR / file.filename
    file.save(str(file_path))
    bill_id = file_path.stem
    return jsonify({
        "id": bill_id,
        "filename": file.filename,
        "type": "upload",
        "path": str(file_path)
    })

@app.route("/api/extract", methods=["POST"])
def extract():
    data = request.json or {}
    bill_id = data.get("bill_id")
    file_path = data.get("path")
    
    if not file_path:
        for d in [TRAIN_BILLS_DIR, TEST_BILLS_DIR, UPLOAD_DIR]:
            if d.exists():
                for f in d.glob(f"{bill_id}.*"):
                    file_path = str(f)
                    break
            if file_path:
                break
                
    if not file_path or not Path(file_path).exists():
        return jsonify({"error": f"Bill file not found for {bill_id}"}), 404

    try:
        extraction = extract_level1(file_path)
        extractions_cache[bill_id] = extraction
        return jsonify({
            "bill_id": bill_id,
            "data": extraction.model_dump(),
            "json_string": extraction.model_dump_json(indent=2),
            "csv_cell": extraction.model_dump_json()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/ask", methods=["POST"])
def ask():
    data = request.json or {}
    bill_id = data.get("bill_id")
    question = data.get("question")
    file_path = data.get("path")

    if not file_path:
        for d in [TRAIN_BILLS_DIR, TEST_BILLS_DIR, UPLOAD_DIR]:
            if d.exists():
                for f in d.glob(f"{bill_id}.*"):
                    file_path = str(f)
                    break
            if file_path:
                break

    if not file_path or not Path(file_path).exists():
        return jsonify({"error": "Bill image not found"}), 404
    if not question:
        return jsonify({"error": "Question is required"}), 400

    extraction = extractions_cache.get(bill_id)
    try:
        answer = answer_question(file_path, question, extraction)
        return jsonify({
            "bill_id": bill_id,
            "question": question,
            "answer": answer
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/run_batch", methods=["POST"])
def run_batch():
    try:
        l1_in = TEST_CSV_DIR / "level1.csv"
        l2_in = TEST_CSV_DIR / "level2.csv"
        l1_out = OUTPUT_DIR / "level1.csv"
        l2_out = OUTPUT_DIR / "level2.csv"

        extractions = {}
        if l1_in.exists():
            extractions = run_level1(TEST_BILLS_DIR, l1_in, l1_out)
        if l2_in.exists():
            run_level2(TEST_BILLS_DIR, l2_in, l2_out, extractions)

        return jsonify({"status": "success", "message": "Batch pipeline completed successfully"})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == "__main__":
    print("Starting VoltIQ Utility Intelligence Dashboard on http://localhost:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=False)
