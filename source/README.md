# WTQ Build Track 2026: Utility Bill Decoder

An AI-powered assistant that reads Pakistani utility bills (K-Electric, LESCO, IESCO), extracts structured billing data (Level 1), and answers customer queries with grounded calculations and explanations (Level 2).

## 1. Runtime Environment
* **Python Version:** Python 3.12+ (Tested on Python 3.14)

---

## 2. Setup Instructions

1. **Clone or Extract Project:**
   Ensure you are in the project root directory.

2. **Create and Activate Virtual Environment (Recommended):**
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Copy `.env.example` to `.env` and insert your Google AI Studio API key:
   ```bash
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

To run the complete pipeline (Level 1 extraction & Level 2 Q&A) on test bills and generate `output/level1.csv` and `output/level2.csv`:

```bash
python pipeline.py --bills_dir ../test/bills --test_csv_dir ../test/csv --output_dir ../output
```

### Options:
* `--bills_dir`: Path to folder containing bill images (default: `test/bills`).
* `--test_csv_dir`: Path to folder containing input CSV templates `level1.csv` and `level2.csv` (default: `test/csv`).
* `--output_dir`: Path where output `level1.csv` and `level2.csv` will be saved (default: `output`).
* `--level`: Run Level 1 only (`1`), Level 2 only (`2`), or both (`0`, default).

---

## 4. AI Usage Section

In compliance with WTQ Build Track rules, the following AI tools and models were used in building and running this project:

* **Models & APIs:**
  * `gemini-3.5-flash-lite` (Google AI Studio) - Used for multimodal vision understanding, structured JSON schema extraction, and Q&A inference.
* **Services:**
  * Google AI Studio / Google GenAI SDK.
* **AI Coding Assistants & Chatbots:**
  * Antigravity AI Assistant - Used for scaffolding project architecture, Pydantic data schemas, and pipeline automation.
* **Other Tools / Prohibited Services:**
  * Proprietary OCR/Invoice extraction cloud services (Azure Prebuilt Invoice, AWS Textract, Mindee): **none**
