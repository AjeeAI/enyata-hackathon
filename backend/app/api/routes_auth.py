from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, School # Import School model
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter()

@router.post("/signup")
async def signup(payload: dict, db: Session = Depends(get_db)):
    # 1. Check if the admin email is already registered
    user_exists = db.query(User).filter(User.email == payload['email']).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        # 2. First, create the School record with its unique Interswitch keys
        new_school = School(
            name=payload['schoolName'],
            interswitch_client_id=payload.get('interswitchClientId'),
            interswitch_secret_key=payload.get('interswitchSecretKey'),
            interswitch_merchant_code=payload.get('interswitchMerchantCode'),
            interswitch_pay_item_id=payload.get('interswitchPayItemId')
        )
        db.add(new_school)
        db.flush()  # Flushes to get the new_school.id for the relationship

        # 3. Create the Admin User linked to this school
        new_user = User(
            email=payload['email'],
            hashed_password=hash_password(payload['password']),
            school_id=new_school.id
        )
        db.add(new_user)
        db.commit()
        
        return {"status": "success", "message": "School and Admin successfully registered"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@router.post("/login")
async def login(payload: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload['email']).first()
    if not user or not verify_password(payload['password'], user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({
        "sub": str(user.id), 
        "email": user.email,
        "school_id": str(user.school_id)
    })
    
    # THE FIX: Return school_id explicitly so React can see it!
    return {
        "access_token": token, 
        "token_type": "bearer",
        "school_id": str(user.school_id) 
    }