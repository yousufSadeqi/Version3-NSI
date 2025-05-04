import cv2
import pytesseract
import re
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import requests
from io import BytesIO
import socket
from urllib.parse import urlparse
from datetime import datetime
from base64 import b64decode

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "*",
    "allow_headers": ["Content-Type", "Authorization", "Accept"],
    "methods": ["GET", "POST", "OPTIONS"],
    "expose_headers": ["Content-Type", "X-Requested-With"]
}})

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

@app.route('/')
def home():
    return jsonify({'status': 'success', 'message': 'Receipt processing server is running', 'server_status': 'online'})

@app.route('/test')
def test():
    return jsonify({'status': 'success', 'message': 'Server is healthy', 'server_status': 'online'})

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'success',
        'message': 'Server is healthy',
        'server_status': 'online',
        'server_ip': socket.gethostbyname(socket.gethostname()),
        'client_ip': request.remote_addr,
        'tesseract_status': 'available' if pytesseract.get_tesseract_version() else 'unavailable'
    })



def download_image(url):
    '''
    Todo// Documentation, enhancing the function, removing all the debugging loggers 
    '''
    try:
        logger.info(f"Attempting to download image from URL: {url}")
    
        if url.startswith('data:image'):
            logger.info("Detected base64 image data")
            base64_data = url.split(',')[1]
            return BytesIO(requests.utils.base64_to_bytes(base64_data))

        parsed_url = urlparse(url)
        if not parsed_url.scheme:
            url = 'https://' + url
            logger.info(f"Added URL: {url}")
            
        response = requests.get(url)
        if response.status_code == 200:
            logger.info(f"Content-Type: {response.headers.get('Content-Type')}")
            return BytesIO(response.content)
        else:
            logger.error(f"Failed to download image {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error downloading image: {e}")
        return None

def preprocess_image(image):
    '''
    Documentation 
    '''
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
    gray = cv2.fastNlMeansDenoising(gray, h=30)
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 2
    )
    return thresh

def extract_text(image):
    '''
    Todo // Write the French documentation and comments, and enhance Tesseract's ability to read text more accurately
    '''
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    text = pytesseract.image_to_string(gray)
    return text


def determine_category(merchant, items):
    '''
    Todo// Documentation
    '''
    categories = {
        'food': ['restaurant', 'cafe', 'diner', 'food', 'meal', 'bar', 'pub'],
        'groceries': ['market', 'grocery', 'supermarket', 'store'],
        'shopping': ['store', 'mall', 'retail', 'shop'],
        'transportation': ['taxi', 'uber', 'lyft', 'transport'],
        'utilities': ['electric', 'water', 'gas', 'utility'],
        'entertainment': ['cinema', 'movie', 'theater', 'concert'],
    }

    merchant_lower = ""
    if merchant: 
        merchant_lower = merchant.lower()

    for category in categories:
        keywords = categories[category]
        for keyword in keywords:
            if keyword in merchant_lower:
                return category
            
    for item in items:
        item_name = ""
        if 'name' in item:
            item_name = item['name']

        for category in categories:
            keywords = categories[category]
            for keyword in keywords:
                if keyword in item_name:
                    return category

    return 'other'


def parse_items(text):
    '''
    Todo// Documentation and enhancing the function 
    '''
    lines = text.split("\n")
    items = []

    digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]

    invalid_item = [
        "subtotal", "total", "grand total", "tax", "vat", "sales tax", "service charge", "delivery fee", "tip", "change", "cash", "card",
        "credit", "debit", "payment", "balance", "discount", "coupon", "loyalty points", "reward", "refunded", "refund", "invoice", "receipt",
        "order number", "transaction id", "authorization code", "cashier", "server", "table", "terminal", "store", "address", "city", "state",
        "zip", "country", "phone", "tel", "fax", "website", "email", "date", "time", "thanks", "thank you", "have a nice day", "welcome",
        "visit again", "terms", "conditions", "policy", "signature", "customer copy", "merchant copy", "restapayer", "tva", "=", "1compléte",
        "|", "100%", "10%", "frais", "order", "code", "due", "payer", "paid", "ref", "reference", "numero", "voucher", "gift", "promo",
        "extra", "bonus", "savings", "invalid", "error", "return", "exchange", "ticket"
    ]

    for line in lines:
        line = line.strip()
        words = line.split()

        if len(words) >= 2:
            last_word = words[-1]
            if "." in last_word:
                price_str = last_word
                price_chars = []
                for chara in price_str:
                    if chara in digits or chara == '.':
                        price_chars.append(chara)

                if len(price_chars) == len(price_str):
                    price = float(price_str.replace("$", ""))
                    name_parts = []
                    for word in words[:-1]:
                        if word not in digits and not len(word) <= 2:
                            name_parts.append(word)
                    name = " ".join(name_parts)
                        
                    is_invalid = False
                    for invalid in invalid_item:
                        if invalid in name.lower():
                            is_invalid = True
                            break

                    if not is_invalid:
                        items.append({"name": name, "price": price})
    return items


