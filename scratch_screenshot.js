const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/');
  // Wait a few seconds for animations to initialize
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/Users/dell/.gemini/antigravity-ide/brain/613d1357-0ed6-44c4-bfc9-6616f0a6433f/otp_background_tuned.png' });
  await browser.close();
})();
