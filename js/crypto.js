// --- Hardened Key Derivation ---
async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    
    return window.crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt, iterations: 600000, hash: "SHA-256" },
        keyMaterial, 
        { name: "AES-GCM", length: 256 }, 
        false, 
        ["encrypt", "decrypt"]
    );
}

// --- AES-256-GCM Encryption ---
export async function encryptData(fileData, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const key = await deriveKey(password, salt);
    
    const encryptedContent = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv }, 
        key, 
        fileData
    );

    const finalBuffer = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
    finalBuffer.set(salt, 0);
    finalBuffer.set(iv, salt.byteLength);
    finalBuffer.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

    return finalBuffer;
}

// --- AES-256-GCM Decryption ---
export async function decryptData(encryptedBuffer, password) {
    const dataArray = new Uint8Array(encryptedBuffer);
    
    const salt = dataArray.slice(0, 16);
    const iv = dataArray.slice(16, 28);
    const encryptedContent = dataArray.slice(28);

    const key = await deriveKey(password, salt);
    
    return await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv }, 
        key, 
        encryptedContent
    );
}
