const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Navigating to login...');
        await page.goto('https://app.onupkeep.com/web/login');
        
        console.log('Filling credentials...');
        await page.fill('input[type="email"]', 'kilow88176@candaba.com');
        await page.fill('input[type="password"]', 'Juric@12345');
        
        await Promise.all([
            page.waitForNavigation(),
            page.click('button[type="submit"]')
        ]);

        console.log('Logged in. Navigating to checklists templates...');
        
        // Listen to API responses to intercept the templates
        let templatesData = null;
        page.on('response', async (response) => {
            if (response.url().includes('checklist-templates') || response.url().includes('templates')) {
                try {
                    const json = await response.json();
                    if (json && (json.results || Array.isArray(json))) {
                        console.log('Intercepted templates data!');
                        templatesData = json;
                    }
                } catch (e) {}
            }
        });

        await page.goto('https://app.onupkeep.com/web/checklists?sort=createdAt&tab=templates');
        
        // Wait for page to load
        await page.waitForTimeout(10000);

        if (templatesData) {
            fs.writeFileSync('upkeep_templates.json', JSON.stringify(templatesData, null, 2));
            console.log('Saved templates to upkeep_templates.json');
        } else {
            console.log('Could not intercept API. Extracting from DOM...');
            const templates = await page.evaluate(() => {
                const results = [];
                // This is a naive DOM extraction, might not work depending on UI
                document.querySelectorAll('div').forEach(el => {
                    if (el.innerText && el.innerText.includes('tasks') && el.innerText.length < 100) {
                        results.push(el.innerText);
                    }
                });
                return results;
            });
            fs.writeFileSync('upkeep_templates_dom.json', JSON.stringify(templates, null, 2));
            console.log('Saved DOM templates to upkeep_templates_dom.json');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await browser.close();
    }
}

run();
