import spacy
from sentence_transformers import SentenceTransformer, util
import numpy as np
import pickle
import re
from datetime import datetime

class NLPEngine:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.nlp = spacy.load("en_core_web_sm")
        self.model = SentenceTransformer(model_name)

    def segment_text(self, text):
        """Simple section-aware segmentation based on common headers."""
        sections = {
            "experience": "",
            "skills": "",
            "education": "",
            "summary": "",
            "other": ""
        }

        headers = {
            "experience": ["work experience", "professional experience", "employment history", "experience"],
            "skills": ["skills", "technical skills", "competencies", "technologies"],
            "education": ["education", "academic background", "qualifications"],
            "summary": ["summary", "profile", "objective"]
        }

        lines = text.split('\n')
        current_section = "other"

        for line in lines:
            clean_line = line.strip().lower()
            if not clean_line:
                continue

            found_header = False
            for sec, keywords in headers.items():
                if any(clean_line == kw or clean_line.startswith(kw + ":") for kw in keywords):
                    current_section = sec
                    found_header = True
                    break

            if not found_header:
                sections[current_section] += line + "\n"

        return sections

    def extract_skills(self, text):
        """Extract skills using spaCy NER and custom rule-based matching."""
        # In a real project, we'd use a large skill database.
        # For this demo, we'll use ORG, PRODUCT entities and some common technical keywords.
        doc = self.nlp(text)
        skills = set()

        # Keywords to look for (simplified)
        tech_keywords = ["python", "java", "javascript", "react", "fastapi", "postgresql", "sql", "aws", "docker", "kubernetes", "nlp", "machine learning", "pytorch", "tensorflow", "ci/cd", "git"]

        for token in doc:
            if token.text.lower() in tech_keywords:
                skills.add(token.text.lower())

        for ent in doc.ents:
            if ent.label_ in ["ORG", "PRODUCT"]:
                # Filter out obvious non-skills if necessary
                skills.add(ent.text.lower())

        return list(skills)

    def calculate_experience_years(self, experience_text):
        """Extract years of experience from text using regex for date patterns."""
        # Pattern for date ranges like "Jan 2020 - Dec 2022", "2018-2021", "2015 - Present"
        date_pattern = r'(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})\s*[-–—to]+\s*(Present|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}|\d{4})'

        matches = re.findall(date_pattern, experience_text, re.IGNORECASE)
        total_years = 0.0

        for start, end in matches:
            try:
                start_date = self._parse_date(start)
                if end.lower() == "present":
                    end_date = datetime.now()
                else:
                    end_date = self._parse_date(end)

                diff = (end_date - start_date).days / 365.25
                if diff > 0:
                    total_years += diff
            except:
                continue

        # Fallback: if no date ranges found, look for "X years"
        if total_years == 0:
            years_match = re.search(r'(\d+)\+?\s*years?', experience_text, re.IGNORECASE)
            if years_match:
                total_years = float(years_match.group(1))

        return round(total_years, 1)

    def _parse_date(self, date_str):
        # Support various formats
        formats = ["%b %Y", "%B %Y", "%Y"]
        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        # If no format matches, try to just get the year
        year_match = re.search(r'\d{4}', date_str)
        if year_match:
            return datetime(int(year_match.group(0)), 1, 1)
        raise ValueError(f"Could not parse date: {date_str}")

    def mask_pii_and_gendered_language(self, text):
        """Redact PII (Names, Emails) and mask gendered language for blind screening."""
        doc = self.nlp(text)
        result_tokens = []

        # Masking rules
        gender_map = {
            "he": "they", "she": "they", "him": "them", "her": "them", "his": "their", "hers": "theirs",
            "himself": "themselves", "herself": "themselves", "chairman": "chairperson",
            "businessman": "businessperson", "businesswoman": "businessperson"
        }

        # We'll use a simple token-based replacement for gendered words
        # and spaCy NER for PII (PERSON, EMAIL not always a label but we can find it)

        # First pass: find Person entities to mask
        person_entities = [ent.text for ent in doc.ents if ent.label_ == "PERSON"]

        for token in doc:
            token_text = token.text
            lower_text = token_text.lower()

            # 1. Mask Gendered Language
            if lower_text in gender_map:
                result_tokens.append(gender_map[lower_text])
            # 2. Mask Persons
            elif any(token_text in p for p in person_entities):
                result_tokens.append("[Candidate Name]")
            # 3. Mask Emails (Simple Regex match since spaCy doesn't always label them)
            elif "@" in token_text and "." in token_text:
                result_tokens.append("[Email Masked]")
            else:
                result_tokens.append(token_text)

        # Reconstruct text with spacing
        return "".join([t + (doc[i].whitespace_ if i < len(doc) else "") for i, t in enumerate(result_tokens)])

    def get_embedding(self, text):
        return self.model.encode(text)

    def calculate_similarity(self, embedding1, embedding2):
        return util.cos_sim(embedding1, embedding2).item()

    def rank_candidate(self, jd_text, jd_embedding, cv_text, cv_embedding, experience_years, exp_section_text="", required_experience=0, semantic_weight=0.8):
        # Semantic Score
        semantic_score = self.calculate_similarity(jd_embedding, cv_embedding)

        # Experience Score
        target_exp = required_experience if required_experience > 0 else 5.0
        exp_score = min(experience_years / target_exp, 1.0)

        # Anti-Gaming Check
        risk_flag = None
        if exp_section_text:
            exp_section_embedding = self.get_embedding(exp_section_text)
            exp_section_similarity = self.calculate_similarity(jd_embedding, exp_section_embedding)

            # If full CV matches very high (>95%) but experience section matches low (<50%)
            if semantic_score > 0.95 and exp_section_similarity < 0.5:
                risk_flag = "Potential Keyword Stuffing Detected"

        # Dynamic weighting
        exp_weight = 1.0 - semantic_weight
        final_score = (semantic_score * semantic_weight) + (exp_score * exp_weight)

        return {
            "semantic_score": round(semantic_score, 4),
            "experience_score": round(exp_score, 4),
            "final_score": round(final_score, 4),
            "extracted_experience": experience_years,
            "risk_flag": risk_flag
        }
