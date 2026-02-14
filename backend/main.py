import os
import shutil
import uuid
import json
import pickle
from typing import List
from fastapi import FastAPI, Depends, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db, engine
from models import Base, Recruiter, Job, Candidate, CVDocument, Skill, Ranking, candidate_skills, job_skills
from parser import extract_text
from nlp_engine import NLPEngine
from pydantic import BaseModel

# Initialize FastAPI
app = FastAPI(title="AI-Powered Recruitment System")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NLP Engine
nlp_engine = nlp_engine = NLPEngine()

# Pydantic models for API
class JobCreateSchema(BaseModel):
    title: str
    description: str
    recruiter_id: int = 1
    semantic_weight: float = 0.8

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    semantic_weight: float

    class Config:
        from_attributes = True

# Helper to ensure upload directory exists
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "AI-Powered Recruitment System API"}

@app.post("/jobs", response_model=JobResponse)
def create_job(job_data: JobCreateSchema, db: Session = Depends(get_db)):
    # Create job and generate embedding
    embedding = nlp_engine.get_embedding(job_data.description)
    new_job = Job(
        title=job_data.title,
        description=job_data.description,
        recruiter_id=job_data.recruiter_id,
        semantic_weight=job_data.semantic_weight,
        embedding=pickle.dumps(embedding)
    )
    db.add(new_job)
    db.flush() # Get ID

    # Extract and store job skills
    skills = nlp_engine.extract_skills(job_data.description)
    for skill_name in skills:
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        if not skill:
            skill = Skill(name=skill_name)
            db.add(skill)
            db.flush()
        if skill not in new_job.skills:
            new_job.skills.append(skill)

    db.commit()
    db.refresh(new_job)
    return new_job

@app.get("/jobs", response_model=List[JobResponse])
def list_jobs(db: Session = Depends(get_db)):
    return db.query(Job).all()

@app.get("/jobs/{job_id}/rankings")
def get_rankings(job_id: int, blind_mode: bool = False, db: Session = Depends(get_db)):
    rankings = db.query(Ranking).filter(Ranking.job_id == job_id).order_by(Ranking.final_score.desc()).all()

    result = []
    for r in rankings:
        candidate_name = r.candidate.name
        email = r.candidate.email

        if blind_mode:
            candidate_name = f"Candidate {r.candidate_id}"
            email = "[Masked for Blind Screening]"

        result.append({
            "candidate_id": r.candidate_id,
            "candidate_name": candidate_name,
            "email": email,
            "semantic_score": r.semantic_score,
            "experience_score": r.experience_score,
            "final_score": r.final_score,
            "total_experience": r.candidate.total_experience_years,
            "matched_skills": json.loads(r.matched_skills_json) if r.matched_skills_json else [],
            "missing_skills": json.loads(r.missing_skills_json) if r.missing_skills_json else []
        })
    return result

def process_cv_batch(job_id: int, file_paths: List[str], candidate_names: List[str], candidate_emails: List[str], db_session_factory):
    # This runs in background
    db = db_session_factory()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return

        job_embedding = pickle.loads(job.embedding)
        job_skills_list = [s.name for s in job.skills]

        for file_path, name, email in zip(file_paths, candidate_names, candidate_emails):
            # 1. Parse text
            text = extract_text(file_path)
            if not text:
                continue

            # 2. Segment and NLP
            sections = nlp_engine.segment_text(text)
            cv_skills = nlp_engine.extract_skills(text)
            exp_years = nlp_engine.calculate_experience_years(sections['experience'] or text)
            cv_embedding = nlp_engine.get_embedding(text)

            # 3. Create/Update Candidate
            candidate = db.query(Candidate).filter(Candidate.email == email).first()
            if not candidate:
                candidate = Candidate(name=name, email=email, total_experience_years=exp_years)
                db.add(candidate)
                db.flush()
            else:
                candidate.total_experience_years = exp_years

            # 4. Save CV Document
            cv_doc = db.query(CVDocument).filter(CVDocument.candidate_id == candidate.id).first()
            if not cv_doc:
                cv_doc = CVDocument(candidate_id=candidate.id, file_path=file_path, raw_text=text, embedding=pickle.dumps(cv_embedding))
                db.add(cv_doc)
            else:
                cv_doc.file_path = file_path
                cv_doc.raw_text = text
                cv_doc.embedding = pickle.dumps(cv_embedding)

            # 5. Handle Skills
            for s_name in cv_skills:
                skill = db.query(Skill).filter(Skill.name == s_name).first()
                if not skill:
                    skill = Skill(name=s_name)
                    db.add(skill)
                    db.flush()
                if skill not in candidate.skills:
                    candidate.skills.append(skill)

            # 6. Calculate Ranking
            scores = nlp_engine.rank_candidate(
                jd_text=job.description,
                jd_embedding=job_embedding,
                cv_text=text,
                cv_embedding=cv_embedding,
                experience_years=exp_years,
                required_experience=0, # Default, could be extracted from JD
                semantic_weight=job.semantic_weight
            )

            # Matched & Missing Skills
            matched = list(set(job_skills_list) & set(cv_skills))
            missing = list(set(job_skills_list) - set(cv_skills))

            ranking = db.query(Ranking).filter(Ranking.job_id == job_id, Ranking.candidate_id == candidate.id).first()
            if not ranking:
                ranking = Ranking(
                    job_id=job_id,
                    candidate_id=candidate.id,
                    semantic_score=scores['semantic_score'],
                    experience_score=scores['experience_score'],
                    final_score=scores['final_score'],
                    matched_skills_json=json.dumps(matched),
                    missing_skills_json=json.dumps(missing)
                )
                db.add(ranking)
            else:
                ranking.semantic_score = scores['semantic_score']
                ranking.experience_score = scores['experience_score']
                ranking.final_score = scores['final_score']
                ranking.matched_skills_json = json.dumps(matched)
                ranking.missing_skills_json = json.dumps(missing)

            db.commit()
    except Exception as e:
        print(f"Error in background processing: {e}")
        db.rollback()
    finally:
        db.close()

@app.post("/jobs/{job_id}/upload-cvs")
async def upload_cvs(job_id: int, background_tasks: BackgroundTasks, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file_paths = []
    names = []
    emails = []

    for file in files:
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_paths.append(file_path)
        name = file.filename.split('.')[0].replace('_', ' ').title()
        email = f"{name.lower().replace(' ', '.')}@example.com"
        names.append(name)
        emails.append(email)

    # Start background processing
    from database import SessionLocal
    background_tasks.add_task(process_cv_batch, job_id, file_paths, names, emails, SessionLocal)

    return {"message": f"Successfully uploaded {len(files)} CVs. Processing started in background.", "job_id": job_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
