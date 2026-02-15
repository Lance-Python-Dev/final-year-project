# AI-Powered Recruitment System

This is a professional Decision Support System (DSS) for automated CV screening, semantic skill matching, and objective candidate ranking. It leverages State-of-the-Art Natural Language Processing (NLP) to go beyond keyword matching.

## 🚀 Key Features

### 1. Semantic Ranking Engine
- **Transformer Embeddings**: Uses `all-MiniLM-L6-v2` Sentence-BERT to understand the deep context of experience.
- **Interactive Weighting**: Recruiters can use a dynamic slider to adjust the importance of **Skills vs. Experience** (e.g., 80/20 ratio).
- **Explainable Scoring**: Provides a final score (0.0 to 1.0) with detailed breakdowns of semantic similarity and experience duration.

### 2. Bias Mitigation (Blind Screening)
- **PII Redaction**: A "Blind Mode" toggle that automatically masks names, emails, and contact details.
- **Gender-Neutral Masking**: Utilizes spaCy NER to identify and redact gendered language (pronouns and titles) to ensure fairness in the initial screening phase.

### 3. Explainability & Skill Gap Analysis
- **Matched vs. Missing Skills**: Clearly highlights which required skills were found in the CV and which are missing ("Gaps").
- **Visual Feedback**: Green and red indicators in the dashboard help recruiters quickly assess candidate suitability.

### 4. AI Anti-Gaming (Anomaly Detection)
- **Dual-Vector Comparison**: Detects "JD-stuffing" by comparing the embedding of the full CV against the specific "Work Experience" section.
- **Risk Flags**: Automatically flags candidates if a high semantic match is detected without corresponding evidence in their professional history.

### 5. Spatial Layout Intelligence
- **Two-Column Parsing**: Uses `pdfplumber` bounding box analysis to correctly extract text from sidebar-heavy or multi-column CV layouts, preventing text scrambling.

## 🛠️ Technical Architecture
- **Backend**: FastAPI (Python) with asynchronous `BackgroundTasks` for batch processing.
- **NLP Engine**: spaCy (NER) & Sentence-Transformers (Embeddings).
- **Frontend**: React (Vite) with **Tailwind CSS v4** for a modern, responsive UI.
- **Data Layer**: SQLAlchemy ORM with a **3rd Normal Form (3NF)** relational schema (PostgreSQL/SQLite).

## 📦 Setup Instructions

### Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```
3. Initialize the database:
   ```bash
   python init_db.py
   ```
4. Start the API:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install & Start:
   ```bash
   npm install
   npm run dev
   ```

## 🎓 Academic Boundaries
- **Included**: Batch parsing, NLP preprocessing, NER, Embedding generation, Cosine Similarity, 3NF storage, Explainable dashboard.
- **Excluded**: Interview scheduling, salary prediction, personality analysis.
