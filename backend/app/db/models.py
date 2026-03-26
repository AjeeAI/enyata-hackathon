import uuid
from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class School(Base):
    __tablename__ = "schools"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    interswitch_merchant_id = Column(String, nullable=False)
    interswitch_item_id = Column(String, nullable=False)

    students = relationship("Student", back_populates="school")
    fee_structures = relationship("FeeStructure", back_populates="school")

class Student(Base):
    __tablename__ = "students"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = Column(UUID(as_uuid=True), ForeignKey("schools.id"))
    name = Column(String, nullable=False)
    guardian_phone = Column(String, unique=True, index=True, nullable=False)
    current_class = Column(String, nullable=False)

    school = relationship("School", back_populates="students")
    transactions = relationship("Transaction", back_populates="student")

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
    status = Column(String, default="pending") # 'pending', 'success', 'failed'
    created_at = Column(DateTime, server_default=func.now())

    student = relationship("Student", back_populates="transactions")