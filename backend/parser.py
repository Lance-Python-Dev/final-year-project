import pdfplumber
import docx
import os

def extract_text_from_pdf(file_path):
    """Layout-aware PDF text extraction handling potential two-column layouts."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                # Detect if the page has a two-column layout
                # We analyze words and their x-coordinates
                words = page.extract_words()
                if not words:
                    continue

                page_width = page.width
                # Simple heuristic: if we have significant text on both sides of the 40% mark
                left_side = [w for w in words if w['x1'] < page_width * 0.4]
                right_side = [w for w in words if w['x0'] > page_width * 0.4]

                # If both sides have substantial content, treat as two-column
                if len(left_side) > 10 and len(right_side) > 10:
                    # Crop the page into two columns
                    left_bbox = (0, 0, page_width * 0.4, page.height)
                    right_bbox = (page_width * 0.4, 0, page_width, page.height)

                    left_text = page.within_bbox(left_bbox).extract_text() or ""
                    right_text = page.within_bbox(right_bbox).extract_text() or ""

                    # Usually sidebar contains skills/contact, main body contains experience
                    # We concatenate them logically
                    page_text = left_text + "\n" + right_text
                else:
                    # Single column layout
                    page_text = page.extract_text()

                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error parsing PDF {file_path}: {e}")
    return text

def extract_text_from_docx(file_path):
    text = ""
    try:
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error parsing DOCX {file_path}: {e}")
    return text

def extract_text(file_path):
    _, ext = os.path.splitext(file_path.lower())
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext == '.docx':
        return extract_text_from_docx(file_path)
    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        return ""
