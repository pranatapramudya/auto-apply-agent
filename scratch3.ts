import { chromium } from 'playwright';
import fs from 'fs';

async function testGmaps() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log('Navigating...');
        await page.goto('https://www.google.com/maps', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
        
        console.log('Dumping full body HTML...');
        const html = await page.evaluate(() => document.body.innerHTML);
        fs.writeFileSync('gmaps-dom.html', html);
        console.log('Saved to gmaps-dom.html');
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

testGmaps();
