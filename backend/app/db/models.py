import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# ==========================================
# 1. ADMIN USER MODEL (For Login/Auth)
# ==========================================
class User(Base):
    """Stores credentials for school administrators."""
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Link the user to their specific school
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id"))
    school = relationship("School", back_populates="admin_user")

# ==========================================
# 2. SCHOOL MODEL (Multi-Tenant Config)
# ==========================================
class School(Base):
    """Stores specific Interswitch keys for each school."""
    __tablename__ = "schools"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    
    # The 4 critical Interswitch keys captured during registration
    interswitch_client_id = Column(String, nullable=True)     # "Client ID"
    interswitch_secret_key = Column(String, nullable=True)    # "Secret Key"
    interswitch_merchant_code = Column(String, nullable=True) # "Merchant Code"
    interswitch_pay_item_id = Column(String, nullable=True)   # "Pay Item ID"

    # Relationships
    admin_user = relationship("User", back_populates="school", uselist=False)
    students = relationship("Student", back_populates="school")
    fee_structures = relationship("FeeStructure", back_populates="school")

# ==========================================
# 3. STUDENT MODEL (Directory & UI Data)
# ==========================================
class Student(Base):
    """Matches the 'Student Directory' columns in your frontend."""
    __tablename__ = "students"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id"))
    
    name = Column(String, nullable=False)             # Student Name
    current_class = Column(String, nullable=False)    # e.g., JSS 1
    guardian_name = Column(String, nullable=False)    # "Parent Name" column
    guardian_phone = Column(String, unique=True, index=True, nullable=False)
    
    # Matches UI Status: 'Paid', 'Pending', 'Not Paid'
    status = Column(String, default="Not Paid")

    school = relationship("School", back_populates="students")
    transactions = relationship("Transaction", back_populates="student")

# ==========================================
# 4. SUPPORTING MODELS (Fees & Txns)
# ==========================================
class FeeStructure(Base):
    __tablename__ = "fee_structures"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id"))
    class_name = Column(String, nullable=False)
    total_tuition = Column(Float, default=0.0)
    pta_fee = Column(Float, default=0.0)

    school = relationship("School", back_populates="fee_structures")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"))
    amount = Column(Float, nullable=False)
    payment_reference = Column(String, unique=True, index=True)
    status = Column(String, default="pending") 
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="transactions")
    
    
class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id"))
    name = Column(String)
    size = Column(String)
    status = Column(String, default="indexed")
    created_at = Column(DateTime, server_default=func.now())