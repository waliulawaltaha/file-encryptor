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
const fileNameDisplay = document.getElementById('file-name-display');
const btnSelectFile = document.getElementById('btn-select-file');
const btnSelectFolder = document.getElementById('btn-select-folder');

const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');

const statusDiv = document.getElementById('status');
const statusText = document.getElementById('status-text');
const statusIcon = document.querySelector('.status-icon');
const btnEncrypt = document.getElementById('btn-encrypt');
const btnDecrypt = document.getElementById('btn-decrypt');
const btnCopy = document.getElementById('btn-copy');

let selectedFiles = [];
let isFolderMode = false;
let lastOutputFilename = "";

// --- Button Listeners for File/Folder Picker ---
btnSelectFile.addEventListener('click', () => fileInput.click());
btnSelectFolder.addEventListener('click', () => folderInput.click());

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

    let width = "0%", color = "transparent", text = "", textColor = "var(--md-sys-color-on-surface-variant)";

    if (val.length === 0) {
        width = "0%"; text = "";
    } else if (strength <= 2) {
        width = "33%"; color = "#BA1A1A"; text = "Weak"; textColor = "#BA1A1A";
    } else if (strength <= 4) {
        width = "66%"; color = "#D9B200"; text = "Moderate"; textColor = "#D9B200";
    } else {
        width = "100%"; color = "#146C2E"; text = "Strong"; textColor = "#146C2E";
    }

    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = text;
    strengthText.style.color = textColor;
});

// --- File & Folder Selection UI Update ---
function handleSelection(files, isFolder) {
    selectedFiles = Array.from(files);
    isFolderMode = isFolder;
    btnCopy.style.display = 'none'; 

    if (selectedFiles.length === 1 && !isFolder) {
        fileNameDisplay.textContent = selectedFiles[0].name;
    } else if (selectedFiles.length > 0) {
        const folderName = selectedFiles[0].webkitRelativePath.split('/')[0];
        fileNameDisplay.textContent = `📁 ${folderName} (${selectedFiles.length} files)`;
    } else {
        fileNameDisplay.textContent = "No data selected";
    }
    
    fileNameDisplay.style.color = selectedFiles.length > 0 ? "var(--md-sys-color-primary)" : "var(--md-sys-color-on-surface-variant)";
    fileNameDisplay.style.fontWeight = selectedFiles.length > 0 ? "700" : "500";
}

fileInput.addEventListener('change', (e) => handleSelection(e.target.files, false));
folderInput.addEventListener('change', (e) => handleSelection(e.target.files, true));

// --- Copy to Clipboard Logic ---
btnCopy.addEventListener('click', async () => {
    if (!lastOutputFilename) return;
    try {
        await navigator.clipboard.writeText(lastOutputFilename);
        const originalIcon = btnCopy.innerHTML;
        btnCopy.innerHTML = '<span class="material-symbols-outlined">check</span>';
        setTimeout(() => { btnCopy.innerHTML = originalIcon; }, 2000);
    } catch (err) { console.error('Failed to copy!', err); }
});

// --- Main Encryption/Decryption ---
btnEncrypt.addEventListener('click', () => processData('encrypt'));
btnDecrypt.addEventListener('click', () => processData('decrypt'));

async function processData(action) {
    const password = passwordInput.value;

    if (selectedFiles.length === 0 || !password) {
        updateStatus("Please select a file/folder and enter a passphrase.", "#BA1A1A", "error", "#FFDAD6");
        return;
    }

    try {
        setLoadingState(true);
        btnCopy.style.display = 'none'; 
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const infoColor = isDark ? "#D0BCFF" : "#6750A4"; 
        const infoBg = isDark ? "rgba(208, 188, 255, 0.1)" : "rgba(103, 80, 164, 0.1)";

        let dataToProcess;
        let outputFilename;

        if (action === 'encrypt') {
            if (isFolderMode || selectedFiles.length > 1) {
                updateStatus("Packaging folder into ZIP...", infoColor, "folder_zip", infoBg, true);
                await new Promise(r => setTimeout(r, 100)); 
                
                // Safely load JSZip from the window object
                const zip = new window.JSZip();
                selectedFiles.forEach(f => {
                    const filePath = f.webkitRelativePath || f.name;
                    zip.file(filePath, f);
                });
                
                dataToProcess = await zip.generateAsync({ type: "arraybuffer" });
                const baseFolderName = selectedFiles[0].webkitRelativePath.split('/')[0] || "archive";
                outputFilename = baseFolderName + ".zip.encrypted";
            } else {
                dataToProcess = await selectedFiles[0].arrayBuffer();
                outputFilename = selectedFiles[0].name + ".encrypted";
            }

            updateStatus("Encrypting (this may take a moment)...", infoColor, "sync", infoBg, true);
            await new Promise(r => setTimeout(r, 100)); 
            
            const encryptedData = await encryptData(dataToProcess, password);
            lastOutputFilename = outputFilename;
            downloadFile(encryptedData, outputFilename);
            updateStatus("Encryption successful!", "#146C2E", "check_circle", "#C4EED0");

        } else if (action === 'decrypt') {
            if (isFolderMode || selectedFiles.length > 1) {
                throw new Error("You can only decrypt one archive at a time.");
            }

            updateStatus("Decrypting...", infoColor, "sync", infoBg, true);
            await new Promise(r => setTimeout(r, 100));
            
            dataToProcess = await selectedFiles[0].arrayBuffer();
            const decryptedData = await decryptData(dataToProcess, password);
            
            outputFilename = selectedFiles[0].name.endsWith('.encrypted') ? selectedFiles[0].name.slice(0, -10) : "decrypted_" + selectedFiles[0].name;
            lastOutputFilename = outputFilename;
            
            downloadFile(new Uint8Array(decryptedData), outputFilename);
            updateStatus("Decryption successful!", "#146C2E", "check_circle", "#C4EED0");
        }
        
        btnCopy.style.display = 'block';

    } catch (error) {
        console.error(error);
        const msg = error.message && error.message.includes("decrypt one archive") ? error.message : "Error: Incorrect password or corrupted file.";
        updateStatus(msg, "#BA1A1A", "error", "#FFDAD6");
    } finally {
        setLoadingState(false);
    }
}

// --- Utilities ---
function setLoadingState(isLoading) {
    btnEncrypt.disabled = isLoading;
    btnDecrypt.disabled = isLoading;
    btnSelectFile.disabled = isLoading;
    btnSelectFolder.disabled = isLoading;
    passwordInput.disabled = isLoading;
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