import { encryptData, decryptData } from './crypto.js';

// --- Theme Toggle Logic ---
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.textContent = 'light_mode';
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeIcon.textContent = 'dark_mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeIcon.textContent = 'light_mode';
    }
});

// --- DOM Elements ---
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('file-name-display');
const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('status-text');
const statusIcon = document.querySelector('.status-icon');
const btnEncrypt = document.getElementById('btn-encrypt');
const btnDecrypt = document.getElementById('btn-decrypt');
const btnCopy = document.getElementById('btn-copy');

let lastOutputFilename = "";

// --- Password Strength Logic ---
passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    let strength = 0;
    
    if (val.length > 0) strength += 1;
    if (val.length >= 8) strength += 1;
    if (val.length >= 12) strength += 1;
    if (/[A-Z]/.test(val)) strength += 1;
    if (/[0-9]/.test(val)) strength += 1;
    if (/[^A-Za-z0-9]/.test(val)) strength += 1;

    let width = "0%";
    let color = "transparent";
    let text = "";
    let textColor = "var(--md-sys-color-on-surface-variant)";

    if (val.length === 0) {
        width = "0%";
        text = "";
    } else if (strength <= 2) {
        width = "33%";
        color = "#BA1A1A"; // M3 Error Red
        text = "Weak";
        textColor = "#BA1A1A";
    } else if (strength <= 4) {
        width = "66%";
        color = "#D9B200"; // Yellow/Gold
        text = "Moderate";
        textColor = "#D9B200";
    } else {
        width = "100%";
        color = "#146C2E"; // Green
        text = "Strong";
        textColor = "#146C2E";
    }

    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = textColor;
});

// --- File Selection UI Update ---
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.style.color = "var(--md-sys-color-primary)";
        fileNameDisplay.style.fontWeight = "700";
    } else {
        fileNameDisplay.textContent = "Click to browse or drag file here";
        fileNameDisplay.style.color = "var(--md-sys-color-on-surface-variant)";
        fileNameDisplay.style.fontWeight = "500";
    }
    // Hide copy button if a new file is picked
    btnCopy.style.display = 'none'; 
});

// --- Copy to Clipboard Logic ---
btnCopy.addEventListener('click', async () => {
    if (!lastOutputFilename) return;
    try {
        await navigator.clipboard.writeText(lastOutputFilename);
        
        // Temporarily change icon to give feedback
        const originalIcon = btnCopy.innerHTML;
        btnCopy.innerHTML = '<span class="material-symbols-outlined">check</span>';
        setTimeout(() => {
            btnCopy.innerHTML = originalIcon;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy!', err);
    }
});

// --- Event Listeners ---
btnEncrypt.addEventListener('click', () => processFile('encrypt'));
btnDecrypt.addEventListener('click', () => processFile('decrypt'));

// --- Main Logic ---
async function processFile(action) {
    const file = fileInput.files[0];
    const password = passwordInput.value;

    if (!file || !password) {
        updateStatus("Please select a file and enter a password.", "#BA1A1A", "error", "#FFDAD6");
        return;
    }

    try {
        // UI Loading State
        setLoadingState(true);
        btnCopy.style.display = 'none'; 

        const fileData = await file.arrayBuffer();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const infoColor = isDark ? "#D0BCFF" : "#6750A4"; 
        const infoBg = isDark ? "rgba(208, 188, 255, 0.1)" : "rgba(103, 80, 164, 0.1)";

        updateStatus(action === 'encrypt' ? "Encrypting (this may take a moment)..." : "Decrypting...", infoColor, "sync", infoBg, true);

        // Small delay to allow the UI to update before locking the main thread with heavy math
        await new Promise(resolve => setTimeout(resolve, 100));

        if (action === 'encrypt') {
            const encryptedData = await encryptData(fileData, password);
            lastOutputFilename = file.name + ".encrypted";
            downloadFile(encryptedData, lastOutputFilename);
            updateStatus("Encryption successful!", "#146C2E", "check_circle", "#C4EED0");

        } else if (action === 'decrypt') {
            const decryptedData = await decryptData(fileData, password);
            lastOutputFilename = file.name.endsWith('.encrypted') ? file.name.slice(0, -10) : "decrypted_" + file.name;
            downloadFile(new Uint8Array(decryptedData), lastOutputFilename);
            updateStatus("Decryption successful!", "#146C2E", "check_circle", "#C4EED0");
        }
        
        // Show the copy button on success
        btnCopy.style.display = 'block';

    } catch (error) {
        console.error(error);
        updateStatus("Error: Incorrect password or corrupted file.", "#BA1A1A", "error", "#FFDAD6");
    } finally {
        // Remove Loading State
        setLoadingState(false);
    }
}

// --- Utilities ---
function setLoadingState(isLoading) {
    btnEncrypt.disabled = isLoading;
    btnDecrypt.disabled = isLoading;
    passwordInput.disabled = isLoading;
    fileInput.disabled = isLoading;
    document.getElementById('drop-zone').style.pointerEvents = isLoading ? 'none' : 'auto';
    document.getElementById('drop-zone').style.opacity = isLoading ? '0.6' : '1';
}

function updateStatus(message, color, iconName, bgColor, spin = false) {
    statusText.textContent = message;
    statusDiv.style.color = color;
    statusDiv.style.backgroundColor = bgColor;
    
    statusIcon.style.display = 'inline-block';
    statusIcon.textContent = iconName;
    
    if (spin) {
        statusIcon.classList.add('spin-animation');
    } else {
        statusIcon.classList.remove('spin-animation');
    }
}

function downloadFile(data, filename) {
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
