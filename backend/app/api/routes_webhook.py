from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.database import get_db
from app.db.models import Transaction, School
from app.core.security import verify_transaction

router = APIRouter()

class InterswitchWebhookPayload(BaseModel):
    paymentReference: str  
    responseCode: str
    amount: Optional[float] = None

@router.post("/interswitch")
async def interswitch_webhook(
    payload: InterswitchWebhookPayload, 
    db: Session = Depends(get_db)
):
    """Receives payment status updates from Interswitch securely."""
    
    payment_ref = payload.paymentReference
    response_code = payload.responseCode
        
    transaction = db.query(Transaction).filter(
        Transaction.payment_reference == payment_ref
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if response_code == "00":
        # Security check: Verify the payment with Interswitch directly
        school = db.query(School).filter(School.id == transaction.student.school_id).first()
        
        is_verified = verify_transaction(
            txn_ref=payment_ref, 
            amount=int(transaction.amount * 100), 
            item_id=school.interswitch_item_id
        )
        
        if is_verified:
            transaction.status = "success"
        else:
            print(f"⚠️ Spoofed payment detected for {payment_ref}")
            transaction.status = "failed"
    else:
        transaction.status = "failed"
        
    db.commit()
    
    return {"status": "success", "message": f"Transaction {payment_ref} updated"}