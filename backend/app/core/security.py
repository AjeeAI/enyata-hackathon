import jwt
import bcrypt
import hashlib
import base64
import requests
from datetime import datetime, timedelta
from app.core.config import settings

# --- Configuration ---
# Use the Google API Key as the secret for signing your internal Admin JWTs
SECRET_KEY = settings.GOOGLE_API_KEY 
ALGORITHM = "HS256"

# ==========================================
# 1. ADMIN AUTHENTICATION (Bcrypt & JWT)
# ==========================================

def hash_password(password: str) -> str:
    """Hashes a plain-text password using raw bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks a plain-text password against a stored bcrypt hash."""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

def create_access_token(data: dict):
    """Generates a JWT token that expires in 24 hours."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ==========================================
# 2. INTERSWITCH PAYMENT SECURITY (Dynamic)
# ==========================================

def generate_webpay_hash(txn_ref: str, amount: int, item_id: str, client_id: str, mac_key: str) -> str:
    """
    Generates the SHA-512 MAC signature for a specific school.
    Formula: txn_ref + product_id (client_id) + item_id + amount + MAC_KEY
    """
    raw_string = f"{txn_ref}{client_id}{item_id}{amount}{mac_key}"
    return hashlib.sha512(raw_string.encode('utf-8')).hexdigest()

def verify_transaction(txn_ref: str, amount: int, merchant_code: str, mac_key: str = "") -> bool:
    """
    Calls the modern Interswitch Collections API using the exact URL from the documentation.
    """
    # THE FIX: Using the official QA endpoint from the documentation
    url = f"https://qa.interswitchng.com/collections/api/v1/gettransaction.json?merchantcode={merchant_code}&transactionreference={txn_ref}&amount={amount}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    # Note: If Interswitch requires the Hash header for this specific endpoint in your sandbox, 
    # it is usually SHA512(merchant_code + txn_ref + mac_key). 
    # We will try the raw request first as per the cURL example in the docs!
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # ResponseCode '00' is the universal success code for Interswitch
            return data.get("ResponseCode") == "00"
    except Exception as e:
        print(f"Interswitch Inquiry Error for Ref {txn_ref}: {e}")
    
    return False