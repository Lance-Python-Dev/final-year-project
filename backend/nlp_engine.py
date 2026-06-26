"""
NLPEngine — AI Recruitment System scoring brain.

Responsibilities:
  - Segment CV text into labelled sections (experience, skills, education, summary)
  - Extract skills from any occupational domain (tech + 8 domain vocabularies)
  - Detect the JD's occupational domain and use domain-specific keywords
  - Parse experience date ranges, apply Weighted Recency Scoring (WES)
  - Infer seniority target when JD omits explicit experience requirements
  - Rank each candidate with a composite score:
        final_score = α × semantic_score + β × experience_score
  - Detect keyword-stuffing via two-signal anti-gaming logic
  - Mask PII and gendered pronouns for blind-screening mode
"""

import spacy
from sentence_transformers import SentenceTransformer, util
import numpy as np
import re
from datetime import datetime


class NLPEngine:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.nlp = spacy.load("en_core_web_sm")
        self.model = SentenceTransformer(model_name)

        # ── TECH / UNIVERSAL KEYWORDS ────────────────────────────────────────
        # Ordered longest-first so multi-word phrases match before sub-words.
        self.tech_keywords = sorted([
            # Programming Languages
            "python", "java", "javascript", "typescript", "golang", "rust",
            "scala", "kotlin", "swift", "php", "ruby", "c++", "c#", "bash",
            "r programming", "r language",

            # Web Frameworks & Libraries
            "react", "vue.js", "angular", "next.js", "node.js", "django",
            "flask", "fastapi", "spring boot", "rails", "express.js",
            "graphql", "rest api", "restful api", "html", "css", "tailwind",
            "redux", "webpack", "vite",

            # Data Science & ML
            "machine learning", "deep learning", "natural language processing",
            "computer vision", "pytorch", "tensorflow", "keras", "scikit-learn",
            "xgboost", "random forest", "neural network", "large language model",
            "generative ai", "langchain", "hugging face", "transformers",
            "opencv", "pandas", "numpy", "matplotlib", "seaborn", "jupyter",
            "data science", "data analysis", "statistical analysis",
            "tableau", "power bi", "etl", "data pipeline", "data engineering",
            "feature engineering", "model deployment", "mlops", "nlp",

            # Cloud & Infrastructure
            "aws", "azure", "gcp", "google cloud", "cloud computing",
            "serverless", "aws lambda", "amazon ec2", "amazon s3",
            "cloudformation", "terraform", "ansible", "pulumi",
            "microservices", "cloud native",

            # DevOps & CI/CD
            "docker", "kubernetes", "ci/cd", "jenkins", "github actions",
            "gitlab ci", "circleci", "helm", "argo cd", "prometheus",
            "grafana", "nginx", "apache", "linux", "shell scripting",
            "devops", "site reliability engineering", "monitoring",
            "load balancing",

            # Databases
            "sql", "postgresql", "mysql", "mongodb", "redis",
            "elasticsearch", "cassandra", "dynamodb", "neo4j", "sqlite",
            "oracle", "firebase", "supabase", "nosql", "database design",

            # Version Control & Collaboration
            "git", "github", "gitlab", "bitbucket", "jira", "confluence",

            # Soft Skills
            "communication", "teamwork", "leadership", "problem solving",
            "agile", "scrum", "project management", "time management",
            "critical thinking", "collaboration", "presentation",
            "mentoring", "stakeholder management",
        ], key=len, reverse=True)

        # ── PHASE 1: DOMAIN-SPECIFIC KEYWORD VOCABULARIES ───────────────────
        self.domain_keywords = {
            "finance": sorted([
                "financial modeling", "financial analysis", "investment banking",
                "private equity", "portfolio management", "risk management",
                "mergers and acquisitions", "derivatives", "asset management",
                "accounting", "budgeting", "reconciliation", "auditing",
                "tax compliance", "ifrs", "gaap", "quickbooks", "bloomberg",
                "valuation", "equity research", "fixed income", "hedge fund",
                "financial reporting", "forecasting", "variance analysis",
                "cash flow", "balance sheet", "profit and loss", "treasury",
                "credit analysis", "underwriting", "actuarial", "sap", "excel",
                "vba", "financial planning", "cost accounting", "accounts payable",
                "accounts receivable", "general ledger", "tax return",
            ], key=len, reverse=True),

            "healthcare": sorted([
                "patient care", "clinical trials", "medical coding",
                "public health", "infection control", "electronic health records",
                "clinical research", "pharmacology", "evidence-based practice",
                "ehr", "emr", "epic", "cerner", "icd-10", "hipaa",
                "nursing", "diagnosis", "radiology", "surgery", "anatomy",
                "physiology", "pathology", "epidemiology", "dosage",
                "triage", "patient assessment", "medication administration",
                "vital signs", "wound care", "palliative care", "oncology",
                "pediatrics", "obstetrics", "emergency medicine", "icu",
                "medical billing", "health informatics", "telemedicine",
                "clinical", "healthcare", "hospital", "physician", "pharmacy",
            ], key=len, reverse=True),

            "legal": sorted([
                "contract law", "legal research", "intellectual property",
                "corporate law", "employment law", "mergers and acquisitions",
                "regulatory compliance", "due diligence", "motion practice",
                "litigation", "westlaw", "lexisnexis", "patent", "trademark",
                "deposition", "discovery", "estate planning", "arbitration",
                "mediation", "securities law", "real estate law",
                "criminal law", "family law", "immigration law",
                "legal drafting", "legal writing", "case management",
                "compliance", "contract negotiation", "legal analysis",
                "bar admission", "paralegal", "attorney", "counsel",
                "jurisdiction", "statute", "case law", "brief writing",
            ], key=len, reverse=True),

            "engineering": sorted([
                "finite element analysis", "mechanical design", "electrical engineering",
                "structural analysis", "process engineering", "material science",
                "project engineering", "civil engineering", "circuit design",
                "thermodynamics", "fluid dynamics", "hvac", "piping design",
                "instrumentation", "pvt analysis", "autocad", "solidworks",
                "catia", "ansys", "matlab", "plc", "scada", "embedded systems",
                "power systems", "control systems", "robotics", "manufacturing",
                "quality assurance", "quality control", "iso 9001", "six sigma",
                "lean manufacturing", "cad", "cam", "bim", "construction",
                "surveying", "geotechnical", "environmental engineering",
                "petroleum engineering", "chemical engineering", "safety",
            ], key=len, reverse=True),

            "marketing": sorted([
                "content marketing", "social media marketing", "brand management",
                "market research", "customer acquisition", "digital marketing",
                "email marketing", "campaign management", "google analytics",
                "conversion rate optimization", "customer retention",
                "adobe creative suite", "seo", "sem", "ppc", "hubspot",
                "salesforce", "crm", "lead generation", "copywriting",
                "marketing strategy", "competitive analysis", "a/b testing",
                "product marketing", "growth hacking", "influencer marketing",
                "media buying", "public relations", "event marketing",
                "affiliate marketing", "video marketing", "podcast",
                "brand awareness", "customer journey", "funnel optimization",
                "marketing automation", "b2b marketing", "b2c marketing",
                "go-to-market", "product launch", "market segmentation",
            ], key=len, reverse=True),

            "education": sorted([
                "curriculum development", "instructional design", "lesson planning",
                "classroom management", "educational technology", "special education",
                "student assessment", "learning outcomes", "training delivery",
                "e-learning", "instructional technology", "pedagogy",
                "lms", "moodle", "canvas", "blackboard", "google classroom",
                "tutoring", "mentoring students", "differentiated instruction",
                "blended learning", "flipped classroom", "formative assessment",
                "summative assessment", "iep", "gifted education",
                "early childhood", "higher education", "adult learning",
                "professional development", "workshop facilitation",
                "course design", "academic advising", "accreditation",
                "teaching", "education", "school", "university", "training",
            ], key=len, reverse=True),

            "sales": sorted([
                "business development", "account management", "pipeline management",
                "revenue growth", "territory management", "channel sales",
                "sales strategy", "client relations", "cold calling",
                "quota attainment", "inside sales", "outside sales",
                "b2b sales", "b2c sales", "proposal writing", "rfp",
                "upselling", "cross-selling", "negotiation", "closing",
                "salesforce", "crm", "hubspot", "lead qualification",
                "prospecting", "customer success", "renewal management",
                "sales forecasting", "market expansion", "partnership",
                "sales operations", "customer onboarding", "demo",
                "solution selling", "consultative selling", "key accounts",
                "enterprise sales", "saas sales", "retail sales",
            ], key=len, reverse=True),

            "operations_hr": sorted([
                "supply chain management", "inventory management", "vendor management",
                "talent acquisition", "performance management", "organizational development",
                "process improvement", "change management", "employee relations",
                "logistics", "procurement", "operations management",
                "human resources", "recruitment", "onboarding", "payroll",
                "hris", "workday", "sap hr", "adp", "bamboohr",
                "erp", "lean", "six sigma", "kaizen", "5s",
                "workforce planning", "succession planning", "compensation",
                "benefits administration", "labor relations", "compliance",
                "facilities management", "project coordination", "kpi",
                "business process", "sop", "quality management",
                "fleet management", "warehouse management", "forecasting",
                "capacity planning", "resource allocation",
            ], key=len, reverse=True),
        }

        # Flat list of all domain keywords (for domain detection scoring)
        self.all_domain_keywords = [
            kw for kws in self.domain_keywords.values() for kw in kws
        ]

    # ──────────────────────────────────────────────────────────────────────
    # PHASE 1: DOMAIN DETECTION
    # ──────────────────────────────────────────────────────────────────────

    def _detect_domain(self, jd_text):
        """Identify the primary occupational domain of a job description.

        Returns (primary_domain, secondary_domain, scores_dict).
        secondary_domain is None when no clear runner-up exists.
        """
        text_lower = jd_text.lower()
        scores = {}

        for domain, keywords in self.domain_keywords.items():
            count = 0
            for kw in keywords:
                pattern = r'(?<![a-z0-9])' + re.escape(kw) + r'(?![a-z0-9])'
                if re.search(pattern, text_lower):
                    # Longer phrases count more (they're more specific)
                    count += 1 + len(kw.split()) - 1
            scores[domain] = count

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        primary = ranked[0][0] if ranked[0][1] > 0 else None
        secondary = ranked[1][0] if len(ranked) > 1 and ranked[1][1] > 0 else None

        # If top score is 0, fall back to "tech" via tech_keywords
        if primary is None:
            tech_count = sum(
                1 for kw in self.tech_keywords
                if re.search(r'(?<![a-z0-9])' + re.escape(kw) + r'(?![a-z0-9])', text_lower)
            )
            if tech_count > 0:
                primary = "tech"

        return primary, secondary, scores

    # ──────────────────────────────────────────────────────────────────────
    # TEXT SEGMENTATION
    # ──────────────────────────────────────────────────────────────────────

    def segment_text(self, text):
        """Section-aware segmentation. Tolerates numbered headers, ALL CAPS,
        and partial-match variants (e.g. 'Work History' → experience).

        Phase 4 fix: header lines must be ≤30 chars OR exactly match a known
        phrase — prevents long prose sentences that happen to contain 'experience'
        from triggering a false section break.
        """
        sections = {
            "experience": "",
            "skills": "",
            "education": "",
            "summary": "",
            "other": ""
        }

        # Exact/canonical header phrases — matched as substrings of short lines
        headers = {
            "experience": [
                "work experience", "professional experience",
                "employment history", "work history", "career history",
                "experience", "positions held", "relevant experience",
            ],
            "skills": [
                "technical skills", "core competencies", "key skills",
                "tech stack", "skills", "competencies",
                "technologies", "tools", "expertise",
            ],
            "education": [
                "academic background", "academic history",
                "education", "qualifications", "degrees", "certifications",
            ],
            "summary": [
                "professional summary", "career objective",
                "summary", "profile", "objective", "about me",
            ],
        }

        lines = text.split('\n')
        current_section = "other"

        for line in lines:
            clean_line = re.sub(r'^[\s\d\.\-\•\*\►]+', '', line).strip().lower()

            if not clean_line:
                continue

            # Phase 4: tighter guard — header must be ≤30 chars OR the line
            # is exactly equal to a known phrase (after stripping punctuation).
            line_no_punct = re.sub(r'[^a-z\s]', '', clean_line).strip()
            is_short = len(clean_line) <= 30
            matched_section = None

            if is_short:
                for sec, keywords in headers.items():
                    if any(kw == line_no_punct or kw in clean_line for kw in keywords):
                        matched_section = sec
                        break
            else:
                # For longer lines check only exact phrase match at line boundaries
                for sec, keywords in headers.items():
                    if any(line_no_punct == kw for kw in keywords):
                        matched_section = sec
                        break

            if matched_section:
                current_section = matched_section
                continue

            sections[current_section] += line + "\n"

        return sections

    # ──────────────────────────────────────────────────────────────────────
    # SKILL EXTRACTION  (Phase 1: domain-aware)
    # ──────────────────────────────────────────────────────────────────────

    def extract_skills(self, text, jd_text=None):
        """Phrase-level skill extraction with optional domain awareness.

        When jd_text is provided the domain is detected and domain-specific
        keywords are added to the active vocabulary, ensuring that non-tech
        roles (finance, healthcare, legal, …) score their own terminology.
        """
        text_lower = text.lower()
        found = set()

        # Always search universal tech keywords
        active_keywords = list(self.tech_keywords)

        # Phase 1: add domain-specific vocabulary when JD context is available
        if jd_text is not None:
            primary, secondary, _ = self._detect_domain(jd_text)
            for domain_key in [primary, secondary]:
                if domain_key and domain_key in self.domain_keywords:
                    active_keywords = active_keywords + self.domain_keywords[domain_key]
            # Re-sort to maintain longest-first ordering across merged lists
            active_keywords = sorted(set(active_keywords), key=len, reverse=True)

        for keyword in active_keywords:
            pattern = r'(?<![a-z0-9])' + re.escape(keyword) + r'(?![a-z0-9])'
            if re.search(pattern, text_lower):
                found.add(keyword)

        return list(found)

    # ──────────────────────────────────────────────────────────────────────
    # EXPERIENCE EXTRACTION
    # ──────────────────────────────────────────────────────────────────────

    def calculate_experience_years(self, experience_text):
        """Extract years of experience with Weighted Recency Scoring (WES).

        Handles: 'Jan 2020 - Dec 2022', 'January 2020 to Present',
                 '2018 till date', '01/2020 - 12/2022', 'over 5 years', etc.
        WES: recent work (<=3 yr ago) x 1.2, older x 0.8.
        Overlapping ranges are merged before summing to avoid double-counting.
        """
        now = datetime.now()
        three_years_ago = now.replace(year=now.year - 3)

        # Words that mean "until now" — covers common CV variants.
        # \bdate\b handles the case where SEP already consumed "till"/"to"
        # leaving only "date" (e.g. "March 2021 till date" → sep=till, end=date).
        PRESENT_PAT = (
            r'(?:present|current|now|ongoing|today'
            r'|till\s+date|to\s+date|till\s+now|to\s+now'
            r'|(?:the\s+)?present\s+day|\bdate\b)'
        )

        # Full and abbreviated month names with optional trailing dot/comma
        MONTH = (
            r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?'
            r'|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?'
            r'|Dec(?:ember)?)\.?'
        )

        # Range separator: en/em-dash, ASCII hyphens, or spelled-out words.
        # Use word boundaries so 'to'/'till'/'until' are not matched as lone chars.
        SEP = r'\s*(?:–|—|‐|‑|-{1,3}|\bto\b|\btill\b|\buntil\b|\bthrough\b)\s*'

        patterns = [
            # "Jan 2020 - Dec 2022" / "January 2020 to Present" / "Jan, 2020 - 2023"
            (r'(' + MONTH + r'\s*,?\s*\d{4})'
             + SEP +
             r'(' + PRESENT_PAT + r'|' + MONTH + r'\s*,?\s*\d{4}|\d{4})'),

            # "2018 - 2022" / "2018 to Present"
            (r'(\b\d{4}\b)'
             + SEP +
             r'(' + PRESENT_PAT + r'|\b\d{4}\b)'),

            # "01/2020 - 12/2022" / "2020/01 - 2022/12"
            (r'(\d{1,2}[/\-]\d{4}|\d{4}[/\-]\d{1,2})'
             + SEP +
             r'(' + PRESENT_PAT + r'|\d{1,2}[/\-]\d{4}|\d{4}[/\-]\d{1,2})'),
        ]

        raw_ranges = []

        for pat in patterns:
            for start_str, end_str in re.findall(pat, experience_text, re.IGNORECASE):
                try:
                    s_clean = start_str.strip()
                    e_clean = end_str.strip()
                    start_date = self._parse_date(s_clean)
                    end_date = (now if re.match(r'(?i)' + PRESENT_PAT, e_clean)
                                else self._parse_date(e_clean))

                    if end_date <= start_date:
                        continue
                    diff = (end_date - start_date).days / 365.25
                    if diff <= 0 or diff > 55:
                        continue
                    if start_date.year < 1960 or start_date.year > now.year:
                        continue

                    raw_ranges.append((start_date, end_date))
                except Exception:
                    continue

        # Merge overlapping / adjacent ranges (avoids double-counting for candidates
        # whose jobs are listed multiple times or have overlapping date formats)
        merged = self._merge_date_ranges(raw_ranges)

        total_years = 0.0
        weighted_years = 0.0

        for start, end in merged:
            diff = (end - start).days / 365.25
            total_years += diff
            if end > three_years_ago:
                recent_start = max(start, three_years_ago)
                recent_diff = (end - recent_start).days / 365.25
                old_diff = max(0.0, (recent_start - start).days / 365.25)
                weighted_years += (recent_diff * 1.2) + (old_diff * 0.8)
            else:
                weighted_years += diff * 0.8

        # Fallback: written-out experience claims
        if total_years == 0:
            fallback_patterns = [
                r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:professional|work|industry|relevant|hands-on|solid)?\s*experience',
                r'experience\s+(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)',
                r'(?:over|more\s+than|nearly|almost|upwards?\s+of)\s+(\d+)\+?\s*(?:years?|yrs?)',
                r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:working|in\s+(?:the\s+)?(?:software|industry|field|tech|finance|healthcare|legal|engineering))',
                r'(\d+)\s*(?:years?|yrs?)\s+experience',
            ]
            for fp in fallback_patterns:
                m = re.search(fp, experience_text, re.IGNORECASE)
                if m:
                    total_years = float(m.group(1))
                    weighted_years = total_years
                    break

        return round(total_years, 1), round(weighted_years, 1)

    def _merge_date_ranges(self, ranges):
        """Merge overlapping / adjacent date ranges (interval merge algorithm).

        A gap of up to 31 days between jobs is treated as continuous — this
        accounts for notice periods and job-search gaps without under-counting.
        """
        if not ranges:
            return []
        from datetime import timedelta
        sorted_r = sorted(ranges, key=lambda x: x[0])
        merged = [list(sorted_r[0])]
        for start, end in sorted_r[1:]:
            if start <= merged[-1][1] + timedelta(days=31):
                merged[-1][1] = max(merged[-1][1], end)
            else:
                merged.append([start, end])
        return [tuple(r) for r in merged]

    def _parse_date(self, date_str):
        # Remove commas ("January, 2020" -> "January 2020")
        date_str = re.sub(r',', '', date_str).strip()

        # MM/YYYY or MM-YYYY
        m = re.fullmatch(r'(\d{1,2})[/\-](\d{4})', date_str)
        if m:
            month, year = int(m.group(1)), int(m.group(2))
            if 1 <= month <= 12:
                return datetime(year, month, 1)

        # YYYY/MM or YYYY-MM
        m = re.fullmatch(r'(\d{4})[/\-](\d{1,2})', date_str)
        if m:
            year, month = int(m.group(1)), int(m.group(2))
            if 1 <= month <= 12:
                return datetime(year, month, 1)

        # Month name (abbreviated or full) + Year
        for fmt in ("%b %Y", "%b. %Y", "%B %Y", "%B. %Y"):
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                pass

        # Year only — use July 1 (mid-year) to minimise over/under-count error
        m = re.search(r'\b(\d{4})\b', date_str)
        if m:
            return datetime(int(m.group(1)), 7, 1)

        raise ValueError(f"Cannot parse date: {date_str!r}")

    # ──────────────────────────────────────────────────────────────────────
    # REQUIRED EXPERIENCE EXTRACTION + SENIORITY INFERENCE  (Phase 2)
    # ──────────────────────────────────────────────────────────────────────

    def _infer_seniority_target(self, jd_text):
        """Infer expected experience years from seniority language in JD.

        Returns the inferred target years, or None if no seniority signal found.
        """
        text_lower = jd_text.lower()

        # Ordered from most to least senior so the first match wins
        seniority_clusters = [
            (["vp ", "vice president", "director", "head of", "chief ", "c-level",
               "cto", "cfo", "ceo", "coo", "managing director"], 10.0),
            (["staff engineer", "principal engineer", "distinguished", "fellow",
               "staff ", "principal "], 8.0),
            (["senior manager", "engineering manager", "people manager",
               "team lead", "tech lead", "team leader", "manager"], 8.0),
            (["senior ", "sr.", "sr ", "lead "], 6.0),
            (["mid-level", "mid level", "associate", "intermediate"], 3.0),
            (["junior", "jr.", "jr ", "entry level", "entry-level"], 1.5),
            (["intern", "internship", "trainee", "graduate ", "fresh graduate"], 0.5),
        ]

        for signals, years in seniority_clusters:
            if any(sig in text_lower for sig in signals):
                return years

        return None

    def extract_required_experience(self, jd_text):
        """Parse minimum required years from JD; fall back to seniority inference."""
        patterns = [
            r'(\d+)\+?\s*years?\s+of\s+(?:relevant\s+|proven\s+|professional\s+)?experience',
            r'minimum\s+(?:of\s+)?(\d+)\s*\+?\s*years?',
            r'at\s+least\s+(\d+)\s*\+?\s*years?',
            r'(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:proven|relevant|professional|work|industry|hands-on)?\s*experience',
            r'experience\s*[:\-]?\s*(\d+)\s*\+?\s*years?',
            r'(\d+)\s*[-–]\s*\d+\s*years?\s+(?:of\s+)?experience',
        ]
        for pattern in patterns:
            match = re.search(pattern, jd_text, re.IGNORECASE)
            if match:
                return float(match.group(1))

        # Phase 2 fallback: derive from seniority language
        inferred = self._infer_seniority_target(jd_text)
        return inferred if inferred is not None else 0.0

    # ──────────────────────────────────────────────────────────────────────
    # PII MASKING  (Phase 4 fix: span-based to avoid substring collisions)
    # ──────────────────────────────────────────────────────────────────────

    def mask_pii_and_gendered_language(self, text):
        """Mask names, emails, and gendered pronouns for blind screening.

        Phase 4 fix: uses entity character spans instead of substring search,
        preventing 'Lance' from masking any token that merely contains 'Lance'.
        """
        doc = self.nlp(text)
        gender_map = {
            "he": "they", "she": "they", "him": "them", "her": "them",
            "his": "their", "hers": "theirs", "himself": "themselves",
            "herself": "themselves", "chairman": "chairperson",
            "businessman": "businessperson", "businesswoman": "businessperson",
        }

        # Build a set of (start, end) character spans for PERSON entities
        person_spans = {(ent.start_char, ent.end_char) for ent in doc.ents if ent.label_ == "PERSON"}

        result = []
        for token in doc:
            low = token.text.lower()
            if low in gender_map:
                result.append(gender_map[low])
            elif (token.idx, token.idx + len(token.text)) in person_spans or \
                 any(s <= token.idx and token.idx + len(token.text) <= e for s, e in person_spans):
                result.append("[Candidate]")
            elif "@" in token.text and "." in token.text:
                result.append("[Email]")
            else:
                result.append(token.text)

        return "".join(
            t + (doc[i].whitespace_ if i < len(doc) else "")
            for i, t in enumerate(result)
        )

    # ──────────────────────────────────────────────────────────────────────
    # EMBEDDINGS
    # ──────────────────────────────────────────────────────────────────────

    def get_embedding(self, text):
        return self.model.encode(text[:1800] if len(text) > 1800 else text)

    def calculate_similarity(self, emb1, emb2):
        return util.cos_sim(emb1, emb2).item()

    def _embed_section(self, text, max_chars=1800):
        """Embed a CV section; returns None if too short to be meaningful.

        Phase 4: lowered minimum threshold from 30 → 15 chars so that brief
        skills sections ('Python, SQL, Excel') are still embedded.
        """
        stripped = text.strip()
        if len(stripped) < 15:
            return None
        return self.get_embedding(stripped[:max_chars])

    # ──────────────────────────────────────────────────────────────────────
    # RANKING  (core algorithm)
    # ──────────────────────────────────────────────────────────────────────

    def rank_candidate(
        self,
        jd_text,
        jd_embedding,
        cv_text,
        cv_embedding,
        experience_years,
        weighted_experience_years=None,
        exp_section_text="",
        skills_section_text="",
        required_experience=0,
        semantic_weight=0.8,
    ):
        """Score a candidate CV against a job description.

        Scoring components
        ──────────────────
        1. Embedding similarity  — best-section cosine similarity to JD
        2. Skill overlap ratio   — fraction of JD keywords found in CV
                                   (domain-aware vocabulary)
        3. Experience score (WES) — weighted recency experience vs target
                                    (seniority-aware target)

        Final formula (contract unchanged):
            final_score = α × semantic_score + β × experience_score

        Anti-gaming uses two signals:
            Signal A — skills-section embedding much higher than exp-section
            Signal B — keyword density mismatch between skills vs exp section
        """

        # ── DOMAIN DETECTION ────────────────────────────────────────────────
        primary_domain, secondary_domain, domain_scores = self._detect_domain(jd_text)

        # ── 1. EMBEDDING SIMILARITY ─────────────────────────────────────────
        full_sim = max(0.0, self.calculate_similarity(jd_embedding, cv_embedding))
        section_sims = [full_sim]

        exp_emb = self._embed_section(exp_section_text)
        if exp_emb is not None:
            section_sims.append(max(0.0, self.calculate_similarity(jd_embedding, exp_emb)))

        sk_emb = self._embed_section(skills_section_text, max_chars=1000)
        if sk_emb is not None:
            section_sims.append(max(0.0, self.calculate_similarity(jd_embedding, sk_emb)))

        best_sim = max(section_sims)
        embedding_sim = best_sim * 0.7 + full_sim * 0.3

        # ── 2. SKILL OVERLAP RATIO (domain-aware) ───────────────────────────
        jd_skills = set(self.extract_skills(jd_text, jd_text=jd_text))
        cv_skills = set(self.extract_skills(cv_text, jd_text=jd_text))

        if jd_skills:
            skill_overlap = len(jd_skills & cv_skills) / len(jd_skills)
        else:
            skill_overlap = embedding_sim

        # ── 3. COMPOSITE SEMANTIC SCORE ─────────────────────────────────────
        semantic_score = max(0.0, min(1.0, embedding_sim * 0.65 + skill_overlap * 0.35))

        # ── 4. EXPERIENCE SCORE (WES + seniority-aware target) ──────────────
        exp_to_use = (
            weighted_experience_years
            if weighted_experience_years and weighted_experience_years > 0
            else experience_years
        )

        # Phase 2: default target is 3.0 (more realistic mid-level baseline);
        # use required_experience when explicitly set in JD, otherwise infer
        # from seniority language, otherwise fall back to 3.0.
        if required_experience and required_experience > 0:
            target_exp = required_experience
        else:
            inferred = self._infer_seniority_target(jd_text)
            target_exp = inferred if inferred is not None else 3.0

        exp_score = min(exp_to_use / target_exp, 1.0) if exp_to_use > 0 else 0.0

        # ── 5. FINAL COMPOSITE SCORE ─────────────────────────────────────────
        exp_weight = 1.0 - semantic_weight
        final_score = max(0.0, min(1.0, (semantic_score * semantic_weight) + (exp_score * exp_weight)))

        # ── 6. ANTI-GAMING — TWO-SIGNAL DETECTION (Phase 3) ─────────────────
        risk_flag = None
        similarity_variance = 0.0

        # Count keyword hits per section (domain-aware vocabulary)
        active_kws = list(self.tech_keywords)
        for dk in [primary_domain, secondary_domain]:
            if dk and dk in self.domain_keywords:
                active_kws += self.domain_keywords[dk]
        active_kws = sorted(set(active_kws), key=len, reverse=True)

        def _count_keyword_hits(section_text):
            t = section_text.lower()
            count = 0
            for kw in active_kws:
                pat = r'(?<![a-z0-9])' + re.escape(kw) + r'(?![a-z0-9])'
                if re.search(pat, t):
                    count += 1
            return count

        sk_kw_count = _count_keyword_hits(skills_section_text) if skills_section_text.strip() else 0
        exp_kw_count = _count_keyword_hits(exp_section_text) if exp_section_text.strip() else 0

        # Signal A: embedding variance (skills section much more similar than experience)
        signal_a = False
        if exp_emb is not None and sk_emb is not None:
            exp_sim_val = max(0.0, self.calculate_similarity(jd_embedding, exp_emb))
            sk_sim_val  = max(0.0, self.calculate_similarity(jd_embedding, sk_emb))
            if exp_sim_val > 0.01:
                variance = (sk_sim_val - exp_sim_val) / exp_sim_val
                similarity_variance = max(0.0, variance)
                if similarity_variance > 0.35:
                    signal_a = True
        elif exp_emb is not None:
            exp_sim_val = max(0.0, self.calculate_similarity(jd_embedding, exp_emb))
            if full_sim > 0.01 and exp_sim_val > 0.01:
                variance = (full_sim - exp_sim_val) / full_sim
                similarity_variance = max(0.0, variance)
                if similarity_variance > 0.5:
                    signal_a = True

        # Signal B: keyword density mismatch
        # Fires when skills section is loaded with keywords but experience section has none,
        # or skills section has 3× more hits than experience (with ≥6 skills-section hits).
        signal_b = False
        if sk_kw_count >= 5 and exp_kw_count == 0:
            signal_b = True
        elif sk_kw_count >= 6 and exp_kw_count > 0 and sk_kw_count >= 3 * exp_kw_count:
            signal_b = True

        # Combine signals
        if signal_a and signal_b:
            risk_flag = "High Risk: Keyword Stuffing Detected"
        elif signal_a:
            risk_flag = "Moderate Risk: Inconsistent Profile"
        elif signal_b:
            risk_flag = "Moderate Risk: Keyword Density Mismatch"

        return {
            "semantic_score":                round(semantic_score,        4),
            "experience_score":              round(exp_score,             4),
            "final_score":                   round(final_score,           4),
            "extracted_experience":          experience_years,
            "weighted_experience":           weighted_experience_years,
            "similarity_variance":           round(similarity_variance,   4),
            "risk_flag":                     risk_flag,
            "jd_skills":                     list(jd_skills),
            "cv_skills":                     list(cv_skills),
            "detected_domain":               primary_domain,
            "resolved_experience_target":    round(target_exp,            1),
            "skills_section_keyword_count":  sk_kw_count,
            "experience_section_keyword_count": exp_kw_count,
        }


