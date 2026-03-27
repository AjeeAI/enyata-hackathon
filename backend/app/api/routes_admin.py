import os
import tempfile
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid

from app.db.database import get_db
from app.db.models import Transaction, Student, FeeStructure, Document
from app.core.config import settings

# --- RAG Imports using Google GenAI ---
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Qdrant
import qdrant_client # <-- NEW IMPORT
from qdrant_client.http import models as rest # <-- NEW IMPORT

router = APIRouter()

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    """Calculates Total Revenue and Pending Payments from Postgres."""
    
    total_revenue = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "success"
    ).scalar() or 0.0
    
    pending_payments = db.query(func.sum(Transaction.amount)).filter(
        Transaction.status == "pending"
    ).scalar() or 0.0
    
    return {
        "total_revenue": total_revenue,
        "pending_payments": pending_payments
    }

@router.post("/upload-policy")
async def upload_policy(
    file: UploadFile = File(...),
    school_id: str = Form(...) 
):
    """Parses PDF, chunks, embeds via Google Gemini, and stores in Qdrant."""
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(await file.read())
        tmp_path = tmp_file.name

    try:
        loader = PyPDFLoader(tmp_path)
        documents = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        
        for chunk in chunks:
            chunk.metadata["school_id"] = school_id
            
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=settings.GOOGLE_API_KEY
        )
        
        Qdrant.from_documents(
            chunks,
            embeddings,
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY, 
            collection_name="school_policies_gemini", 
            force_recreate=False 
        )
        
        # --- THE FIX: Tell Qdrant to index the school_id field for fast filtering ---
        client = qdrant_client.QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )
        
        client.create_payload_index(
            collection_name="school_policies_gemini",
            field_name="metadata.school_id",
            field_schema=rest.PayloadSchemaType.KEYWORD,
        )
        
        return {"status": "success", "message": f"Successfully indexed {len(chunks)} chunks into Qdrant."}
        
    finally:
        os.remove(tmp_path) 

@router.get("/dashboard/overview/{school_id}")
async def get_dashboard_overview(school_id: str, db: Session = Depends(get_db)):
    try:
        school_uuid = uuid.UUID(school_id)

        total_collected = db.query(func.sum(Transaction.amount))\
            .join(Student)\
            .filter(Student.school_id == school_uuid, Transaction.status == "success")\
            .scalar() or 0.0

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

        outstanding_debt = db.query(func.sum(Student.outstanding_debt))\
            .filter(Student.school_id == school_uuid)\
            .scalar() or 0.0

        active_plans = db.query(Student)\
            .filter(Student.school_id == school_uuid, Student.outstanding_debt > 0)\
            .count()

        return {
            "totalCollected": total_collected,
            "outstandingDebt": outstanding_debt,
            "activePaymentPlans": active_plans,
            "recentTransactions": formatted_txs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/students/{student_id}/clear-debt")
async def manual_clear_debt(student_id: str, db: Session = Depends(get_db)):
    """Allows an admin to manually mark a student's debt as paid."""
    try:
        student = db.query(Student).filter(Student.id == uuid.UUID(student_id)).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
            
        student.outstanding_debt = 0.0
        student.status = "Paid"
        db.commit()
        return {"message": "Debt cleared successfully"}
    except Exception as e:
        db.rollback()
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
            status=payload['status'],
            outstanding_debt=payload.get('outstanding_debt', 0.0) 
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
    
@router.put("/students/{student_id}")
async def update_student(student_id: str, payload: dict, db: Session = Depends(get_db)):
    """Updates an existing student's details."""
    try:
        student = db.query(Student).filter(Student.id == uuid.UUID(student_id)).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        if 'name' in payload: student.name = payload['name']
        if 'class' in payload: student.current_class = payload['class']
        if 'parentName' in payload: student.guardian_name = payload['parentName']
        if 'parentPhone' in payload: student.guardian_phone = payload['parentPhone']
        if 'status' in payload: student.status = payload['status']
        if 'outstanding_debt' in payload: student.outstanding_debt = payload['outstanding_debt']

        db.commit()
        db.refresh(student)
        return student
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/students/{student_id}")
async def delete_student(student_id: str, db: Session = Depends(get_db)):
    """Deletes a student and their associated transactions."""
    try:
        student_uuid = uuid.UUID(student_id)
        student = db.query(Student).filter(Student.id == student_uuid).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        db.query(Transaction).filter(Transaction.student_id == student_uuid).delete()
        
        db.delete(student)
        db.commit()
        return {"message": "Student deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))