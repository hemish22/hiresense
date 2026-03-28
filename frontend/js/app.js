/**
 * HireSense AI — Application Controller
 * Handles UI interactions, tab switching, drag & drop, and form submissions.
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initUploadZone();
    initFormValidation();
    initHealthCheck();
});

/* ═══════════════════════════════════════════════════
   TAB SWITCHING
   ═══════════════════════════════════════════════════ */

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            switchTab(targetTab);
        });
    });
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) {
        targetView.classList.add('active');
    }
}

/* ═══════════════════════════════════════════════════
   FILE UPLOAD (Drag & Drop)
   ═══════════════════════════════════════════════════ */

let selectedFile = null;

function initUploadZone() {
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('resume-file');
    const preview = document.getElementById('file-preview');
    const removeBtn = document.getElementById('remove-file');

    // Click to browse
    zone.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag events
    zone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        zone.classList.add('drag-active');
    });

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-active');
    });

    zone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        // Only remove if leaving the zone entirely
        if (!zone.contains(e.relatedTarget)) {
            zone.classList.remove('drag-active');
        }
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-active');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Remove file
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearFile();
    });
}

function handleFile(file) {
    // Validate PDF
    if (file.type !== 'application/pdf') {
        showToast('error', 'Invalid File', 'Please upload a PDF resume.');
        return;
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Maximum file size is 10MB.');
        return;
    }

    selectedFile = file;

    // Update UI
    const zone = document.getElementById('upload-zone');
    const preview = document.getElementById('file-preview');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');

    zone.classList.add('has-file');
    zone.style.display = 'none';
    preview.style.display = 'flex';
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    showToast('success', 'File Uploaded', `${file.name} ready for analysis.`);
    validateCandidateForm();
}

function clearFile() {
    selectedFile = null;

    const zone = document.getElementById('upload-zone');
    const preview = document.getElementById('file-preview');
    const fileInput = document.getElementById('resume-file');

    zone.classList.remove('has-file');
    zone.style.display = 'flex';
    preview.style.display = 'none';
    fileInput.value = '';

    validateCandidateForm();
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ═══════════════════════════════════════════════════
   FORM VALIDATION
   ═══════════════════════════════════════════════════ */

function initFormValidation() {
    // Candidate form
    const jobDesc = document.getElementById('job-description');
    jobDesc.addEventListener('input', validateCandidateForm);

    const btnAnalyze = document.getElementById('btn-analyze-candidate');
    btnAnalyze.addEventListener('click', handleCandidateAnalysis);

    // Team form
    const teamName = document.getElementById('team-name');
    const teamSkills = document.getElementById('team-skills');
    const projectReq = document.getElementById('project-requirements');

    [teamName, teamSkills, projectReq].forEach(el => {
        el.addEventListener('input', validateTeamForm);
    });

    const btnTeam = document.getElementById('btn-analyze-team');
    btnTeam.addEventListener('click', handleTeamAnalysis);
}

function validateCandidateForm() {
    const btn = document.getElementById('btn-analyze-candidate');
    const jobDesc = document.getElementById('job-description').value.trim();

    btn.disabled = !(selectedFile && jobDesc.length > 10);
}

function validateTeamForm() {
    const btn = document.getElementById('btn-analyze-team');
    const teamName = document.getElementById('team-name').value.trim();
    const teamSkills = document.getElementById('team-skills').value.trim();
    const projectReq = document.getElementById('project-requirements').value.trim();

    btn.disabled = !(teamName && teamSkills && projectReq);
}

/* ═══════════════════════════════════════════════════
   FORM SUBMISSIONS
   ═══════════════════════════════════════════════════ */

async function handleCandidateAnalysis() {
    const btn = document.getElementById('btn-analyze-candidate');
    const loader = btn.querySelector('.btn-loader');
    const btnText = btn.querySelector('span:nth-child(2)');

    try {
        btn.disabled = true;
        loader.style.display = 'inline-block';
        btnText.textContent = 'Analyzing...';

        const formData = new FormData();
        formData.append('resume', selectedFile);
        formData.append('job_description', document.getElementById('job-description').value.trim());

        const result = await analyzeCandidate(formData);
        renderCandidateResults(result);
        showToast('success', 'Analysis Complete', result.scoring?.recommendation || 'Results ready.');
    } catch (error) {
        showToast('error', 'Analysis Failed', error.message);
    } finally {
        btn.disabled = false;
        loader.style.display = 'none';
        btnText.textContent = 'Analyze Candidate';
        validateCandidateForm();
    }
}

/* ═══════════════════════════════════════════════════
   RESULTS RENDERING
   ═══════════════════════════════════════════════════ */

function getScoreColor(score) {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--accent-primary)';
    if (score >= 40) return '#f59e0b';
    return 'var(--color-error)';
}

