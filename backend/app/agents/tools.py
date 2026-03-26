import uuid
from langchain_core.tools import tool
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import SessionLocal
from app.db.models import Student, School, FeeStructure, Transaction # Added School
from app.core.config import settings
from app.core.security import generate_webpay_hash # Import our security logic

# --- RAG Imports using Google GenAI ---
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Qdrant
import qdrant_client

@tool
def get_student_balance(guardian_phone: str) -> str:
    """Queries the database to calculate the outstanding balance for a student."""
    db: Session = SessionLocal()
    try:
        student = db.query(Student).filter(Student.guardian_phone == guardian_phone).first()
        if not student:
            return f"No student found linked to the phone number {guardian_phone}."

        fees = db.query(FeeStructure).filter(
            FeeStructure.school_id == student.school_id,
            FeeStructure.class_name == student.current_class
        ).first()
        
        if not fees:
            return f"Fee structure not found for {student.name}'s class."
            
        total_expected = (fees.total_tuition or 0.0) + (fees.pta_fee or 0.0)

        paid_amount = db.query(func.sum(Transaction.amount)).filter(
            Transaction.student_id == student.id,
            Transaction.status == "success"
        ).scalar() or 0.0

        balance = total_expected - paid_amount

        return (f"Student: {student.name} | Class: {student.current_class} | "
                f"Total Fees: ₦{total_expected:,.2f} | Paid: ₦{paid_amount:,.2f} | "
                f"Outstanding Balance: ₦{balance:,.2f}")
    except Exception as e:
        return f"Database error occurred: {str(e)}"
    finally:
        db.close()


@tool
def search_school_policy(query: str, school_id: str) -> str:
    """Search the Qdrant vector database for school policies."""
    try:
        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001", 
            google_api_key=settings.GOOGLE_API_KEY
        )
        
        client = qdrant_client.QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY
        )
        
        qdrant_store = Qdrant(
            client=client, 
            collection_name="school_policies_gemini", 
            embeddings=embeddings
        )
        
        docs = qdrant_store.similarity_search(query=query, k=3)
        
        if not docs:
            return "No relevant policies found regarding that query."
            
        combined_text = "\n\n---\n\n".join([doc.page_content for doc in docs])
        return f"Found the following information in the handbook:\n{combined_text}"
        
    except Exception as e:
        return f"Vector search error: {str(e)}"


@tool
def generate_payment_link(amount: float, guardian_phone: str) -> str:
    """Generates a secure link using the specific school's Interswitch keys."""
    db: Session = SessionLocal()
    try:
        # 1. Look up student and their school
        student = db.query(Student).filter(Student.guardian_phone == guardian_phone).first()
        if not student:
            return f"Cannot generate link: No student found for phone {guardian_phone}."

        school = db.query(School).filter(School.id == student.school_id).first()
        if not school:
            return "Error: School configuration not found in database."

        # 2. Generate transaction details
        unique_ref = f"ISW-{uuid.uuid4().hex[:8].upper()}"
        amount_in_kobo = int(amount * 100) # Interswitch requires kobo

        # 3. Generate the security hash using the SCHOOL'S database keys
        payment_hash = generate_webpay_hash(
            txn_ref=unique_ref,
            amount=amount_in_kobo,
            item_id=school.interswitch_pay_item_id,
            client_id=school.interswitch_client_id,
            mac_key=school.interswitch_secret_key
        )

        # 4. Save the transaction as "pending"
        new_txn = Transaction(
            id=uuid.uuid4(),
            student_id=student.id,
            amount=amount,
            payment_reference=unique_ref,
            status="pending"
        )
        db.add(new_txn)
        db.commit()

        # 5. Construct the final payment URL
        payment_url = f"https://sandbox.interswitchng.com/pay/{unique_ref}"
        
        return (f"Transaction created successfully!\n"
                f"Amount: ₦{amount:,.2f}\n"
                f"School: {school.name}\n"
                f"Click here to pay securely: {payment_url}")
                
    except Exception as e:
        db.rollback()
        return f"Error generating payment link: {str(e)}"
    finally:
        db.close()