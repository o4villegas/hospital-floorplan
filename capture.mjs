import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// View 1: Default view (clean)
await page.screenshot({ path: '/home/lando555/tmp/view1-default.png', fullPage: false });

// Rotate 90° right
await page.mouse.move(960, 540);
await page.mouse.down();
await page.mouse.move(660, 540, { steps: 20 }); // 300px left drag = ~90° right rotation
await page.mouse.up();
await page.waitForTimeout(500);

// View 2: Rotated 90° right
await page.screenshot({ path: '/home/lando555/tmp/view2-rotated-90.png', fullPage: false });

// Rotate another 90° right (total 180°)
await page.mouse.move(960, 540);
await page.mouse.down();
await page.mouse.move(660, 540, { steps: 20 });
await page.mouse.up();
await page.waitForTimeout(500);

// View 3: Rotated 180° (opposite side)
await page.screenshot({ path: '/home/lando555/tmp/view3-rotated-180.png', fullPage: false });

// Rotate another 90° right (total 270°)
await page.mouse.move(960, 540);
await page.mouse.down();
await page.mouse.move(660, 540, { steps: 20 });
await page.mouse.up();
await page.waitForTimeout(500);

// View 4: Rotated 270°
await page.screenshot({ path: '/home/lando555/tmp/view4-rotated-270.png', fullPage: false });

// Rotate another 90° right (total 360° = back to start)
await page.mouse.move(960, 540);
await page.mouse.down();
await page.mouse.move(660, 540, { steps: 20 });
await page.mouse.up();
await page.waitForTimeout(500);

// View 5: Full 360° rotation (should be similar to view 1)
await page.screenshot({ path: '/home/lando555/tmp/view5-rotated-360.png', fullPage: false });

await browser.close();
console.log('Screenshots saved - testing 360° rotation');
