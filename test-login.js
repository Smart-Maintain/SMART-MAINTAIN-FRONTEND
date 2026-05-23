const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    await page.goto('http://localhost:4200/login');

    // Test wrong password
    await page.type('#username', 'admin@test.com');
    await page.type('#password', 'wrong');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 2000));

    const errorText = await page.evaluate(() => document.body.innerText);
    console.log('PAGE TEXT WRONG:', errorText.substring(0, 500).replace(/\n/g, ' '));

    // Test successful login
    await page.evaluate(() => document.querySelector('#password').value = '');
    await page.type('#password', 'admin123');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 3000));
    console.log('PAGE URL AFTER LOGIN:', page.url());

    await browser.close();
})();
