# 🔒 File Encryptor

File Encryptor is a secure, zero-knowledge application that encrypts your files directly in the browser. Built utilizing the native Web Crypto API, it features military-grade AES-256-GCM encryption and PBKDF2 to protect your files completely offline. No data is ever sent to a backend server. Includes a modern, responsive Material Design 3 interface with dark mode support, and is fully containerized for easy self-hosting in home lab environments.


## ✨ Features

* **Zero-Knowledge Architecture:** Everything runs locally in your browser. Your files and passwords never touch a server.
* **Military-Grade Cryptography:** Utilizes **AES-256-GCM** for authenticated encryption, ensuring data cannot be read or tampered with.
* **Hardened Key Derivation:** Uses **PBKDF2** with 600,000 iterations to heavily resist brute-force attacks against your password.
* **Material Design 3 UI:** A premium, responsive interface featuring dynamic color logic, smooth transitions, and a built-in Dark Mode.
* **No Dependencies:** 100% Vanilla HTML, CSS, and ES6 JavaScript. No external libraries or frameworks to compromise security.

## 🐳 Home Lab & Self-Hosting

Because File Encryptor is a static frontend application, it is incredibly lightweight and perfect for self-hosting. A `docker-compose.yml` is provided for instant deployment.

```bash
# Clone the repository
git clone [https://github.com/waliulawaltaha/file-encryptor.git](https://github.com/waliulawaltaha/file-encryptor.git)
cd file-encryptor

# Start the container
docker-compose up -d
```
The app will be available at http://localhost:8080.

⚠️ Important: The HTTPS Requirement
Modern browsers have strict security sandboxes. The Web Crypto API (window.crypto.subtle) will only run in a Secure Context.

 * It will work on http://localhost or http://127.0.0.1.
 * It will not work if you access it via a local network IP (e.g., http://192.168.1.50:8080) without SSL.

To access this tool securely across your home network from other devices, you must route the container through a reverse proxy (like Nginx Proxy Manager, Traefik, or Cloudflare Tunnels) and assign it a local domain with a valid or self-signed SSL certificate (https://).

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

## 👨‍💻 Author
​Waliul Awal Taha
* Website: www.waliulawaltaha.com
​
## 📄 License
​[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
