import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:8080');

    // Setup input file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('#btn-select-file');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('dummy content '.repeat(100000)) // 1.4 MB
    });

    // Enter password
    await page.fill('#password', 'password123');

    // We will measure processEncryption by overriding setTimeout and tracking timestamps
    // or simply by timing the button click until the status changes

    // We can intercept download to know when it's done
    const downloadPromise = page.waitForEvent('download');

    const start = Date.now();
    await page.click('#btn-encrypt');
    await downloadPromise;
    const end = Date.now();

    console.log(`Encryption + Download took: ${end - start} ms`);

    await browser.close();
})();
