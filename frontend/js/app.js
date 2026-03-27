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

        showToast('info', 'Coming Soon', result.message || 'Candidate analysis will be available in Phase 2.');
    } catch (error) {
        showToast('error', 'Analysis Failed', error.message);
    } finally {
        btn.disabled = false;
        loader.style.display = 'none';
        btnText.textContent = 'Analyze Candidate';
        validateCandidateForm();
    }
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
