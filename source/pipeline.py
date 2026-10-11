import os
import sys
import csv
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv

try:
    from .extractor import extract_level1
    from .answerer import answer_question
    from .models import BillLevel1Extraction
except ImportError:
    from extractor import extract_level1
    from answerer import answer_question
    from models import BillLevel1Extraction

load_dotenv()

def find_bill_file(bills_dir: Path, bill_id: str) -> Path:
    """Find the image file corresponding to bill_id (.png, .jpg, .jpeg, etc.)"""
    for ext in [".png", ".jpg", ".jpeg", ".PNG", ".JPG", ".JPEG"]:
        file_path = bills_dir / f"{bill_id}{ext}"
        if file_path.exists():
            return file_path
    # Fallback search matching prefix
    matches = list(bills_dir.glob(f"{bill_id}.*"))
    if matches:
        return matches[0]
    raise FileNotFoundError(f"Bill image not found for bill_id '{bill_id}' in {bills_dir}")

def run_level1(bills_dir: Path, input_csv: Path, output_csv: Path):
    """
    Process Level 1: Read input level1.csv template, extract JSON for each bill, and write to output_csv.
    Ensures single-line JSON with standard CSV quoting.
    """
    print(f"\n--- Running Level 1 Extraction ---")
    print(f"Bills Directory: {bills_dir}")
    print(f"Template CSV: {input_csv}")
    print(f"Output CSV: {output_csv}")

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    extractions = {}

    rows_to_process = []
    with open(input_csv, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows_to_process.append(row)

    results = []
    for row in rows_to_process:
        bill_id = row["bill_id"].strip()
        print(f"Processing Level 1 for bill: {bill_id}...")
        try:
            image_path = find_bill_file(bills_dir, bill_id)
            extraction = extract_level1(str(image_path))
            extractions[bill_id] = extraction
            
            # Format JSON as a single line string
            json_str = extraction.model_dump_json(exclude_none=False)
            results.append({"bill_id": bill_id, "json": json_str})
            print(f"Successfully extracted Level 1 for {bill_id}")
        except Exception as e:
            print(f"Error extracting Level 1 for {bill_id}: {e}")
            results.append({"bill_id": bill_id, "json": "{}"})

    with open(output_csv, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["bill_id", "json"], quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for res in results:
            writer.writerow(res)

    print(f"Level 1 extraction complete! Saved to {output_csv}")
    return extractions

def run_level2(bills_dir: Path, input_csv: Path, output_csv: Path, extractions: dict = None):
    """
    Process Level 2: Read input level2.csv template, generate answer for each row, and write to output_csv.
    """
    print(f"\n--- Running Level 2 Q&A Answering ---")
    print(f"Bills Directory: {bills_dir}")
    print(f"Template CSV: {input_csv}")
    print(f"Output CSV: {output_csv}")

    output_csv.parent.mkdir(parents=True, exist_ok=True)

    rows_to_process = []
    with open(input_csv, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows_to_process.append(row)

    results = []
    for i, row in enumerate(rows_to_process):
        bill_id = row["bill_id"].strip()
        qid = row.get("question_id", "").strip()
        question = row.get("question", "").strip()
        print(f"[{i+1}/{len(rows_to_process)}] Answering {bill_id} ({qid}): {question[:40]}...")
        
        try:
            image_path = find_bill_file(bills_dir, bill_id)
            extraction = extractions.get(bill_id) if extractions else None
            ans = answer_question(str(image_path), question, extraction)
            results.append({
                "bill_id": bill_id,
                "question_id": qid,
                "question": question,
                "answer": ans
            })
        except Exception as e:
            print(f"Error answering {bill_id} ({qid}): {e}")
            results.append({
                "bill_id": bill_id,
                "question_id": qid,
                "question": question,
                "answer": "Information could not be extracted from the bill."
            })

    with open(output_csv, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["bill_id", "question_id", "question", "answer"], quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for res in results:
            writer.writerow(res)

    print(f"Level 2 answers complete! Saved to {output_csv}")

def main():
    parser = argparse.ArgumentParser(description="WTQ 2026 Utility Bill Decoder Pipeline")
    parser.add_argument("--bills_dir", type=str, default="test/bills", help="Directory containing bill images")
    parser.add_argument("--test_csv_dir", type=str, default="test/csv", help="Directory containing level1.csv and level2.csv templates")
    parser.add_argument("--output_dir", type=str, default="output", help="Directory where final CSVs will be saved")
    parser.add_argument("--level", type=int, choices=[1, 2, 0], default=0, help="Run Level 1 (1), Level 2 (2), or Both (0)")

    args = parser.parse_args()

    bills_dir = Path(args.bills_dir)
    test_csv_dir = Path(args.test_csv_dir)
    output_dir = Path(args.output_dir)

    extractions = {}

    if args.level in (0, 1):
        l1_in = test_csv_dir / "level1.csv"
        l1_out = output_dir / "level1.csv"
        if l1_in.exists():
            extractions = run_level1(bills_dir, l1_in, l1_out)
        else:
            print(f"Warning: {l1_in} not found.")

    if args.level in (0, 2):
        l2_in = test_csv_dir / "level2.csv"
        l2_out = output_dir / "level2.csv"
        if l2_in.exists():
            run_level2(bills_dir, l2_in, l2_out, extractions)
        else:
            print(f"Warning: {l2_in} not found.")

if __name__ == "__main__":
    main()
