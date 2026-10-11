# WTQ Build Track 2026: Utility Bill Decoder

An AI-powered assistant that reads Pakistani utility bills (K-Electric, LESCO, IESCO), extracts structured billing data (Level 1), and answers customer queries with grounded calculations and explanations (Level 2).

Includes both a CLI batch processing pipeline and an interactive Web UI dashboard.

---

## 1. Runtime Environment
* **Python Version:** Python 3.12+ (Tested on Python 3.14)

---

## 2. Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd WTQ2026
   ```

2. **Create and Activate Virtual Environment:**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r source/requirements.txt
   ```

4. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and insert your Google AI Studio API key:
   ```bash
   # On Windows (PowerShell):
   Copy-Item .env.example .env
   # On Linux/macOS:
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   MODEL_PROVIDER=google
   MODEL_NAME=gemini-3.5-flash-lite
   API_KEY=your-api-key-here
   ```

---

## 3. How to Run

### Option A: Interactive Web UI
To launch the interactive web dashboard:
```bash
cd source
python server.py
```
Open your browser and visit: `http://localhost:5000`

### Option B: Batch CLI Pipeline
To run the automated extraction and Q&A pipeline over test bills and generate output CSVs:
```bash
cd source
python pipeline.py --bills_dir ../test/bills --test_csv_dir ../test/csv --output_dir ../output
```

#### Pipeline Options:
* `--bills_dir`: Path to folder containing bill images (default: `../test/bills`).
* `--test_csv_dir`: Path to folder containing input CSV templates (default: `../test/csv`).
* `--output_dir`: Path where output `level1.csv` and `level2.csv` will be saved (default: `../output`).
* `--level`: Run Level 1 only (`1`), Level 2 only (`2`), or both (`0`, default).

---

## 4. AI Usage Section

* **Models & APIs:**
  * `gemini-3.5-flash-lite` (Google AI Studio) - Multimodal vision understanding, structured JSON schema extraction, and Q&A inference.
* **Services:**
  * Google AI Studio / Google GenAI SDK.
* **AI Coding Assistants:**
  * Antigravity AI Assistant - Architecture scaffolding, schema validation, and pipeline automation.
* **OCR / Commercial Services:**
  * Proprietary OCR/Invoice extraction cloud services (Azure Prebuilt Invoice, AWS Textract, Mindee): **None**
