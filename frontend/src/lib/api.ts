/**
 * HireSense AI — API Client (Next.js)
 * Handles all communication with the FastAPI backend proxied via Next HTTP server.
 */

export const API_BASE = '/api';

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