def parse_total(text):
    '''
    Todo//documentation
    '''
    lines = text.split("\n")
    items = []
    total = None

    digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
    for line in lines:
        line = line.strip()
        words = line.split()
        if len(words) >= 2:
            # last_word = words[-1]   useless 
            if 'TOTAL' in ' '.join(words).upper():
                for word in words:
                    print(word)
                    if word in digits or '.' in word or ',' in word:
                        total = word
    return total

def parse_date(text):
    '''
    Todo// Documentation
    '''
    lines = text.split("\n")
    date = None

    for line in lines:
        line = line.strip()
        words = line.split()
        if len(words) >= 2:
            if 'date' in ''.join(words).upper() or '/' in ''.join(words):
                for word in words:
                    if word in 'date':
                        date = word
    return date

def parse_title(text):
    '''
    Todo// Documentation
    '''
    return text.split("\n")[0]

def create_description(text, merchant=None, amount=0, date=None, items=None):
    '''
    Todo // Documentation 
    '''
    if merchant is None:
        merchant = parse_title(text)

    if date is None:
        date = parse_date(text)

    if items is None:
        items = parse_items(text)
    
    description = f"Receipt from {merchant}"
    
    if amount > 0:
        description += f" for ${amount:.2f}"
    
    description += f"Date: {date}"
    
    if items and len(items) > 0:
        description += "Items detected:"
        for item in items:
            description += f" - {item['name']}: ${item['price']}"
    else:
        description += "No items detected."
    
    if amount <= 0:
        description += "Total amount not detected."
    
    return description

@app.route('/process-receipt', methods=['POST', 'OPTIONS'])
def process_receipt():
    '''
    Documentation
    '''
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        image_url = data.get('image_url')

        if not image_url:
            return jsonify({'success': False, 'error': 'No image_url provided'}), 400

        logger.info(f"Received image input: {image_url[:30]}...")
        if image_url.startswith('data:image'):
            try:
                header, base64_data = image_url.split(',', 1)
                image_data = BytesIO(b64decode(base64_data))
            except Exception as e:
                logger.error(f"Failed to decode base64 image: {e}")
                return jsonify({'success': False, 'error': 'Invalid base64 image data'}), 400
        else:
            logger.warning("Received non-base64 URL. Attempting download...")
            image_data = download_image(image_url)
            if not image_data:
                return jsonify({'success': False, 'error': 'Image download failed'}), 400

        image_array = np.asarray(bytearray(image_data.read()), dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if image is None:
            return jsonify({'success': False, 'error': 'Image decoding failed'}), 400

        processed = preprocess_image(image)
        text = extract_text(processed)
        items = parse_items(text)

        # Parse total and safely convert to float
        raw_amount = parse_total(text)
        try:
            amount = float(raw_amount.replace(',', '.')) if raw_amount else 0
        except ValueError:
            logger.warning(f"Could not parse amount: {raw_amount}")
            amount = 0

        date = parse_date(text)
        merchant = parse_title(text)
        category = determine_category(merchant, items)
        description = create_description(text, merchant, amount, date, items)

        response_data = {
            'success': True,
            'data': {
                'merchant': merchant,
                'amount': amount,
                'date': date,
                'description': description,
                'category': category,
                'raw_text': text,
                'items': items
            }
        }

        logger.info("Receipt processing complete")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Processing error: {e}")
        return jsonify({'success': False, 'error': str(e), 'serverStatus': 'online'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

