const { chromium } = require('playwright');

(async () => {
    console.log('=== Tracing Width Constraints ===\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setViewportSize({ width: 390, height: 640 });
    await page.goto('http://localhost:8605', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Function to trace width constraints
    async function traceWidthConstraints(selector) {
        const result = [];
        
        const data = await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (!element) return null;
            
            const constraints = [];
            let current = element;
            let depth = 0;

            while (current && depth < 20) {
                const computed = window.getComputedStyle(current);
                const rect = current.getBoundingClientRect();
                
                constraints.push({
                    depth,
                    tagName: current.tagName,
                    className: current.className,
                    id: current.id,
                    width: rect.width,
                    maxWidth: computed.maxWidth,
                    widthComputed: computed.width,
                    display: computed.display,
                    position: computed.position,
                    padding: computed.padding,
                    margin: computed.margin,
                    transform: computed.transform,
                    flex: computed.flex,
                    grid: computed.grid
                });
                
                current = current.parentElement;
                depth++;
            }

            return constraints;
        }, selector);

        return data;
    }

    // Trace headline
    const headlineConstraints = await traceWidthConstraints('.hero-title');

    console.log('=== Headline Width Constraints ===');
    for (const item of headlineConstraints) {
        console.log(`Depth ${item.depth}: ${item.tagName}${item.className ? '.' + item.className : ''}${item.id ? '#' + item.id : ''}`);
        console.log(`  Width: ${item.width}px (computed: ${item.widthComputed})`);
        console.log(`  Max-width: ${item.maxWidth}`);
        console.log(`  Display: ${item.display}`);
        console.log(`  Position: ${item.position}`);
        console.log(`  Padding: ${item.padding}`);
        console.log(`  Margin: ${item.margin}`);
        console.log(`  Transform: ${item.transform}`);
        console.log('');
    }

    // Trace description
    const descConstraints = await traceWidthConstraints('.hero-description');

    console.log('=== Description Width Constraints ===');
    for (const item of descConstraints) {
        console.log(`Depth ${item.depth}: ${item.tagName}${item.className ? '.' + item.className : ''}${item.id ? '#' + item.id : ''}`);
        console.log(`  Width: ${item.width}px (computed: ${item.widthComputed})`);
        console.log(`  Max-width: ${item.maxWidth}`);
        console.log(`  Display: ${item.display}`);
        console.log('');
    }

    await browser.close();
})();
