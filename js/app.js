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
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('status-text');
const statusIcon = document.querySelector('.status-icon');
const btnEncrypt = document.getElementById('btn-encrypt');
const btnDecrypt = document.getElementById('btn-decrypt');

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
});

// --- Event Listeners ---
btnEncrypt.addEventListener('click', () => processFile('encrypt'));
btnDecrypt.addEventListener('click', () => processFile('decrypt'));

// --- Main Logic ---
async function processFile(action) {
    const file = fileInput.files[0];
    const password = passwordInput.value;

    if (!file || !password) {
        updateStatus("Please select a file and enter a password.", "#BA1A1A", "error", "#FFDAD6"); // M3 Error Colors
        return;
    }

    try {
        const fileData = await file.arrayBuffer();
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const infoColor = isDark ? "#D0BCFF" : "#6750A4"; 
        const infoBg = isDark ? "rgba(208, 188, 255, 0.1)" : "rgba(103, 80, 164, 0.1)";

        if (action === 'encrypt') {
            updateStatus("Encrypting (this may take a moment)...", infoColor, "sync", infoBg);
            const encryptedData = await encryptData(fileData, password);
            downloadFile(encryptedData, file.name + ".encrypted");
            updateStatus("Encryption successful! Downloading...", "#146C2E", "check_circle", "#C4EED0");

        } else if (action === 'decrypt') {
            updateStatus("Decrypting...", infoColor, "sync", infoBg);
            const decryptedData = await decryptData(fileData, password);
            const newName = file.name.endsWith('.encrypted') ? file.name.slice(0, -10) : "decrypted_" + file.name;
            downloadFile(new Uint8Array(decryptedData), newName);
            updateStatus("Decryption successful! Downloading...", "#146C2E", "check_circle", "#C4EED0");
        }
    } catch (error) {
        console.error(error);
        updateStatus("Error: Incorrect password or corrupted file.", "#BA1A1A", "error", "#FFDAD6");
    }
}

// --- Utilities ---
function updateStatus(message, color, iconName, bgColor) {
    statusText.textContent = message;
    statusDiv.style.color = color;
    statusDiv.style.backgroundColor = bgColor;
    
    statusIcon.style.display = 'inline-block';
    statusIcon.textContent = iconName;
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
