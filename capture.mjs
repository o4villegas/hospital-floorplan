import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// View 1: Clean building (no damage)
await page.screenshot({ path: '/home/lando555/tmp/view1-clean.png', fullPage: false });

// Click ceiling damage toggle (second toggle button)
const ceilingToggle = page.locator('button').filter({ hasText: '' }).nth(3);
await page.click('text=Ceiling/Roof Damage');
await page.waitForTimeout(1000);

// View 2: Ceiling damage ON
await page.screenshot({ path: '/home/lando555/tmp/view2-ceiling-on.png', fullPage: false });

// Rotate to see walls better
await page.mouse.move(960, 540);
await page.mouse.down();
await page.mouse.move(1200, 600, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(500);

// View 3: Rotated with ceiling damage
await page.screenshot({ path: '/home/lando555/tmp/view3-ceiling-rotated.png', fullPage: false });

await browser.close();
console.log('Screenshots saved');
