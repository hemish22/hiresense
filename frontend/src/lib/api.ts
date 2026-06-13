/**
 * HireSense AI — API Client (Next.js)
 * Handles all communication with the FastAPI backend proxied via Next HTTP server.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                ...(options.headers || {}),
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Is the backend running?');
        }
        throw error;
    }
}

/**
 * Health check — verify backend is running.
 */
export async function checkHealth() {
    return apiRequest('/health');
}

/**
 * Analyze a candidate — upload resume + job description.
 */
export async function analyzeCandidate(formData: FormData) {
    // Note: Do not set Content-Type header manually when sending FormData
    // The browser will automatically set it to multipart/form-data with the correct boundary
    return apiRequest('/candidates/analyze', {
        method: 'POST',
        body: formData,
    });
}

/**
 * Get candidate analysis history.
 */
export async function getCandidateHistory() {
    return apiRequest('/candidates/history');
}

/**
 * Get a specific candidate analysis by ID.
 */
export async function getCandidateAnalysis(id: string) {
    return apiRequest(`/candidates/${id}`);
}

/**
 * 3D candidate constellation for the recruiter talent map.
 */
export async function getConstellation() {
    return apiRequest('/candidates/constellation');
}

/**
 * List open job postings (applicant portal).
 */
export async function getJobs() {
    return apiRequest('/jobs');
}

/**
 * Public applicant submission — runs the full evaluation and stores it.
 * FormData: resume (File), job_id (optional), github_username, leetcode_username.
 */
export async function applyCandidate(formData: FormData) {
    return apiRequest('/candidates/apply', {
        method: 'POST',
        body: formData,
    });
}

/** List all analyzed candidates (with status + domain) for the pipeline. */
export async function getCandidateList() {
    return apiRequest('/candidates/history');
}

/** Move a candidate to a different pipeline stage. */
export async function updateCandidateStatus(id: number, status: string) {
    return apiRequest(`/candidates/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
}

/** Natural-language candidate search. */
export async function searchCandidates(q: string) {
    return apiRequest(`/candidates/search?q=${encodeURIComponent(q)}`);
}

/** AI hire verdict for a candidate (Groq, template fallback). */
export async function getCandidateSummary(id: number | string) {
    return apiRequest(`/candidates/${id}/ai-summary`);
}

/** Rank all candidates by fit to a specific job. */
export async function getJobCandidates(jobId: number) {
    return apiRequest(`/jobs/${jobId}/candidates`);
}

/** Recruiter analytics overview + supply vs demand. */
export async function getAnalytics() {
    return apiRequest('/analytics/overview');
}

/** Applicant status lookup by email. */
export async function getApplicationStatus(email: string) {
    return apiRequest(`/candidates/status?email=${encodeURIComponent(email)}`);
}

/**
 * Analyze team skill gaps (manual JSON input).
 */
export async function analyzeTeam(data: any) {
    return apiRequest('/teams/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

/**
 * Analyze team skill gaps via bulk PDF resume upload.
 * Sends FormData with multiple resume files + project description.
 */
export async function analyzeTeamBulk(formData: FormData) {
    return apiRequest('/teams/analyze-bulk', {
        method: 'POST',
        body: formData,
    });
}

/**
 * What-if simulation — recompute coverage for an edited roster.
 * Used by the interactive team editor (no persistence, no JD generation).
 */
export async function simulateTeam(data: {
    team_name?: string;
    members: { name: string; skills: string[] }[];
    project_requirements: string[];
}) {
    return apiRequest('/teams/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

/**
 * Get team analysis history.
 */
export async function getTeamHistory() {
    return apiRequest('/teams/history');
}

/**
 * Get a specific team analysis by ID.
 */
export async function getTeamAnalysis(id: string) {
    return apiRequest(`/teams/${id}`);
}
