# AI-Powered Recruitment System

This is a Final-Year Computer Science project featuring a Semantic Recruitment System for automated CV screening, skill matching, and candidate ranking.

## Features
- **Semantic Matching**: Uses Sentence-BERT (`all-MiniLM-L6-v2`) to understand the context of CVs and Job Descriptions beyond simple keywords.
- **Section-Aware Parsing**: Extracts text from PDF and DOCX files, identifying key sections like Work Experience and Skills.
- **Explainable Ranking**: Provides a final score (0.0 to 1.0) based on Semantic Match (80%) and Experience Weight (20%), along with a list of matched skills.
- **3NF Relational Database**: PostgreSQL-compatible schema (tested with SQLite) ensuring data integrity and normalization.
- **Modern Dashboard**: A React-based recruiter interface for batch uploading CVs and viewing rankings.

## Architecture
- **Backend**: FastAPI (Python)
- **NLP Engine**: spaCy (NER) & Sentence-Transformers (Embeddings)
- **Frontend**: React with Tailwind CSS v4
- **Database**: SQLAlchemy (3NF)

## Setup Instructions

### Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```
3. Set up the environment variables in a `.env` file (see `.env.example`):
   ```
   DATABASE_URL=sqlite:///./recruitment.db
   UPLOAD_DIR=./uploads
   ```
4. Initialize the database:
   ```bash
   python init_db.py
   ```
5. Start the API server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
1. Open the dashboard in your browser (usually `http://localhost:5173`).
2. Create a new Job Description.
3. Select the job and upload CVs in batch (PDF/DOCX/TXT).
4. Wait for the background processing to complete and refresh the rankings to see the results.
