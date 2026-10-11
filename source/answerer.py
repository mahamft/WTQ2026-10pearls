import os
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from google import genai
# pyrefly: ignore [missing-import]
from google.genai import types
try:
    from .models import BillLevel1Extraction
    from .prompts import LEVEL2_SYSTEM_PROMPT
except ImportError:
    from models import BillLevel1Extraction
    from prompts import LEVEL2_SYSTEM_PROMPT

load_dotenv()

def get_gemini_client():
    api_key = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API_KEY or GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)

def answer_question(
    image_path: str,
    question: str,
    extraction: BillLevel1Extraction = None,
    model_name: str = None
) -> str:
    """
    Generate a Level 2 answer grounded in the bill image and extracted data.
    """
    if model_name is None:
        model_name = os.getenv("MODEL_NAME", "gemini-3.5-flash-lite")

    client = get_gemini_client()
    image = Image.open(image_path)

    context_text = ""
    if extraction:
        context_text = f"\nExtracted Bill Details (JSON):\n{extraction.model_dump_json(indent=2)}\n"

    prompt = f"""You are answering the following customer question about this electricity bill.
{context_text}
Question: {question}

Provide a direct, complete, and well-grounded answer in plain English following all answering rules.
"""

    response = client.models.generate_content(
        model=model_name,
        contents=[image, prompt],
        config=types.GenerateContentConfig(
            system_instruction=LEVEL2_SYSTEM_PROMPT,
            temperature=0.2,
        )
    )

    return response.text.strip()

if __name__ == "__main__":
    from extractor import extract_level1
    sample_img = r"C:\Users\hp\OneDrive\Desktop\WTQ2026\extracted\WTQ Build _26\train\bills\KESC_0008.png"
    extraction = extract_level1(sample_img)
    
    q1 = "How much of my bill is taxes?"
    q2 = "How many months in my history went above 200 units?"
    
    print("Q1:", q1)
    print("A1:", answer_question(sample_img, q1, extraction))
    print("\nQ2:", q2)
    print("A2:", answer_question(sample_img, q2, extraction))
