import { encryptData, decryptData } from './crypto.js';
import { webcrypto } from 'node:crypto';

// Mock window.crypto for the environment
if (typeof window === 'undefined') {
    global.window = {};
}
if (!window.crypto) {
    Object.defineProperty(window, 'crypto', {
        value: webcrypto,
        writable: true
    });
}
if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = require('util').TextDecoder;
}

describe('Crypto module', () => {
    const password = 'test-password';
    const testData = new TextEncoder().encode('Hello, World!');

    test('should encrypt and decrypt data successfully', async () => {
        const encrypted = await encryptData(testData, password);
        expect(encrypted).toBeDefined();
        expect(encrypted instanceof Uint8Array).toBe(true);
        expect(encrypted.length).toBeGreaterThan(testData.length);

        const decrypted = await decryptData(encrypted, password);
        expect(new Uint8Array(decrypted)).toEqual(testData);
        expect(new TextDecoder().decode(decrypted)).toBe('Hello, World!');
    });

    test('should fail to decrypt with incorrect password', async () => {
        const encrypted = await encryptData(testData, password);
        await expect(decryptData(encrypted, 'wrong-password')).rejects.toThrow();
    });

    test('should fail to decrypt if data is tampered with', async () => {
        const encrypted = await encryptData(testData, password);
        // Tamper with the encrypted content (after salt and iv)
        encrypted[encrypted.length - 1] ^= 0xFF;
        await expect(decryptData(encrypted, password)).rejects.toThrow();
    });
});
