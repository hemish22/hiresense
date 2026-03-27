/**
 * HireSense AI — API Client
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiRequest(endpoint, options = {}) {
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
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Is the backend running?');
        }
        throw error;
    }
}

/**
 * Health check — verify backend is running.
 */
async function checkHealth() {
    return apiRequest('/health');
}

/**
 * Analyze a candidate — upload resume + job description.
 * (Placeholder until Phase 2)
 */
async function analyzeCandidate(formData) {
    return apiRequest('/candidates/analyze', {
        method: 'POST',
        body: formData,
    });
}

/**
 * Get candidate analysis history.
 */
async function getCandidateHistory() {
    return apiRequest('/candidates/history');
}

/**
 * Get a specific candidate analysis by ID.
 */
async function getCandidateAnalysis(id) {
    return apiRequest(`/candidates/${id}`);
}

/**
 * Analyze team skill gaps.
 * (Placeholder until Phase 4)
 */
async function analyzeTeam(data) {
    return apiRequest('/teams/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

/**
 * Get team analysis history.
 */
async function getTeamHistory() {
    return apiRequest('/teams/history');
}

/**
 * Get a specific team analysis by ID.
 */
async function getTeamAnalysis(id) {
    return apiRequest(`/teams/${id}`);
}
