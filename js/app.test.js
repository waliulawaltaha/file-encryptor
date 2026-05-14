import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

describe('App.js', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        // Clear local storage
        localStorage.clear();
        jest.resetModules();
    });

    test('should set up elements correctly', async () => {
        // We import it dynamically so it runs after document is setup
        await import('./app.js?v=' + Date.now());

        const themeToggle = document.getElementById('theme-toggle');
        expect(themeToggle).not.toBeNull();
    });
});

describe('App.js Theme Toggle', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        localStorage.clear();
        jest.resetModules();
    });

    test('should default to light theme', async () => {
        await import('./app.js?v=' + Date.now());
        expect(document.documentElement.getAttribute('data-theme')).toBeNull();
        expect(document.getElementById('theme-icon').textContent).toBe('dark_mode');
    });

    test('should toggle to dark theme', async () => {
        await import('./app.js?v=' + Date.now());
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');

        themeToggle.click();

        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(themeIcon.textContent).toBe('light_mode');
    });

    test('should load dark theme from localStorage', async () => {
        localStorage.setItem('theme', 'dark');
        await import('./app.js?v=' + Date.now());

        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
        expect(document.getElementById('theme-icon').textContent).toBe('light_mode');
    });
});

describe('App.js Password Strength', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        localStorage.clear();
        jest.resetModules();
    });

    test('should update password strength on input', async () => {
        await import('./app.js?v=' + Date.now());
        const passwordInput = document.getElementById('password');
        const strengthBar = document.getElementById('strength-bar');
        const strengthText = document.getElementById('strength-text');

        // Test empty
        passwordInput.value = '';
        passwordInput.dispatchEvent(new Event('input'));
        expect(strengthBar.style.width).toBe('0%');
        expect(strengthText.textContent).toBe('');

        // Test weak
        passwordInput.value = 'abc';
        passwordInput.dispatchEvent(new Event('input'));
        expect(strengthBar.style.width).toBe('33%');
        expect(strengthText.textContent).toBe('Weak');

        // Test moderate
        passwordInput.value = 'Password12';
        passwordInput.dispatchEvent(new Event('input'));
        expect(strengthBar.style.width).toBe('66%');
        expect(strengthText.textContent).toBe('Moderate');

        // Test strong
        passwordInput.value = 'P@ssw0rd12345';
        passwordInput.dispatchEvent(new Event('input'));
        expect(strengthBar.style.width).toBe('100%');
        expect(strengthText.textContent).toBe('Strong');
    });
});

describe('App.js File Selection', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        localStorage.clear();
        jest.resetModules();
    });

    test('should update display for single file selection', async () => {
        await import('./app.js?v=' + Date.now());
        const fileInput = document.getElementById('fileInput');
        const fileNameDisplay = document.getElementById('file-name-display');

        // Mock files property
        Object.defineProperty(fileInput, 'files', {
            value: [new File(['test'], 'test.txt')]
        });

        fileInput.dispatchEvent(new Event('change'));

        expect(fileNameDisplay.textContent).toBe('test.txt');
    });

    test('should update display for folder selection', async () => {
        await import('./app.js?v=' + Date.now());
        const folderInput = document.getElementById('folderInput');
        const fileNameDisplay = document.getElementById('file-name-display');

        const file1 = new File(['test1'], 'folder/test1.txt');
        Object.defineProperty(file1, 'webkitRelativePath', { value: 'folder/test1.txt' });
        const file2 = new File(['test2'], 'folder/test2.txt');
        Object.defineProperty(file2, 'webkitRelativePath', { value: 'folder/test2.txt' });

        Object.defineProperty(folderInput, 'files', {
            value: [file1, file2]
        });

        folderInput.dispatchEvent(new Event('change'));

        expect(fileNameDisplay.textContent).toBe('📁 folder (2 items)');
    });
});
