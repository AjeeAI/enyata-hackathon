from app.db.database import engine, Base
from app.db.models import School, Student, User, Transaction, FeeStructure

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating all tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully!")

if __name__ == "__main__":
    reset_database()