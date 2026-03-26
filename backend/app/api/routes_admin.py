import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import Transaction, Student, FeeStructure
import uuid
from app.db.database import get_db
from app.db.models import Transaction
from app.core.config import settings
from app.db.models import Document

# --- RAG Imports using Google GenAI ---
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings # Updated Import
from langchain_community.vectorstores import Qdrant

router = APIRouter()

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    """Calculates Total Revenue and Pending Payments from Postgres."""
    
    # Total Revenue (SUM of successful)
    total_revenue = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "success"
    ).scalar() or 0.0
    
    # Pending Payments (SUM of pending)
    pending_payments = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "pending"
    ).scalar() or 0.0
    
    return {
        "total_revenue": total_revenue,
        "pending_payments": pending_payments
    }

@router.post("/upload-policy")
async def upload_policy(file: UploadFile = File(...)):
    """Parses PDF, chunks, embeds via Google Gemini, and stores in Qdrant."""
    
    # 1. Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(await file.read())
        tmp_path = tmp_file.name

    try:
        # 2. Load and parse the PDF
        loader = PyPDFLoader(tmp_path)
        documents = loader.load()
        
        # 3. Chunk the document
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        
        # Add metadata for multi-tenancy (mocked for hackathon)
        for chunk in chunks:
            chunk.metadata["school_id"] = "mock-school-id-for-hackathon"
            
        # 4. Embed using Google Gemini & Store in Qdrant
        # Explicitly pass the API key from settings
        embeddings = GoogleGenerativeAIEmbeddings(
            model="gemini-embedding-001",
            google_api_key=settings.GOOGLE_API_KEY
        )
        
        Qdrant.from_documents(
            chunks,
            embeddings,
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY, 
            collection_name="school_policies_gemini", # Updated Collection Name
            force_recreate=True 
        )
        
        return {"status": "success", "message": f"Successfully indexed {len(chunks)} chunks into Qdrant."}
        
    finally:
        os.remove(tmp_path) # Clean up

@router.get("/dashboard/overview/{school_id}")
async def get_dashboard_overview(school_id: str, db: Session = Depends(get_db)):
    try:
        school_uuid = uuid.UUID(school_id)

        # 1. Total Collected: Sum of all successful transactions for this school
        total_collected = db.query(func.sum(Transaction.amount))\
            .join(Student)\
            .filter(Student.school_id == school_uuid, Transaction.status == "success")\
            .scalar() or 0.0

        # 2. Recent Transactions: Get last 5 successful/pending payments
        recent_txs = db.query(Transaction)\
            .join(Student)\
            .filter(Student.school_id == school_uuid)\
            .order_by(Transaction.created_at.desc())\
            .limit(5).all()

        formatted_txs = [{
            "id": str(tx.id),
            "studentName": tx.student.name,
            "class": tx.student.current_class,
            "amount": tx.amount,
            "status": "Verified" if tx.status == "success" else "Pending",
            "time": tx.created_at.strftime("%I:%M %p")
        } for tx in recent_txs]

        # 3. Simple Mock for Outstanding (Calculated in background for larger apps)
        # For the hackathon, we can count students with "Not Paid" status
        debt_count = db.query(Student).filter(Student.school_id == school_uuid, Student.status == "Not Paid").count()
        outstanding_debt = debt_count * 15000 # Mock average debt per student

        return {
            "totalCollected": total_collected,
            "outstandingDebt": outstanding_debt,
            "activePaymentPlans": db.query(Student).filter(Student.school_id == school_uuid, Student.status == "Pending").count(),
            "recentTransactions": formatted_txs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{school_id}")
async def get_students(school_id: str, db: Session = Depends(get_db)):
    """Fetches all students belonging to a specific school."""
    try:
        school_uuid = uuid.UUID(school_id)
        students = db.query(Student).filter(Student.school_id == school_uuid).all()
        return students
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/students")
async def add_student(payload: dict, db: Session = Depends(get_db)):
    """Creates a new student record from the 'Add Student' modal."""
    try:
        new_student = Student(
            school_id=uuid.UUID(payload['school_id']),
            name=payload['name'],
            current_class=payload['class'],
            guardian_name=payload['parentName'],
            guardian_phone=payload['parentPhone'],
            status=payload['status']
        )
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        return new_student
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    

@router.get("/policies/{school_id}")
async def get_policies(school_id: str, db: Session = Depends(get_db)):
    school_uuid = uuid.UUID(school_id)
    docs = db.query(Document).filter(Document.school_id == school_uuid).order_by(Document.created_at.desc()).all()
    
    return [{
        "id": str(doc.id),
        "name": doc.name,
        "size": doc.size,
        "date": doc.created_at.strftime('%b %d, %Y'),
        "status": doc.status
    } for doc in docs]