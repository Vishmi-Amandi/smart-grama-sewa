// test-safari.js - ES Module version for your project
import { webkit } from 'playwright';

(async () => {
  console.log('Opening Safari/WebKit browser...');
  console.log('Make sure your React app is running first!');
  console.log('Run "npm run dev" in a SEPARATE terminal window\n');
  
  try {
    const browser = await webkit.launch({
      headless: false,  // Show the browser window
      slowMo: 500       // Slow down so you can see what's happening
    });
    
    const page = await browser.newPage();
    
    // Try common development ports
    const ports = ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];
    let connected = false;
    
    for (const port of ports) {
      try {
        await page.goto(port, { timeout: 2000 });
        console.log(`Connected to ${port}`);
        connected = true;
        break;
      } catch (e) {
        console.log(`Could not connect to ${port}`);
      }
    }
    
    if (!connected) {
      console.log('\nCould not find your React app!');
      console.log('Please make sure you ran "npm run dev" in another terminal');
      await browser.close();
      return;
    }
    
    console.log('\nSafari/WebKit browser opened!');
    console.log('You have 90 seconds to manually test your app...');
    console.log('Click around, try booking appointments, test language switcher\n');
    
    // Keep browser open for 90 seconds
    await page.waitForTimeout(90000);
    
    await browser.close();
    console.log('\nTest session complete!');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure Playwright is installed: npm install --save-dev @playwright/test');
    console.log('2. Make sure WebKit is installed: npx playwright install webkit');
  }
})();