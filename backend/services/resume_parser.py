"""
HireSense AI — Resume Parser Service
Extracts structured data from PDF resumes.
"""

import re
import pdfplumber
from typing import Optional
from backend.services.skill_dictionary import find_skills_in_text


class ResumeParser:
    """Parses PDF resumes and extracts structured candidate information."""

    # Section header patterns
    SECTION_PATTERNS = {
        "experience": re.compile(
            r"^(?:work\s+)?experience|employment\s+history|professional\s+experience|work\s+history",
            re.IGNORECASE | re.MULTILINE,
        ),
        "education": re.compile(
            r"^education|academic|qualifications|degrees",
            re.IGNORECASE | re.MULTILINE,
        ),
        "projects": re.compile(
            r"^projects|personal\s+projects|key\s+projects|notable\s+projects",
            re.IGNORECASE | re.MULTILINE,
        ),
        "skills": re.compile(
            r"^(?:technical\s+)?skills|competencies|technologies|tech\s+stack",
            re.IGNORECASE | re.MULTILINE,
        ),
    }

    # Contact extraction patterns
    EMAIL_PATTERN = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
    PHONE_PATTERN = re.compile(r"[\+]?[\d][\d\s\-\(\)]{8,}\d")
    GITHUB_PATTERN = re.compile(r"github\.com/([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})")
    LEETCODE_PATTERN = re.compile(r"leetcode\.com/(?:u/)?([a-zA-Z0-9_-]+)")
    LINKEDIN_PATTERN = re.compile(r"linkedin\.com/in/([a-zA-Z0-9_-]+)")
    URL_PATTERN = re.compile(r"https?://[^\s,)]+")

    def parse(self, pdf_path: str) -> dict:
        """
        Parse a PDF resume and return structured data.

        Returns:
            dict with keys: name, email, phone, github_username, leetcode_username,
                           linkedin_url, skills, experience, projects, education, raw_text
        """
        # Extract text from PDF
        raw_text = self._extract_text(pdf_path)

        if not raw_text or len(raw_text.strip()) < 20:
            return {
                "name": None,
                "email": None,
                "phone": None,
                "github_url": None,
                "github_username": None,
                "leetcode_url": None,
                "leetcode_username": None,
                "linkedin_url": None,
                "skills": [],
                "experience": [],
                "projects": [],
                "education": [],
                "raw_text": raw_text or "",
                "parse_error": "Could not extract meaningful text from PDF",
            }

        # Extract structured fields
        contact = self._extract_contact(raw_text)
        name = self._extract_name(raw_text)
        skills = find_skills_in_text(raw_text)
        sections = self._extract_sections(raw_text)

        return {
            "name": name,
            "email": contact.get("email"),
            "phone": contact.get("phone"),
            "github_url": contact.get("github_url"),
            "github_username": contact.get("github_username"),
            "leetcode_url": contact.get("leetcode_url"),
            "leetcode_username": contact.get("leetcode_username"),
            "linkedin_url": contact.get("linkedin_url"),
            "skills": skills,
            "experience": sections.get("experience", []),
            "projects": sections.get("projects", []),
            "education": sections.get("education", []),
            "raw_text": raw_text,
        }

    def _extract_text(self, pdf_path: str) -> str:
        """Extract all text from a PDF file using pdfplumber."""
        try:
            text_parts = []
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            return "\n".join(text_parts)
        except Exception as e:
            return f"[PDF extraction error: {str(e)}]"

    def _extract_contact(self, text: str) -> dict:
        """Extract contact information using regex patterns."""
        result = {
            "email": None,
            "phone": None,
            "github_url": None,
            "github_username": None,
            "leetcode_url": None,
            "leetcode_username": None,
            "linkedin_url": None,
        }

        # Email
        email_match = self.EMAIL_PATTERN.search(text)
        if email_match:
            result["email"] = email_match.group()

        # Phone
        phone_match = self.PHONE_PATTERN.search(text)
        if phone_match:
            result["phone"] = phone_match.group().strip()

        # GitHub
        github_match = self.GITHUB_PATTERN.search(text)
        if github_match:
            username = github_match.group(1)
            # Filter out common false positives
            if username.lower() not in ("in", "about", "blog", "features", "pricing"):
                result["github_username"] = username
                result["github_url"] = f"https://github.com/{username}"

        # LeetCode
        leetcode_match = self.LEETCODE_PATTERN.search(text)
        if leetcode_match:
            username = leetcode_match.group(1)
            result["leetcode_username"] = username
            result["leetcode_url"] = f"https://leetcode.com/u/{username}"

        # LinkedIn
        linkedin_match = self.LINKEDIN_PATTERN.search(text)
        if linkedin_match:
            result["linkedin_url"] = f"https://linkedin.com/in/{linkedin_match.group(1)}"

        return result

    def _extract_name(self, text: str) -> Optional[str]:
        """Extract candidate name from the top of the resume."""
        lines = text.strip().split("\n")

        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if not line:
                continue

            # Skip lines that look like contacts or headers
            if "@" in line or "http" in line or "tel:" in line.lower():
                continue
            if line.lower().startswith(("resume", "curriculum", "cv")):
                continue
            if re.match(r"^[\d\+\(\)\-\s]+$", line):  # Phone number
                continue

            # First non-empty, non-contact line is likely the name
            # Clean it up
            name = re.sub(r"[|•·].*", "", line).strip()
            if len(name) > 1 and len(name) < 60:
                return name

        return None

    def _extract_sections(self, text: str) -> dict:
        """Split resume text into sections based on header patterns."""
        sections = {
            "experience": [],
            "education": [],
            "projects": [],
        }

        lines = text.split("\n")
        current_section = None
        current_content = []

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # Check if this line is a section header
            detected_section = None
            for section_name, pattern in self.SECTION_PATTERNS.items():
                if pattern.search(stripped) and len(stripped) < 50:
                    detected_section = section_name
                    break

            if detected_section:
                # Save previous section content
                if current_section and current_section in sections:
                    sections[current_section] = self._parse_section_entries(current_content)
                current_section = detected_section
                current_content = []
            else:
                current_content.append(stripped)

        # Save last section
        if current_section and current_section in sections:
            sections[current_section] = self._parse_section_entries(current_content)

        return sections

    def _parse_section_entries(self, lines: list[str]) -> list[dict]:
        """Parse section content into structured entries."""
        entries = []
        current_entry = None

        for line in lines:
            # Heuristic: lines that are short and don't start with bullet points
            # are likely titles for new entries
            is_bullet = line.startswith(("•", "-", "–", "▪", "*", "○", "►"))
            is_likely_title = (
                len(line) < 80
                and not is_bullet
                and not line[0].islower()
                and "|" in line or "–" in line or "—" in line or "," in line
            )

            if is_likely_title and not is_bullet:
                if current_entry:
                    entries.append(current_entry)
                current_entry = {
                    "title": line,
                    "description": [],
                }
            elif current_entry:
                # Clean bullet point prefix
                cleaned = re.sub(r"^[•\-–▪*○►]\s*", "", line)
                if cleaned:
                    current_entry["description"].append(cleaned)
            else:
                # No current entry yet, start one
                current_entry = {
                    "title": line,
                    "description": [],
                }

        # Add last entry
        if current_entry:
            entries.append(current_entry)

        # Convert description lists to strings
        for entry in entries:
            entry["description"] = " ".join(entry["description"])

        return entries
