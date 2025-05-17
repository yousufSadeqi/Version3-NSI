import cv2
import re
# new OCR be carefull read full documentation about it 
import easyocr 
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
from dateutil import parser

# since I am trying for french receipt 
easyocr_reader = easyocr.Reader(['fr'], gpu=False)

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "*",
    "allow_headers": ["Content-Type", "Authorization", "Accept"],
    "methods": ["GET", "POST", "OPTIONS"],
    "expose_headers": ["Content-Type", "X-Requested-With"]
}})

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


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
        # 'tesseract_status': 'available' if pytesseract.get_tesseract_version() else 'unavailable'
    })

def download_image(url):
    '''
    Cette function telecharge un image à partir d'une URL ou traite les donnés d'image encodes en base64
    Paramètres:
        url (str): URL de l'image ou chaîne d'image encode en base64 
    Sortie:
        BytesIO: Les donnés de l'image sous forme de flux d'octets ou None si il y a quelque chose qui ne va pas
    '''
    try:
        logger.info(f"Attempting to download image from URL: {url}")
        
        if url.startswith('data:image'):
            base64_data = url.split(',')[1]
            return BytesIO(b64decode(base64_data))

        response = requests.get(url)
        if response.status_code == 200:
            logger.info(f"Image downloaded successfully: {response.headers.get('Content-Type')}")
            return BytesIO(response.content)
        else:
            logger.error(f"Failed to download image. Status code: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Error downloading image: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return None

# def preprocess_image(image):
#     '''
#     Cette fonction ameliore la qualité de l'image pour meilleurs resultats d'OCR.
#     Paramètres:
#         image (numpy.ndarray): Image d'entré au format BGR
#     Sortie:
#         numpy.ndarray: Image binaire traité et utilisé pour l'extraction de texte
#     '''
#     gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
#     gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_LINEAR)
#     gray = cv2.fastNlMeansDenoising(gray, h=30)
    
#     # Appliquer un seuil adaptatif pour gerer les variation illumination
#     thresh = cv2.adaptiveThreshold(
#         gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 2
#     )
    
#     return thresh

def extract_text(image):
    """
    Cette fonction extrait du texte de l'image avec Tesseract OCR.
    Paramètres:
        image (numpy.ndarray): Image preparé pour l'OCR
    Sortie:
        str: Texte extrait de l'image
    Remarque:
        Utilise le moteur LSTM (OEM 1) avec segmentation automatique de la page (PSM 1)
        pour meilleurs resultats
    """
    # Configure Tesseract for best results with receipt images
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = easyocr_reader.readtext(image_rgb)

    # Rebuild the text with line and word positions to maintain formatting
    formatted_text = ""
    last_bottom = None  # To track the last bottom of the line for detecting new lines

    for result in results:
        text = result[1]
        (top_left, top_right, bottom_right, bottom_left) = result[0]
        
        # Check if the text block is on a new line based on its vertical position (bottom of the previous block)
        if last_bottom and top_left[1] > last_bottom:
            formatted_text += "\n"  # Add a newline if the current block is on a new line
        
        formatted_text += text + " "
        last_bottom = bottom_left[1]  # Update last bottom with current block's bottom
    
    return formatted_text

def detect_receipt_language(text):
    '''
    Cette fonction detects si le reçu est en français ou en anglais en utilisant des mots clés
    parametre: 
        text(str): le text qui est en extract_text(image)
    Sortie:
        Str: Pour anglais 'english', pour 'french' et 'unknow langaug' si elle ne detecte acune langue  
    '''
    # Normalizer le text avec lower() 
    text = text.lower()

    # les mots clés en anglais et francais 
    french_keywords = [
            'total', 'date', 'produit', 'prix', 'quantité', 'remise', 'tva', 'ticket', 'facture', 'paiement', 
            'supermarché', 'magasin', 'carrefour', 'intermarché', 'e.leclerc', 'monoprix', 'auchan', 'lidl', 'casino', 
            'franprix', 'picard', 'leclerc', 'cora', 'système u', 'boulanger', 'biocoop', 'aldi', 'grand frais', 
            'marché', 'ravifruit', 'hyper u', 'edelweiss', 'super u'
        ]
    english_keywords = [
            'total', 'date', 'item', 'price', 'quantity', 'discount', 'tax', 'receipt', 'invoice', 'payment', 
            'supermarket', 'store', 'walmart', 'target', 'costco', 'sainsbury', 'tesco', 'asda', 'morrisons', 'waitrose',
            'aldi', 'iceland', 'marks and spencer', 'lidl', 'whole foods', 'best buy', 'publix', 'trader joe', 'rite aid', 
            'target', 'kroger', 'safeway', 'meijer', 'food lion', 'harris teeter', 'circle k', 'supervalu', 'big y'
        ]

    french_count = 0
    english_count = 0

    words = text.split()

    for word in words:
        if word in french_keywords:
            french_count += 1
        if word in english_keywords:
            english_count += 1

    if french_count > english_count:
        return 'french'
    elif english_count > french_count:
        return 'english'
    else:
        return 'unkown language'

def determine_category(merchant, items):
    '''
    Cette fonction determine la categorie des depenses en fonction du nom du commercant et des articles
    Paramètres:
        merchant (str): Le nom avec la quelle le text a commence ou du magasin si il dans la categories
        items (list): Liste des articles achetés avec leurs prix
    Sortie:
        str: La categorie ou 'others' si inconnue
    '''
    categories = {
    'food': [
        'restaurant', 'cafe', 'diner', 'meal', 'food', 'bar', 'pub', 'pizzeria', 'bistro', 'brasserie', 
        'buffet', 'catering', 'takeout', 'delivery', 'snack', 'grill', 'sandwich', 'pastry', 'bakery', 
        'fast food', 'salad', 'coffee', 'coffee shop', 'breakfast', 'brunch', 'lunch', 'dinner', 'tavern',
        'boucherie', 'patisserie', 'sushis', 'soupe', 'sushibar', 'plat du jour', 'bar à salade', 
        'bar à burger', 'salle à manger', 'café-restaurant', 'bistrot', 'restaurant rapide', 'pizzeria'
    ],
    'groceries': [
        'market', 'grocery', 'supermarket', 'store', 'shop', 'hypermarket', 'convenience store', 
        'corner store', 'organic store', 'butcher', 'green grocer', 'bakery', 'fruit shop', 'deli', 
        'liquor store', 'wine shop', 'corner market', 'bulk store', 'wholesale', 'discount store', 
        'grocery store', 'superette', 'épicerie', 'boucherie', 'charcuterie', 'fromagerie', 'marché', 
        'magasin d\'alimentation', 'épicerie fine', 'magasin bio', 'supermarché', 'supermarché bio'
    ],
    'shopping': [
        'store', 'mall', 'retail', 'shop', 'boutique', 'fashion', 'clothing', 'department store', 'superstore', 
        'outlet', 'shopping center', 'e-commerce', 'shopping mall', 'shopping cart', 'clothes', 'footwear', 
        'accessories', 'electronics', 'apparel', 'jewelry', 'cosmetics', 'shoes', 'bags', 'purses', 'furniture', 
        'home goods', 'appliances', 'bookstore', 'toy store', 'hardware store', 'sporting goods', 'garden store',
        'magasin', 'magasin de vêtements', 'boutique', 'panier', 'chaussures', 'pantalon', 'vêtements', 'bijoux', 
        'accessoires', 'cosmétiques', 'magasin de sport', 'boutique de mode', 'centres commerciaux', 'électroniques',
        'boutique en ligne'
    ],
    'transportation': [
        'taxi', 'uber', 'lyft', 'transport', 'bus', 'train', 'plane', 'flight', 'ride-sharing', 'car rental', 
        'subway', 'tram', 'ferry', 'bike rental', 'car hire', 'transportation', 'cab', 'chauffeur', 'shuttle', 
        'scooter', 'chauffeur privé', 'transport public', 'métro', 'train de banlieue', 'tramway', 'vélo', 
        'location de voiture', 'covoiturage', 'location de scooter', 'taxi collectif', 'moto-taxi', 'trum'
    ],
    'utilities': [
        'electric', 'water', 'gas', 'utility', 'electricity bill', 'water bill', 'gas bill', 'internet', 
        'mobile bill', 'telephone bill', 'sewer', 'cable bill', 'wifi', 'broadband', 'heating', 'cooling', 
        'electricity', 'public service', 'consommation d\'électricité', 'facture d\'eau', 'facture de gaz', 
        'facture de téléphone', 'facture d\'internet', 'facture d\'électricité', 'chauffage', 'climatisation',
        'services publics', 'gaz naturel', 'internet haut débit', 'facture internet', 'service public', 'tabac'
    ],
    'entertainment': [
        'cinema', 'movie', 'theater', 'concert', 'show', 'performance', 'sports', 'music', 'event', 'festival', 
        'art', 'gallery', 'museum', 'exhibition', 'game', 'theatre', 'play', 'live performance', 'karaoke', 
        'stand-up', 'comedy', 'circus', 'musical', 'comédie', 'spectacle', 'film', 'cinéma', 'théâtre', 'concert', 
        'musique', 'festival', 'événement', 'exposition', 'musee', 'galerie d\'art', 'jeu vidéo', 'jeu de société', 
        'comédie musicale', 'fête', 'soirée', 'karaoké', 'spectacle vivant'
    ],
    'health': [
        'pharmacy', 'drugstore', 'clinic', 'hospital', 'doctor', 'dentist', 'physiotherapy', 'chiropractor', 
        'optician', 'healthcare', 'wellness', 'medication', 'medicine', 'health insurance', 'hospital bill', 
        'check-up', 'prescription', 'medicaments', 'pharmacie', 'hôpital', 'dentiste', 'médecin', 'santé', 
        'traitement', 'soins médicaux', 'assurance santé', 'facture de soins', 'consultation médicale', 
        'médecine', 'santé mentale', 'opticien', 'kinésithérapeute'
    ],
    'education': [
        'tuition', 'school', 'college', 'university', 'textbooks', 'course', 'study', 'degree', 'graduation', 
        'scholarship', 'campus', 'teacher', 'professor', 'workshop', 'seminar', 'lecture', 'online learning', 
        'école', 'université', 'collège', 'bourse', 'livres scolaires', 'cours', 'études', 'formation', 'atelier',
        'séminaire', 'conférence', 'enseignant', 'professeur', 'diplôme', 'apprentissage en ligne'
    ],
    'travel': [
        'flight', 'hotel', 'booking', 'vacation', 'tourism', 'trip', 'airline', 'resort', 'tour', 'destination', 
        'cruise', 'excursion', 'travel insurance', 'journey', 'luggage', 'transport', 'car hire', 'holiday', 
        'travel agency', 'flight booking', 'réservation', 'vol', 'voyage', 'hôtel', 'destination', 'croisière', 
        'excursion', 'agence de voyages', 'location de voiture', 'assurance voyage', 'vacances', 'bagages'
    ],
    'services': [
        'cleaning', 'maintenance', 'repair', 'laundry', 'plumbing', 'electrician', 'car service', 'cleaning service',
        'housekeeping', 'personal assistant', 'security', 'moving', 'delivery', 'handyman', 'gardening', 'petsitting',
        'reparations', 'services de nettoyage', 'entretien', 'plomberie', 'électricien', 'réparation de voiture',
        'livraison', 'déménagement', 'jardinage', 'assistant personnel', 'ménage', 'garde d\'animaux'
    ]
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

    return 'others'

def parse_items(text):
    '''
    Cette fonction extrait les articles et leurs prix du texte du ticket de caisse elle aussi ignore les lignes comme le total les taxes, et 
    les informations inutiles a cause de blacklist
    Parametres:
        text (str): Le texte brut extrait de l'image du ticket 
    Sortie:
        list: Liste de dictionnaires chaque dictionnaire contient le nom de l'article et son prix
    '''
    lines = text.split("\n")
    items = []

    blacklist = [
        "subtotal", "total", "grand total", "tax", "vat", "sales tax", "service charge", "delivery fee",
        "tip", "change", "cash", "card", "credit", "debit", "payment", "balance", "discount", "coupon",
        "refunded", "refund", "invoice", "receipt", "order", "transaction", "authorization", "cashier",
        "server", "table", "terminal", "store", "address", "phone", "email", "date", "time", "website",
        "thanks", "welcome", "visit again", "signature", "customer copy", "merchant copy", "restapayer",
        "tva", "payer", "paid", "ref", "voucher", "gift", "promo", "return", "ticket", "ticket #", "item",
        "due", "savings", "loyalty", "bonus", "conditions", "policy"
    ]

    def is_all_digits(s):
        for c in s:
            if c < '0' or c > '9':
                return False
        return True

    def contains_blacklist_word(s):
        s_lower = s.lower()
        for b in blacklist:
            if b in s_lower:
                return True
        return False

    for line in lines:
        line_clean = line.strip()
        if not line_clean or len(line_clean) < 4:
            continue

        words = line_clean.split()
        if len(words) < 2:
            continue

        # Attempt to extract price from the last word on the line
        last = words[-1].replace(",", ".").replace("€", "").replace("$", "").replace("£", "").strip(" .")
        num_part = last.replace('.', '')

        if last.count('.') > 1 or not is_all_digits(num_part):
            continue

        try:
            price = float(last)
        except:
            continue

        # Extract item name from the remaining words
        name_parts = []
        for w in words[:-1]:
            if not is_all_digits(w) and len(w) > 1:
                name_parts.append(w)

        name = ' '.join(name_parts).strip()

        if name and not contains_blacklist_word(name):
            items.append({'name': name, 'price': price})

    return items

def parse_total(text):
    '''
    Cette fonction extrait le total de paiement d'un ticket.
    Paramètres:
        text (str): Le texte
    Sortie:
        str: Le total
    '''
    lines = text.split("\n")
    total_candidates = []

    amount_indicators = [
        'TOTAL', 'AMOUNT', 'TTC', 'TOTAL DUE', 'AMOUNT DUE', 'GRAND TOTAL',
        'TO PAY', 'TOTAL A PAYER', 'NET', 'NET TOTAL', 'BALANCE', 'SUM', 'TOTAL AMOUNT',
        'MONTANT', 'SOMME', 'TOTAL TTC', 'TOTAL HT', 'PAYÉ', 'PAID', 'DUE',
        'BALANCE DUE', 'TOTAL PAID', 'TOTAL PRICE', 'A PAYER', 'NET A PAYER'
    ]

    # indicators plus forts pour une court complexite et revoie immediatement
    definite_indicators = [
        'TOTAL A PAYER', 'GRAND TOTAL', 'TOTAL DUE', 'MONTANT DÛ',
        'AMOUNT TO PAY', 'NET A PAYER', 'SOMME A PAYER'
    ]

    def is_amount_candidate(s):
        dot_count = 0
        for ch in s:
            if '0' <= ch <= '9':  # verifie si c'est un nombre
                continue
            elif ch == '.':
                dot_count += 1
            else:
                return False
        return dot_count <= 1 and len(s) > 0

    for line in lines:
        clean_line = line.strip()
        upper_line = clean_line.upper()

        for indicator in definite_indicators:
            if indicator in upper_line:
                line_values = []
                words = clean_line.split()
                for word in words:
                    temp = ""
                    for ch in word:
                        if ch == ',':
                            temp += '.'
                        elif ch not in '$€£':
                            temp += ch

                    if len(temp) > 0 and '0' <= temp[0] <= '9':
                        num_str = ""
                        for ch in temp:
                            if '0' <= ch <= '9' or ch == '.':
                                num_str += ch
                        if is_amount_candidate(num_str):
                            val = float(num_str)
                            if val > 0:
                                line_values.append(val)
                # la raison pour la quelle on renvoie pas la premiere valuer est peut etre aura on autre nombre que total dans ticket
                if line_values:
                    return str(max(line_values))

        for indicator in amount_indicators:
            if indicator in upper_line:
                words = clean_line.split()
                for word in words:
                    temp = ""
                    for ch in word:
                        if ch == ',':
                            temp += '.'
                        elif ch not in '$€£':
                            temp += ch

                    if len(temp) > 0 and '0' <= temp[0] <= '9':  # verifie si c'est un nombre ou non
                        num_str = ""
                        for ch in temp:
                            if '0' <= ch <= '9' or ch == '.' or ch == ',':
                                num_str += ch
                        if is_amount_candidate(num_str):
                            val = float(num_str)
                            if val > 0:
                                total_candidates.append(val)

    if total_candidates:
        # trouve le maximum valeur autrement
        max_val = total_candidates[0]
        for val in total_candidates[1:]:
            if val > max_val:
                max_val = val
        return str(max_val)

    # si on trouve rien 
    items = parse_items(text)
    total = 0
    for item in items:
        total += item['price']
    return str(total)




def parse_date(text):
    '''
    cette fonction extrait la date à partir du texte et elle cherche des lignes contenant le mot 'date' ou des formats de date avec '/'
    Paramètres:
        text (str): Le texte
    Sortie:
        str: La date extraite ou None si on trouve pas la date
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
    Cette fonction trouve le nom du magasin ou du commercant dans le texte
    Paramètres :
        text (str) : Le texte
    Sortie :
        str : Le nom du magasin ou "Unknown Merchant" si on le trouve pas.
    Exlication pour le variable know_merchants: 
        tout les entreprise que j'ai mets ici je les ai pris sur internet parce que je sais pas beaucoup entreprise commune parmi eux
    '''
    known_merchants = [
    # Global/International
    "walmart", "costco", "carrefour", "tesco", "aldi", "lidl", "metro", "amazon", "ebay",
    "target", "ikea", "7-eleven", "spar", "auchan", "big bazaar", "reliance", "dmart",
    "flipkart", "shopee", "rakuten", "aliexpress", "best buy", "home depot", "lowe's",

    # USA
    "kroger", "safeway", "publix", "meijer", "h-e-b", "albertsons", "whole foods", "trader joe's",
    "sam's club", "bj's", "cvs", "walgreens", "dollar tree", "dollar general", "family dollar",
    "macy's", "nordstrom", "jcpenney", "kohl's", "bloomingdale's", "wegmans", "food lion",
    "rite aid", "cost plus", "fred meyer",

    # UK
    "sainsbury's", "asda", "waitrose", "morrisons", "co-op", "marks & spencer", "boots",
    "argos", "iceland", "b&m", "poundland", "superdrug",

    # Canada
    "loblaws", "shoppers drug mart", "sobeys", "no frills", "metro", "real canadian superstore",
    "canadian tire", "london drugs",

    # Australia
    "woolworths", "coles", "aldi", "iga", "kmart", "big w", "bunnings",

    # India
    "reliance fresh", "reliance digital", "big bazaar", "dmart", "spencer's", "more", "star bazaar",
    "nature's basket", "flipkart", "myntra", "nykaa",

    # Europe
    "e.leclerc", "intermarché", "penny market", "billa", "netto", "rewe", "système u", "monoprix",
    "migros", "coop", "jumbo", "albert heijn", "sklavenitis", "delhaize",

    # Asia
    "aeon", "don quijote", "familymart", "lawson", "7-eleven japan", "gs25", "emart", "lotte mart",
    "fairprice", "cold storage", "guardian", "watsons",

    # Fast Food
    "mcdonald's", "kfc", "subway", "starbucks", "burger king", "domino's", "pizza hut", "dunkin",
    "tim hortons", "chick-fil-a", "taco bell", "five guys", "wendy's", "popeyes"
    ]


    invalid_title_keywords = [
    # anglais
    "total", "amount", "subtotal", "vat", "tax", "tip", "change", "balance",
    "invoice", "receipt", "date", "time", "cash", "card", "payment", "ref",
    "id", "order", "number", "merchant", "terminal", "discount", "auth",
    "code", "paid", "return", "loyalty", "store", "summary", "price", "qty",
    "description", "unit", "transaction", "thank", "you", "visit", "welcome",
    "tel", "phone", "address", "www", ".com", "euro", "usd", "items",
    # francais
    "tva", "caissier", "vendeur", "achat", "client", "serveur", "fiscal",
    "reçu", "ticket", "facture", "date", "heure", "paiement", "especes",
    "espèces", "carte", "montant", "remise", "remboursement", "code", "annulation",
    "merci", "visite", "siret", "numéro", "adresse", "produits", "net", "brut",
    "total", "sous-total", "net à payer", "à payer", "cb", "remerciements", "resto", 'Info' ,
     'Vente', 'Information', 'information vente'
    ]

    lines = text.split("\n")
    for line in lines:
        cleaned = line.strip().lower()
        for merchant in known_merchants:
            if merchant in cleaned:
                return merchant.title()
            
    for line in lines:
        cleaned = line.strip().lower()
        if cleaned:
            found = False
            for keyword in invalid_title_keywords:
                if keyword in cleaned:
                    found = True
                    break
            if not found:
                return line.strip().title()
    return "Unknown Merchant"

def create_description(text, merchant, amount, date, items):
    '''
    Cette fonction genere une description simple en verifiant la langaue 
    Paramètres :
        text (str) : Texte 
        merchant (str ou None) : Nom du commercant Si None, le nom sera détecté automatiquement
        amount (float) : Montant total du reçu ou 0 
        date (str ou None) : Date du recu ou None 
        items (list ou None) : liste avec le nom et le prix de items
    Sortie :
        str : Une description du reçu, en français ou en anglais selon la langue détectée.

    Pourquoi utiliser None en merchant, amount, date, et items:
        Parce qu'il possible de ne pas trouver merchant ou amount ou date ou items dont pour eviter les erreurs 
    '''
    language = detect_receipt_language(text)

    # validation de merchant 
    if not merchant or len(merchant.strip()) < 2:
        merchant = "Unknown Merchant"
    else:
        merchant = merchant.strip()

    # validation de date
    if not date or len(date.strip()) < 4:
        date = None
    else:
        date = date.strip()

    # Validation de total
    if amount is None or amount <= 0 or amount > 100000:
        amount = None

    valid_items = []
    if items:
        for item in items:
            if 'name' in item and 'price' in item:
                name = item['name']
                price = item['price']
                if name and len(name) > 1 and price >= 0 and price <= 10000:
                    valid_items.append({'name': name.strip(), 'price': price})

    # description commence ici
    description = "Receipt from " + merchant
    if language == 'french':
        description = "Reçu de " + merchant
        if amount and amount > 0:
            description += " pour " + str(amount) + "€"
        if date:
            description += " le " + date
        else:
            description += " avec une date inconnue"
        if items and len(items) > 0:
            description += ". Articles détectés:"
            for item in items:
                description += " - " + item["name"] + ": " + str(item["price"]) + "€"
        else:
            description += ". Aucun article détecté."
        if amount is None or amount <= 0:
            description += " Montant total non détecté."

        return description.strip()
    else:
        description = "Receipt from " + merchant
        if amount and amount > 0:
            description += " for $" + str(amount)
        if date:
            description += " on " + date
        else:
            description += " with unknown date"
        if items and len(valid_items) > 0:
            description += ". Items detected:"
            for item in items:
                description += " - " + item["name"] + ": $" + str(item["price"])
        else:
            description += ". No items detected."
        if amount is None or amount <= 0:
            description += " Total amount not detected."
        return description.strip()

if __name__ == '__main__':
    test_image_url1 = 'https://res.cloudinary.com/dcijqmjst/image/upload/v1746830264/Receipt%20Photos/x7zn4c92atdtukyxscjq.jpg'
    test_image_url = 'https://res.cloudinary.com/dcijqmjst/image/upload/v1747162840/Receipt%20Photos/a03pdhwkcptpagboi8du.jpg'
    test_payload = {
        'image_url': test_image_url
    }

    try:
        image_url = test_payload.get('image_url')

        if not image_url:
            print({'success': False, 'error': 'No image_url provided'})
        else:
            print(f"Received image input: {image_url[:30]}...")
            if image_url.startswith('data:image'):
                try:
                    header, base64_data = image_url.split(',', 1)
                    image_data = BytesIO(b64decode(base64_data))
                except Exception as e:
                    print({'success': False, 'error': f'Invalid base64 image data: {e}'})
            else:
                print("Received non-base64 URL. Attempting download...")
                image_data = download_image(image_url)
                if not image_data:
                    print({'success': False, 'error': 'Image download failed'})
                    exit()

            image_array = np.asarray(bytearray(image_data.read()), dtype=np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            if image is None:
                print({'success': False, 'error': 'Image decoding failed'})
                exit()

            # processed = preprocess_image(image)
            text = extract_text(image)
            items = parse_items(text)
            realText = extract_text(image)
            if parse_total(text):
                raw_amount = parse_total(text)
            else:
                raw_amount = parse_total(realText)

            if raw_amount :
                amount = float(raw_amount.replace(',', '.'))
            else:
                amount = 0 
            
            merchant_categories = {
            "food": [
                "mcdonald's", "kfc", "subway", "starbucks", "burger king", "domino's", "pizza hut",
                "dunkin", "tim hortons", "chick-fil-a", "taco bell", "five guys", "wendy's", "popeyes"
            ],
            "groceries": [
                "walmart", "costco", "aldi", "lidl", "tesco", "carrefour", "target", "sainsbury's",
                "asda", "waitrose", "morrisons", "safeway", "kroger", "publix", "whole foods", "trader joe's",
                "big bazaar", "reliance fresh", "dmart", "spencer's", "more", "star bazaar", "no frills"
            ],
            "shopping": [
                "amazon", "flipkart", "ebay", "best buy", "ikea", "macy's", "nordstrom", "jcpenney", "kohl's",
                "bloomingdale's", "argos", "marks & spencer", "nykaa", "myntra", "canadian tire", "big w", "kmart"
            ],
            "transport": [
                "uber", "lyft", "bolt", "grab", "ola", "didi", "blablacar", "careem", "metro transit", "gojek"
            ],
            "utilities": [
                "con edison", "pacific gas & electric", "british gas", "edf", "enel", "national grid",
                "hydro one", "e.on", "dominion energy", "xcel energy"
            ],
            "entertainment": [
                "netflix", "spotify", "apple music", "hulu", "disney+", "amazon prime video", "youtube premium",
                "amc theatres", "cinemark", "regal", "xbox", "playstation store", "steam"
            ],
            "health": [
                "cvs", "walgreens", "rite aid", "boots", "superdrug", "shoppers drug mart", "guardian", "watsons",
                "london drugs"
            ],
            "education": [
                "coursera", "udemy", "khan academy", "edx", "linkedin learning", "skillshare", "duolingo"
            ],
            "travel": [
                "expedia", "booking.com", "airbnb", "agoda", "trip.com", "trivago", "skyscanner", "delta", "emirates",
                "united airlines", "air france", "qatar airways", "marriott", "hilton"
            ],
            "services": [
                "fiverr", "upwork", "freelancer", "godaddy", "bluehost", "shopify", "squarespace", "wix",
                "mailchimp", "canva"
            ]
        }

            date = parse_date(text)
            merchant = parse_title(text)
            category = determine_category(merchant, items)
            description = create_description(text, merchant, amount, date, items)

            if category == "others":
                for key, value in merchant_categories.items():
                    # The reason behind the nested loop is that the parse_title might detect more a word
                    for known in value:
                        if known in merchant.lower():
                            category = key
                            break
                    # it stop the second we find the category so it didn't go all the way
                    if category != "others":
                        break

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
            print(response_data)
            print(extract_text(image))
            # print(extract_text(preprocess_image(image)))
            


    except Exception as e:
        print({'success': False, 'error': str(e), 'serverStatus': 'offline'})
