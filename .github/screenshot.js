const puppeteer = require('puppeteer');
const fs = require('fs');

const pagePath = process.argv[2];
if (!pagePath) {
  console.error('No HTML file provided.');
  process.exit(1);
}

// Build the URL based on the repo's GitHub Pages domain
const baseUrl = 'https://noaa-fims.github.io/fims-weekly/';
const fileName = pagePath.split('/').pop();
const url = `${baseUrl}${fileName}`;

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  await browser.close();
  console.log(`Screenshot saved for ${url}`);
})();