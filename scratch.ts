import { chromium } from 'playwright';

async function testGmaps() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log('Navigating to Google Maps...');
        await page.goto('https://www.google.com/maps');
        
        console.log('Waiting for searchbox or consent...');
        // check if consent popup is there
        const consentButton = page.locator('button:has-text("Accept all"), button:has-text("Setuju semua"), button:has-text("I agree")');
        if (await consentButton.count() > 0) {
            console.log('Clicking consent button...');
            await consentButton.first().click();
        }

        console.log('Waiting for search box...');
        await page.waitForSelector('#searchboxinput', { timeout: 10000 });
        console.log('Search box found!');
        
    } catch (e) {
        console.error('Error:', e);
        await page.screenshot({ path: 'gmaps-error.png' });
        console.log('Screenshot saved to gmaps-error.png');
    } finally {
        await browser.close();
    }
}

testGmaps();
