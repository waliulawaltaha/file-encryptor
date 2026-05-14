import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:8080');

    // First encrypt a file to get an encrypted buffer
    const result = await page.evaluate(async () => {
        const fileData = new TextEncoder().encode('dummy content '.repeat(10000));
        const module = await import('./js/crypto.js');
        const encrypted = await module.encryptData(fileData, 'password123');
        return Array.from(new Uint8Array(encrypted));
    });

    // Setup input file for decryption
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('#btn-select-file');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
        name: 'test.encrypted',
        mimeType: 'application/octet-stream',
        buffer: Buffer.from(result)
    });

    // Enter password
    await page.fill('#password', 'password123');

    const downloadPromise = page.waitForEvent('download');

    const start = Date.now();
    await page.click('#btn-decrypt');
    await downloadPromise;
    const end = Date.now();

    console.log(`Decryption + Download took: ${end - start} ms`);

    await browser.close();
})();
