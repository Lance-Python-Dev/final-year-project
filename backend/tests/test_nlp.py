import pytest
import sys
import os
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlp_engine import NLPEngine

@pytest.fixture
def nlp():
    return NLPEngine()

def test_weighted_recency(nlp):
    # Test recent experience (last 3 years)
    now = datetime.now()
    three_years_ago = now - timedelta(days=3*365)

    # Role 1: 3 years ago to Present (all recent)
    role_recent = f"{three_years_ago.strftime('%b %Y')} - Present"
    total, weighted = nlp.calculate_experience_years(role_recent)
    assert total == 3.0
    assert weighted == 3.6 # 3.0 * 1.2

    # Role 2: 6 years ago to 4 years ago (all old)
    six_years_ago = now - timedelta(days=6*365)
    four_years_ago = now - timedelta(days=4*365)
    role_old = f"{six_years_ago.strftime('%Y')} - {four_years_ago.strftime('%Y')}"
    total_old, weighted_old = nlp.calculate_experience_years(role_old)
    assert total_old == 2.0
    assert weighted_old == 1.6 # 2.0 * 0.8

def test_pii_masking(nlp):
    text = "John Doe is a developer. You can contact him at john.doe@example.com. He worked at Google."
    masked = nlp.mask_pii_and_gendered_language(text)

    assert "[Candidate Name]" in masked
    assert "[Email Masked]" in masked
    assert "they" in masked.lower()
    assert "he" not in masked.lower().split()
    assert "John Doe" not in masked

def test_anti_gaming_variance(nlp):
    jd_embedding = nlp.get_embedding("Python Developer with FastAPI experience")
    cv_text = "Python Developer FastAPI " * 50 # High match
    cv_embedding = nlp.get_embedding(cv_text)

    # Case 1: Experience section matches well (Low variance)
    exp_text_good = "Worked as a Python Developer using FastAPI for 3 years."
    result_good = nlp.rank_candidate(
        jd_text="...",
        jd_embedding=jd_embedding,
        cv_text=cv_text,
        cv_embedding=cv_embedding,
        experience_years=3.0,
        exp_section_text=exp_text_good
    )
    assert result_good['risk_flag'] is None
    assert result_good['similarity_variance'] < 0.35

    # Case 2: Experience section matches poorly (High variance)
    exp_text_bad = "I like apples and oranges."
    result_bad = nlp.rank_candidate(
        jd_text="...",
        jd_embedding=jd_embedding,
        cv_text=cv_text,
        cv_embedding=cv_embedding,
        experience_years=3.0,
        exp_section_text=exp_text_bad
    )
    assert result_bad['similarity_variance'] > 0.35
    assert result_bad['risk_flag'] == "High Risk: Potential Keyword Stuffing"
