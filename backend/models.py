from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, LargeBinary, Table
from sqlalchemy.orm import relationship, declarative_base
import json

Base = declarative_base()

# Many-to-Many junction table for Candidate and Skills
candidate_skills = Table(
    "candidate_skill",
    Base.metadata,
    Column("candidate_id", Integer, ForeignKey("candidate.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skill.id"), primary_key=True),
)

# Many-to-Many junction table for Job and Skills
job_skills = Table(
    "job_skill",
    Base.metadata,
    Column("job_id", Integer, ForeignKey("job.id"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skill.id"), primary_key=True),
)

class Recruiter(Base):
    __tablename__ = "recruiter"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)

    jobs = relationship("Job", back_populates="recruiter")

class Job(Base):
    __tablename__ = "job"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    recruiter_id = Column(Integer, ForeignKey("recruiter.id"))
    semantic_weight = Column(Float, default=0.8) # Weight for semantic score (0.0 to 1.0)
    embedding = Column(LargeBinary, nullable=True) # Stores the 384-dim vector as pickled numpy array

    recruiter = relationship("Recruiter", back_populates="jobs")
    skills = relationship("Skill", secondary=job_skills, back_populates="jobs")
    rankings = relationship("Ranking", back_populates="job")

class Candidate(Base):
    __tablename__ = "candidate"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    total_experience_years = Column(Float, default=0.0)

    cv_document = relationship("CVDocument", back_populates="candidate", uselist=False)
    skills = relationship("Skill", secondary=candidate_skills, back_populates="candidates")
    rankings = relationship("Ranking", back_populates="candidate")

class CVDocument(Base):
    __tablename__ = "cv_document"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidate.id"))
    file_path = Column(String(512), nullable=False)
    raw_text = Column(Text, nullable=True)
    embedding = Column(LargeBinary, nullable=True)

    candidate = relationship("Candidate", back_populates="cv_document")

class Skill(Base):
    __tablename__ = "skill"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    candidates = relationship("Candidate", secondary=candidate_skills, back_populates="skills")
    jobs = relationship("Job", secondary=job_skills, back_populates="skills")

class Ranking(Base):
    __tablename__ = "ranking"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job.id"))
    candidate_id = Column(Integer, ForeignKey("candidate.id"))
    semantic_score = Column(Float)
    experience_score = Column(Float)
    final_score = Column(Float)
    matched_skills_json = Column(Text, nullable=True) # Stores list of skill names as JSON for easy display
    missing_skills_json = Column(Text, nullable=True) # Stores list of missing skill names as JSON

    job = relationship("Job", back_populates="rankings")
    candidate = relationship("Candidate", back_populates="rankings")
