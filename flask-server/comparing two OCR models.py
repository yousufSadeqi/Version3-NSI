import cv2
import numpy as np
import pytesseract
import easyocr
import requests
from io import BytesIO
from base64 import b64decode

# Load OCR engines
easyocr_reader = easyocr.Reader(['en'], gpu=False)


def download_image(url):
    '''
    Télécharge une image depuis une URL ou base64.
    '''
    try:
        if url.startswith('data:image'):
            base64_data = url.split(',')[1]
            return BytesIO(b64decode(base64_data))
        response = requests.get(url)
        if response.status_code == 200:
            return BytesIO(response.content)
        return None
    except Exception as e:
        print(f"Error downloading image: {e}")
        return None

def run_tesseract(image):
    config = r'--oem 3 --psm 6'
    return pytesseract.image_to_string(image, config=config)

def run_easyocr(image):
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = easyocr_reader.readtext(image_rgb)

    formatted_text = ""
    last_bottom = None  

    for result in results:
        text = result[1]
        (top_left, top_right, bottom_right, bottom_left) = result[0]
        
        if last_bottom and top_left[1] > last_bottom:
            formatted_text += "\n"  
        
        formatted_text += text + " "
        last_bottom = bottom_left[1] 
    
    return formatted_text

def compare_ocr(image_url):
    img_data = download_image(image_url)
    if img_data is None:
        print("Failed to load image.")
        return

    file_bytes = np.asarray(bytearray(img_data.read()), dtype=np.uint8)
    image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    print("\n========== TESSERACT OCR ==========")
    print(run_tesseract(image))

    print("\n========== EASYOCR ==========")
    print(run_easyocr(image))


# Example usage
if __name__ == "__main__":
    test_image_url = "http://res.cloudinary.com/dcijqmjst/image/upload/v1746887085/Receipt%20Photos/b70tj947gumnzuuq2r2q.jpg"  # Replace with your test image
    compare_ocr(test_image_url)
