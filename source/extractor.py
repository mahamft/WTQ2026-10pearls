import os
import json
from pathlib import Path
from PIL import Image
from dotenv import load_dotenv
from google import genai
from google.genai import types
try:
    from .models import BillLevel1Extraction
    from .prompts import LEVEL1_SYSTEM_PROMPT
except ImportError:
    from models import BillLevel1Extraction
    from prompts import LEVEL1_SYSTEM_PROMPT

load_dotenv()

def get_gemini_client():
    api_key = os.getenv("API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("API_KEY or GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)

def extract_level1(image_path: str, model_name: str = None) -> BillLevel1Extraction:
    """
    Extract Level 1 bill details from an image using Gemini multimodal structured output.
    """
    if model_name is None:
        model_name = os.getenv("MODEL_NAME", "gemini-3.5-flash-lite")

    client = get_gemini_client()
    image = Image.open(image_path)

    prompt = (
        "Extract all Level 1 billing fields from this Pakistani electricity bill image according to the schema. "
        "Strictly adhere to the extraction rules and classifications."
    )

    response = client.models.generate_content(
        model=model_name,
        contents=[image, prompt],
        config=types.GenerateContentConfig(
            system_instruction=LEVEL1_SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=BillLevel1Extraction,
            temperature=0.1,
        )
    )

    raw_text = response.text.strip()
    data = json.loads(raw_text)
    validated_extraction = BillLevel1Extraction(**data)
    return validated_extraction

if __name__ == "__main__":
    sample_img = r"C:\Users\hp\OneDrive\Desktop\WTQ2026\extracted\WTQ Build _26\train\bills\KESC_0008.png"
    print(f"Testing Level 1 extraction on {sample_img}...")
    res = extract_level1(sample_img)
    print(res.model_dump_json(indent=2))