function getRecBadgeClass(rec) {
    if (rec === 'Strong Hire') return 'rec-strong-hire';
    if (rec === 'Hire') return 'rec-hire';
    if (rec === 'Maybe') return 'rec-maybe';
    return 'rec-pass';
}

function renderCandidateResults(data) {
    const container = document.getElementById('candidate-results');
    const emptyState = document.getElementById('candidate-empty-state');
    const badge = document.querySelector('#candidate-results-panel .badge');

    const scoring = data.scoring || {};
    const scores = scoring.scores || {};
    const overall = scoring.overall_score || 0;
    const rec = scoring.recommendation || 'N/A';
    const candidate = data.candidate || {};
    const skillMatch = scoring.skill_match || {};
    const learning = scoring.learning_analysis || {};
    const credibility = scoring.credibility_analysis || {};

    badge.textContent = rec;
    badge.className = `badge ${getRecBadgeClass(rec)}`;

    let html = '';

    // ── Overall Score Hero ──
    html += `
    <div class="score-hero">
        <div class="score-ring" style="--score-color: ${getScoreColor(overall)}; --score-pct: ${overall}%">
            <div class="score-ring-inner">
                <span class="score-number">${Math.round(overall)}</span>
                <span class="score-label">Overall</span>
            </div>
        </div>
        <div class="recommendation-badge ${getRecBadgeClass(rec)}">${rec}</div>
        <p class="score-explanation">${scoring.explanation || ''}</p>
    </div>`;

    // ── Candidate Info ──
    html += `
    <div class="candidate-info">
        <h3>${candidate.name || 'Unknown'}</h3>
        <div class="candidate-meta">
            ${candidate.email ? `<span>📧 ${candidate.email}</span>` : ''}
            ${candidate.github_username ? `<span>🐙 ${candidate.github_username}</span>` : ''}
            ${candidate.leetcode_username ? `<span>💻 ${candidate.leetcode_username}</span>` : ''}
        </div>
    </div>`;

    // ── Score Cards ──
    const scoreCards = [
        { label: 'Skill Match', value: scores.match_score, icon: '🎯' },
        { label: 'GitHub', value: scores.github_score, icon: '🐙' },
        { label: 'LeetCode', value: scores.leetcode_score, icon: '💻' },
        { label: 'Learning', value: scores.learning_score, icon: '📈' },
        { label: 'Credibility', value: scores.credibility_score, icon: '🛡️' },
    ];

    html += '<div class="score-cards-grid">';
    for (const card of scoreCards) {
        const color = getScoreColor(card.value || 0);
        html += `
        <div class="score-card">
            <div class="score-card-icon">${card.icon}</div>
            <div class="score-card-value" style="color: ${color}">${Math.round(card.value || 0)}</div>
            <div class="score-card-label">${card.label}</div>
        </div>`;
    }
    html += '</div>';

    // ── Skill Tags ──
    const matched = skillMatch.matched_skills || [];
    const missing = skillMatch.missing_skills || [];
    const bonus = skillMatch.bonus_skills || [];

    if (matched.length || missing.length || bonus.length) {
        html += '<div class="section-block"><h4>Skills Analysis</h4>';
        html += `<p class="section-explanation">${skillMatch.explanation || ''}</p>`;
        html += '<div class="skill-tags">';
        for (const s of matched) html += `<span class="skill-tag matched">✓ ${s}</span>`;
        for (const s of missing) html += `<span class="skill-tag missing">✗ ${s}</span>`;
        for (const s of bonus.slice(0, 8)) html += `<span class="skill-tag bonus">+ ${s}</span>`;
        if (bonus.length > 8) html += `<span class="skill-tag bonus">+${bonus.length - 8} more</span>`;
        html += '</div></div>';
    }

    // ── Learning Analysis ──
    const predictions = learning.predictions || [];
    if (predictions.length) {
        html += '<div class="section-block"><h4>📈 Learning Predictions</h4>';
        html += `<p class="section-explanation">${learning.explanation || ''}</p>`;
        html += '<div class="prediction-list">';
        for (const p of predictions) {
            const conf = p.confidence === 'high' ? '🟢' : p.confidence === 'medium' ? '🟡' : '🔴';
            html += `
            <div class="prediction-item">
                <span class="pred-skill">${p.skill}</span>
                <span class="pred-time">~${p.estimated_months}mo</span>
                <span class="pred-conf">${conf} ${p.confidence}</span>
            </div>`;
        }
        html += '</div></div>';
    }

    // ── Credibility Flags ──
    const flags = credibility.flags || [];
    if (flags.length) {
        html += '<div class="section-block"><h4>🛡️ Credibility Check</h4>';
        html += `<p class="section-explanation">${credibility.explanation || ''}</p>`;
        html += '<div class="credibility-flags">';
        for (const f of flags) {
            const icon = f.status === 'verified' ? '✅' : f.status === 'inflated' ? '⚠️' : '❔';
            html += `
            <div class="flag-item flag-${f.status}">
                <span class="flag-icon">${icon}</span>
                <span class="flag-skill">${f.skill}</span>
                <span class="flag-status">${f.status}</span>
            </div>`;
        }
        html += '</div></div>';
    }

    container.innerHTML = html;
    container.style.display = 'block';
    emptyState.style.display = 'none';
}

