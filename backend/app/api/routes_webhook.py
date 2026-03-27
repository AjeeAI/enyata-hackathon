from fastapi import APIRouter, Depends, HTTPException, Request, Form
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db.models import Transaction, School, Student
from app.core.security import verify_transaction

router = APIRouter()

# THE FIX: Interswitch sends Form Data, not JSON! We use Form(...) to catch it.
@router.post("/interswitch")
async def interswitch_webhook(
    txnref: str = Form(...),
    amount: int = Form(...),
    resp: str = Form(...),
    desc: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Receives payment status updates from Interswitch securely."""
    
    transaction = db.query(Transaction).filter(
        Transaction.payment_reference == txnref
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if resp == "00":
        # Security check: Verify the payment with Interswitch directly
        school = db.query(School).filter(School.id == transaction.student.school_id).first()
        
        is_verified = verify_transaction(
            txn_ref=txnref, 
            amount=amount, 
            merchant_code=school.interswitch_merchant_code or "MX6072"
        )
        
        if is_verified:
            transaction.status = "success"
            
            # --- BONUS HACKATHON FEATURE ---
            # Automatically update the student's outstanding debt!
            paid_amount_in_naira = amount / 100
            
            if transaction.student.outstanding_debt:
                transaction.student.outstanding_debt -= paid_amount_in_naira
                # Prevent negative debt
                if transaction.student.outstanding_debt <= 0:
                    transaction.student.outstanding_debt = 0.0
                    transaction.student.status = "Paid"
            
        else:
            print(f"⚠️ Spoofed payment detected for {txnref}")
            transaction.status = "failed"
    else:
        transaction.status = "failed"
        
    db.commit()
    
    return {"status": "success", "message": f"Transaction {txnref} updated"}