# ─────────────────────────────────────────────────────────────────────────────
# SELF-VERIFICATION  (python nlp_engine.py)
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import os as _os
    _os.environ.setdefault("HF_HUB_OFFLINE", "1")
    _os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    _os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
    engine = NLPEngine()

    def run_test(name, condition):
        status = "PASS" if condition else "FAIL"
        print(f"  [{status}] {name}")
        return condition

    print("\n=== Phase 1: Domain Detection ===")
    finance_jd = "We need a CFA with IFRS knowledge, financial modeling in Excel, Bloomberg terminal experience, and strong risk management skills."
    p, s, sc = engine._detect_domain(finance_jd)
    run_test("Finance JD detected as 'finance'", p == "finance")
    run_test("Finance domain scores > 0", sc.get("finance", 0) > 0)

    healthcare_jd = "RN with 3+ years patient care, EHR/Epic experience, HIPAA knowledge and clinical triage skills required."
    p2, _, _ = engine._detect_domain(healthcare_jd)
    run_test("Healthcare JD detected as 'healthcare'", p2 == "healthcare")

    print("\n=== Phase 1: Domain-Aware Skill Extraction ===")
    finance_cv = "Managed financial modeling and budgeting in Excel. CFA certified. Proficient in Bloomberg and IFRS reporting."
    skills = engine.extract_skills(finance_cv, jd_text=finance_jd)
    run_test("Finance CV extracts 'financial modeling'", "financial modeling" in skills)
    run_test("Finance CV extracts 'bloomberg'", "bloomberg" in skills)

    tech_jd = "Looking for a Python developer with FastAPI, PostgreSQL, and Docker experience."
    tech_cv = "Built REST APIs with FastAPI and PostgreSQL. Deployed on Docker and AWS."
    tech_skills = engine.extract_skills(tech_cv, jd_text=tech_jd)
    run_test("Tech CV extracts 'fastapi'", "fastapi" in tech_skills)
    run_test("Tech CV extracts 'docker'", "docker" in tech_skills)

    print("\n=== Phase 2: Seniority Inference ===")
    run_test("'Senior Engineer' infers 6.0 yrs", engine._infer_seniority_target("Senior Engineer role") == 6.0)
    run_test("'Junior Developer' infers 1.5 yrs", engine._infer_seniority_target("Junior Developer position") == 1.5)
    run_test("'Intern' infers 0.5 yrs", engine._infer_seniority_target("Summer Internship for graduates") == 0.5)
    run_test("'Engineering Manager' infers 8.0 yrs", engine._infer_seniority_target("Engineering Manager to lead a team") == 8.0)
    run_test("No seniority returns None", engine._infer_seniority_target("Software role available") is None)

    run_test("extract_required_experience falls back to seniority",
             engine.extract_required_experience("Looking for a Senior Data Scientist") == 6.0)
    run_test("extract_required_experience uses explicit years when present",
             engine.extract_required_experience("Minimum 4 years of experience required") == 4.0)

    print("\n=== Phase 3: Anti-Gaming (Signal B) ===")
    # Skills section loaded with keywords, experience section empty
    sk_count = sum(
        1 for kw in engine.tech_keywords
        if re.search(r'(?<![a-z0-9])' + re.escape(kw) + r'(?![a-z0-9])',
                     "python java sql docker kubernetes aws react angular vue.js node.js".lower())
    )
    run_test("Keyword-dense skills section has >=5 hits", sk_count >= 5)

    print("\n=== Phase 4: Segment Text (header guard) ===")
    tricky_text = "I have extensive experience in finance and accounting.\nSkills\npython\nsql\n"
    segs = engine.segment_text(tricky_text)
    run_test("Long prose line not treated as header", "extensive experience" in segs["other"] or "extensive experience" in segs["experience"])
    run_test("'Skills' header line detected", "python" in segs["skills"] or "sql" in segs["skills"])

    print("\n=== Phase 4: _embed_section threshold ===")
    run_test(">=15-char section embeds (not None)", engine._embed_section("Python, SQL, Excel") is not None)  # 18 chars
    run_test("<15-char section returns None", engine._embed_section("Short") is None)  # 5 chars

    print("\nDone.\n")
