# 🔒 Secure Client-Side Encryptor

Secure, zero-knowledge file encryption directly in your browser. Built using the native Web Crypto API, it features military-grade AES-256-GCM encryption and PBKDF2 to protect your files completely offline. No data is ever sent to a server. Includes a sleek Material Design 3 UI with dark mode support. Open-source and privacy-focused.

## ✨ Features

* **Zero-Knowledge Architecture:** Everything runs locally in your browser. Your files and passwords never touch a server.
* **Military-Grade Cryptography:** Utilizes **AES-256-GCM** for authenticated encryption, ensuring data cannot be read or tampered with.
* **Hardened Key Derivation:** Uses **PBKDF2** with 600,000 iterations to heavily resist brute-force attacks against your password.
* **Material Design 3 UI:** A premium, responsive interface featuring dynamic color logic, smooth transitions, and a built-in Dark Mode.
* **No Dependencies:** 100% Vanilla HTML, CSS, and ES6 JavaScript. No external libraries or frameworks to compromise security.

## 🛡️ Threat Model & Security Realities

When evaluating security tools, honesty is critical. Here is what this tool can and cannot do:

**What this protects against:**
* **Cloud Storage Breaches:** Encrypt files before uploading them to Google Drive, Dropbox, etc. If the cloud provider is hacked, your files remain unreadable.
* **Physical Device Theft:** Protects sensitive files stored on easily lost items like USB thumb drives.
* **Network Interception:** Because encryption happens *before* data leaves your device, no man-in-the-middle can read your files.

**What this DOES NOT protect against:**
* **Keyloggers/Malware:** If the computer you are using is infected with malware, an attacker can record your keystrokes as you type your password.
* **Weak Passwords:** AES-256 is unbreakable, but human passwords are not. If you use "password123", your file can be brute-forced. **Always use a high-entropy passphrase.**
* **Lost Passwords:** There is no "Forgot Password" feature. If you lose your passphrase, your data is mathematically unrecoverable.
