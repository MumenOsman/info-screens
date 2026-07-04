window.socket = io();
const socket = window.socket;

// Sanitize any user-supplied string before inserting it into innerHTML.
// Prevents XSS via driver names, session names, or any other user-controlled text.
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
window.escapeHtml = escapeHtml;

let currentState = null;

// Handle Auth for Employee screens
function initAuth(role) {
    const overlay = document.getElementById('auth-overlay');
    const input = document.getElementById('auth-key');
    const btn = document.getElementById('auth-btn');
    const errorMsg = document.getElementById('auth-error');

    btn.onclick = () => {
        errorMsg.innerText = "Checking...";
        socket.emit('auth', { role, key: input.value });
    };

    socket.on('auth_success', () => overlay.classList.add('hidden'));
    socket.on('auth_fail', (msg) => { errorMsg.innerText = msg; });
}

// Fullscreen logic for displays
function setupFullscreen() {
    const btn = document.createElement('button');
    btn.className = 'fullscreen-btn';
    btn.innerText = 'Full Screen';
    btn.onclick = () => document.documentElement.requestFullscreen().catch(console.error);
    document.body.appendChild(btn);
}

// Global State listener
socket.on('state_update', (state) => {
    currentState = state;
    if (typeof updateUI === 'function') updateUI(state);
});