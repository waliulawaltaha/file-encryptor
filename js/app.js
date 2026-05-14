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
const folderInput = document.getElementById('folderInput');
const btnSelectFile = document.getElementById('btn-select-file');
const btnSelectFolder = document.getElementById('btn-select-folder');
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

const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');

let selectedFiles = [];
let isFolderMode = false;
let lastOutputFilename = "";

// --- Button Listeners ---
btnSelectFile.addEventListener('click', () => fileInput.click());
btnSelectFolder.addEventListener('click', () => folderInput.click());

// --- Password Strength ---
passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    let strength = 0;
    if (val.length > 0) strength += 1;
    if (val.length >= 8) strength += 1;
    if (val.length >= 12) strength += 1;
    if (/[A-Z]/.test(val)) strength += 1;
    if (/[a-z]/.test(val)) strength += 1;
    if (/[0-9]/.test(val)) strength += 1;
    if (/[^A-Za-z0-9]/.test(val)) strength += 1;

    let width = "0%", color = "transparent", text = "", textColor = "var(--md-sys-color-on-surface-variant)";
    if (val.length === 0) { width = "0%"; text = ""; } 
    else if (strength <= 2) { width = "33%"; color = "#BA1A1A"; text = "Weak"; textColor = "#BA1A1A"; } 
    else if (strength <= 4) { width = "66%"; color = "#D9B200"; text = "Moderate"; textColor = "#D9B200"; } 
    else { width = "100%"; color = "#146C2E"; text = "Strong"; textColor = "#146C2E"; }

    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = textColor;
});

// --- File Selection Handler ---
function handleSelection(files, isFolder) {
    if (!files || files.length === 0) return;
    
    selectedFiles = Array.from(files);
    isFolderMode = isFolder;
    btnCopy.style.display = 'none'; 
    statusDiv.style.backgroundColor = 'transparent';
    statusText.textContent = '';
    statusIcon.style.display = 'none';

    if (selectedFiles.length === 1 && !isFolder) {
        fileNameDisplay.textContent = selectedFiles[0].name;
    } else if (selectedFiles.length > 0) {
        const folderName = (selectedFiles[0].webkitRelativePath || "").split('/')[0] || "Multiple Files";
        fileNameDisplay.textContent = `📁 ${folderName} (${selectedFiles.length} items)`;
    }
    
    fileNameDisplay.style.color = "var(--md-sys-color-primary)";
    fileNameDisplay.style.fontWeight = "700";
}

fileInput.addEventListener('change', (e) => handleSelection(e.target.files, false));
folderInput.addEventListener('change', (e) => handleSelection(e.target.files, true));


// --- Drag and Drop ---
const dropZone = document.getElementById('drop-zone');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('dragover');
}

function unhighlight(e) {
    dropZone.classList.remove('dragover');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    // Simplistic handling, treats multiple files as false for isFolder
    handleSelection(files, false);
}


// --- Copy to Clipboard ---
btnCopy.addEventListener('click', async () => {
    if (!lastOutputFilename) return;
    try {
        await navigator.clipboard.writeText(lastOutputFilename);
        const originalIcon = btnCopy.innerHTML;
        btnCopy.innerHTML = '<span class="material-symbols-outlined">check</span>';
        setTimeout(() => { btnCopy.innerHTML = originalIcon; }, 2000);
    } catch (err) { console.error('Failed to copy!', err); }
});

// --- Encryption/Decryption Process ---
btnEncrypt.addEventListener('click', processEncryption);
btnDecrypt.addEventListener('click', processDecryption);

