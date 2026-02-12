from database import engine
from models import Base, Recruiter

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")

    # Add a demo recruiter if not exists
    from sqlalchemy.orm import Session
    db = Session(engine)
    if not db.query(Recruiter).filter(Recruiter.email == "demo@example.com").first():
        demo_recruiter = Recruiter(name="Demo Recruiter", email="demo@example.com")
        db.add(demo_recruiter)
        db.commit()
        print("Demo recruiter added.")
    db.close()

if __name__ == "__main__":
    init_db()
