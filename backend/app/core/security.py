import hashlib
import hmac
import os
import requests
from app.core.config import settings

def generate_interswitch_hash(txn_ref: str, amount: int, item_id: str) -> str:
    """
    Generates the SHA-512 MAC signature required by Interswitch APIs.
    Format: txn_ref + product_id + item_id + amount + MAC_KEY
    Note: Amount must be in kobo (multiply Naira by 100).
    """
    # Assuming Client ID acts as Product ID for the Sandbox
    raw_string = f"{txn_ref}{settings.INTERSWITCH_CLIENT_ID}{item_id}{amount}{settings.INTERSWITCH_MAC_KEY}"
    return hashlib.sha512(raw_string.encode('utf-8')).hexdigest()

def verify_transaction(txn_ref: str, amount: int, item_id: str) -> bool:
    """
    Hits the Interswitch Transaction Inquiry API to confirm payment status.
    """
    url = f"https://sandbox.interswitchng.com/api/v2/quickteller/transactions?requestReference={txn_ref}"
    
    # Generate signature for the request
    signature = generate_interswitch_hash(txn_ref, amount, item_id)
    
    headers = {
        "Authorization": f"Bearer {settings.INTERSWITCH_CLIENT_ID}", # Sandbox auth
        "Signature": signature,
        "SignatureMethod": "SHA512"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data.get("ResponseCode") == "00" # "00" means successful in Interswitch
    except Exception as e:
        print(f"Transaction inquiry failed: {e}")
    
    return False