async function processEncryption() {
    const password = passwordInput.value;

    if (selectedFiles.length === 0 || !password) {
        updateStatus("Please select data and enter a passphrase.", "#BA1A1A", "error", "#FFDAD6");
        return;
    }

    if (password.length < 8) {
        updateStatus("Passphrase must be at least 8 characters long.", "#BA1A1A", "error", "#FFDAD6");
        return;
    }

    try {
        setLoadingState(true, "Preparing...");
        btnCopy.style.display = 'none';

        let dataToProcess;
        let outputFilename;

        if (isFolderMode || selectedFiles.length > 1) {
            loadingText.textContent = "Packaging into ZIP...";
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            const zip = new window.JSZip();
            selectedFiles.forEach(f => {
                const filePath = f.webkitRelativePath || f.name;
                zip.file(filePath, f);
            });

            dataToProcess = await zip.generateAsync({ type: "arraybuffer" });
            const baseFolderName = selectedFiles[0].webkitRelativePath ? selectedFiles[0].webkitRelativePath.split('/')[0] : "archive";
            outputFilename = baseFolderName + ".zip.encrypted";
        } else {
            dataToProcess = await selectedFiles[0].arrayBuffer();
            outputFilename = selectedFiles[0].name + ".encrypted";
        }

        loadingText.textContent = "Encrypting data...";
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const encryptedData = await encryptData(dataToProcess, password);
        lastOutputFilename = outputFilename;
        downloadFile(encryptedData, outputFilename);
        updateStatus("Encryption successful!", "#146C2E", "check_circle", "#C4EED0");

        btnCopy.style.display = 'inline-flex';

    } catch (error) {
        console.error(error);
        updateStatus("Error: Could not encrypt data.", "#BA1A1A", "error", "#FFDAD6");
    } finally {
        setLoadingState(false);
    }
}

async function processDecryption() {
    const password = passwordInput.value;

    if (selectedFiles.length === 0 || !password) {
        updateStatus("Please select data and enter a passphrase.", "#BA1A1A", "error", "#FFDAD6");
        return;
    }

    try {
        setLoadingState(true, "Decrypting...");
        btnCopy.style.display = 'none';

        if (isFolderMode || selectedFiles.length > 1) {
            throw new Error("You can only decrypt one archive at a time.");
        }

        loadingText.textContent = "Decrypting data...";
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const dataToProcess = await selectedFiles[0].arrayBuffer();
        const decryptedData = await decryptData(dataToProcess, password);

        const outputFilename = selectedFiles[0].name.endsWith('.encrypted') ? selectedFiles[0].name.slice(0, -10) : "decrypted_" + selectedFiles[0].name;
        lastOutputFilename = outputFilename;

        downloadFile(new Uint8Array(decryptedData), outputFilename);
        updateStatus("Decryption successful!", "#146C2E", "check_circle", "#C4EED0");

        btnCopy.style.display = 'inline-flex';

    } catch (error) {
        console.error(error);
        const msg = error.message.includes("decrypt one archive") ? error.message : "Error: Incorrect password or corrupted file.";
        updateStatus(msg, "#BA1A1A", "error", "#FFDAD6");
    } finally {
        setLoadingState(false);
    }
}

// --- Utilities ---
function setLoadingState(isLoading, text = "") {
    if (isLoading) {
        loadingOverlay.classList.add('active');
        loadingText.textContent = text;
    } else {
        loadingOverlay.classList.remove('active');
    }
    
    // Fallback locks for inputs underneath the blur
    btnEncrypt.disabled = isLoading;
    btnDecrypt.disabled = isLoading;
    btnSelectFile.disabled = isLoading;
    btnSelectFolder.disabled = isLoading;
    passwordInput.disabled = isLoading;
}

function updateStatus(message, color, iconName, bgColor) {
    statusText.textContent = message;
    statusDiv.style.color = color;
    statusDiv.style.backgroundColor = bgColor;
    statusIcon.style.display = 'inline-block';
    statusIcon.textContent = iconName;
    
    statusDiv.classList.remove('fade-in-up');
    void statusDiv.offsetWidth; 
    statusDiv.classList.add('fade-in-up');
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
    setTimeout(() => { URL.revokeObjectURL(url); }, 1000);
}