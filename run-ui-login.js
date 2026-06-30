const puppeteer = require('puppeteer');

const PORT = process.env.PORT || '4200';
const BASE = `http://localhost:${PORT}`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  page.on('requestfinished', async (request) => {
    try {
      const url = request.url();
      if (url.includes('/account/login')) {
        const postData = request.postData();
        console.log('LOGIN REQUEST PAYLOAD:', postData);
        try {
          const headers = request.headers();
          console.log('LOGIN REQUEST HEADERS:', JSON.stringify(headers));
        } catch (e) {
          console.error('Could not read request headers:', e.message);
        }
        const response = request.response();
        const status = response.status();
        const text = await response.text();
        console.log('LOGIN RESPONSE STATUS:', status);
        console.log('LOGIN RESPONSE BODY:', text.substring(0, 1000));
      }
    } catch (e) {
      console.error('Error reading requestfinished:', e.message);
    }
  });

  console.log('Going to', `${BASE}/login`);
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });

  // enter credentials (clear first to avoid concatenation with component defaults)
  await page.evaluate(() => { document.querySelector('#username').value = ''; document.querySelector('#password').value = ''; });

  // Test wrong password
  await page.type('#username', 'admin@test.com');
  await page.type('#password', 'wrong');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));
  const errorText = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT WRONG:', errorText.substring(0, 500).replace(/\n/g, ' '));

  // Test successful login
  await page.evaluate(() => { document.querySelector('#password').value = ''; });
  await page.type('#password', 'admin123');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
  ]);

  console.log('Page URL after submit:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT:', bodyText.substring(0, 1000).replace(/\n/g, ' '));

  await browser.close();
})();
