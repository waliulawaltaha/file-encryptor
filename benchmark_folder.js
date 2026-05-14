import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:8080');

    // Setup input file (multiple files to trigger zip)
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('#btn-select-file'); // fileInput handles multiple
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([
        { name: 'test1.txt', mimeType: 'text/plain', buffer: Buffer.from('dummy content '.repeat(10000)) },
        { name: 'test2.txt', mimeType: 'text/plain', buffer: Buffer.from('dummy content '.repeat(10000)) }
    ]);

    // Enter password
    await page.fill('#password', 'password123');

    const downloadPromise = page.waitForEvent('download');

    const start = Date.now();
    await page.click('#btn-encrypt');
    await downloadPromise;
    const end = Date.now();

    console.log(`Encryption (Zip) + Download took: ${end - start} ms`);

    await browser.close();
})();
