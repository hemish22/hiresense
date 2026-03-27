# Phase 2 Research — External API Integrations

## LeetCode GraphQL API

**Endpoint**: `https://leetcode.com/graphql`
**Auth**: None required (public profiles)

### Key Queries

**User profile + problem stats:**
```graphql
query getUserProfile($username: String!) {
    matchedUser(username: $username) {
        username
        submitStatsGlobal {
            acSubmissionNum {
                difficulty
                count
            }
        }
        profile {
            ranking
            reputation
        }
        userCalendar {
            streak
            totalActiveDays
        }
    }
}
```

**Headers required**: `Content-Type: application/json`, `Referer: https://leetcode.com`

**Rate limiting**: Informal — use reasonable delays. No PAT system.

---

## GitHub REST API

**Base URL**: `https://api.github.com`
**Auth**: `Authorization: Bearer {PAT}` → 5000 req/hour (vs 60 unauthenticated)

### Key Endpoints

| Data | Endpoint | Notes |
|------|----------|-------|
| User profile | `GET /users/{username}` | public_repos, created_at, followers |
| User repos | `GET /users/{username}/repos?per_page=100&sort=updated` | stars, language, updated_at |
| Repo languages | `GET /repos/{owner}/{repo}/languages` | bytes per language |
| Repo commits | `GET /repos/{owner}/{repo}/commits?per_page=100` | commit dates for consistency |
| User events | `GET /users/{username}/events?per_page=100` | recent activity (last 90 days) |

### Python Pattern
```python
headers = {"Authorization": f"Bearer {token}"} if token else {}
response = requests.get(url, headers=headers)
```

---

## Resume Parsing (pdfplumber + spaCy + regex)

- **pdfplumber**: Extract text from PDF pages
- **Regex**: Extract emails, URLs (GitHub/LeetCode profile links), phone numbers
- **spaCy NER**: Extract person names, organization names
- **Keyword matching**: Skills extraction against a skill dictionary
- **Section detection**: Experience, Education, Projects via heading patterns

No external API needed — all local processing.