async function handleTeamAnalysis() {
    const btn = document.getElementById('btn-analyze-team');
    const loader = btn.querySelector('.btn-loader');
    const btnText = btn.querySelector('span:nth-child(2)');

    try {
        btn.disabled = true;
        loader.style.display = 'inline-block';
        btnText.textContent = 'Analyzing...';

        const data = {
            team_name: document.getElementById('team-name').value.trim(),
            team_skills: document.getElementById('team-skills').value.trim().split(',').map(s => s.trim()).filter(Boolean),
            project_requirements: document.getElementById('project-requirements').value.trim().split(',').map(s => s.trim()).filter(Boolean),
        };

        const result = await analyzeTeam(data);

        showToast('info', 'Coming Soon', result.message || 'Team analysis will be available in Phase 4.');
    } catch (error) {
        showToast('error', 'Analysis Failed', error.message);
    } finally {
        btn.disabled = false;
        loader.style.display = 'none';
        btnText.textContent = 'Analyze Team Gaps';
        validateTeamForm();
    }
}

/* ═══════════════════════════════════════════════════
   HEALTH CHECK
   ═══════════════════════════════════════════════════ */

async function initHealthCheck() {
    const status = document.getElementById('connection-status');
    const dot = status.querySelector('.status-dot');
    const text = status.querySelector('.status-text');

    try {
        const health = await checkHealth();

        status.classList.add('connected');
        status.classList.remove('error');
        text.textContent = `v${health.version}`;

        showToast('success', 'Connected', `${health.service} is running.`);
    } catch (error) {
        status.classList.add('error');
        status.classList.remove('connected');
        text.textContent = 'Offline';

        showToast('error', 'Connection Failed', 'Backend server is not running. Start it with: uvicorn backend.main:app --reload');
    }
}

/* ═══════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════ */

function showToast(type, title, message, duration = 4000) {
    const container = document.getElementById('toast-container');

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
