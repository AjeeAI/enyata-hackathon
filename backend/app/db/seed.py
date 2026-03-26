import uuid
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine, Base
from app.db.models import School, Student, FeeStructure, Transaction

Base.metadata.drop_all(bind=engine) 
# Ensure tables exist
Base.metadata.create_all(bind=engine)

def seed_data():
    db: Session = SessionLocal()
    try:
        # 1. Create a Sample School
        school_id = uuid.uuid4()
        school = School(
            id=school_id,
            name="Greenwood International School",
            # UPDATED: Real Interswitch Sandbox Credentials
            interswitch_merchant_id="MX6072", 
            interswitch_item_id="9405967"
        )
        db.add(school)

        # 2. Create Fee Structures
        js1_fees = FeeStructure(
            id=uuid.uuid4(),
            school_id=school_id,
            class_name="JSS1",
            total_tuition=150000.0,
            pta_fee=5000.0
        )
        db.add(js1_fees)

        # 3. Create a Student
        student_id = uuid.uuid4()
        student = Student(
            id=student_id,
            school_id=school_id,
            name="Aisha Bello",
            guardian_phone="+2348011111111", # Use this phone for testing!
            current_class="JSS1"
        )
        db.add(student)

        # 4. Create a Pending Transaction (to test the webhook later)
        pending_txn = Transaction(
            id=uuid.uuid4(),
            student_id=student_id,
            amount=50000.0,
            payment_reference="REF-AISHA-001",
            status="pending"
        )
        db.add(pending_txn)

        db.commit()
        print("✅ Database successfully seeded with Greenwood International data!")
        print(f"School ID: {school_id}")
        print(f"Guardian Phone: +2348011111111")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()