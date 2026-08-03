import { chromium } from 'playwright';

async function testGmaps() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ locale: 'id-ID' });
    const page = await context.newPage();
    
    try {
        console.log('Navigating...');
        await page.goto('https://www.google.com/maps', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        console.log('Finding search box by placeholder...');
        const searchBox = page.locator('input[placeholder*="Telusuri"], input[placeholder*="Search"], input#searchboxinput, input[aria-label="Telusuri Google Maps"]');
        
        if (await searchBox.count() > 0) {
            console.log('Search box found, typing...');
            await searchBox.first().fill('Kopi di Sumedang');
            await searchBox.first().press('Enter');
            
            console.log('Waiting for results...');
            await page.waitForTimeout(5000);
            await page.screenshot({ path: 'gmaps-results.png' });
            console.log('Saved gmaps-results.png');
        } else {
            console.log('No search box found!');
            await page.screenshot({ path: 'gmaps-error2.png' });
        }
        
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
}

testGmaps();
