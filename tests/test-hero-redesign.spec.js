const { chromium } = require('playwright');

(async () => {
    console.log('=== Homepage Hero Polishing Verification ===\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Test different viewport sizes
    const viewports = [
        { width: 360, height: 640, name: 'Mobile (360px)' },
        { width: 390, height: 640, name: 'Mobile (390px)' },
        { width: 430, height: 640, name: 'Mobile (430px)' },
        { width: 768, height: 1024, name: 'Tablet (768px)' },
        { width: 1920, height: 1080, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
        console.log(`\n--- Testing ${viewport.name} ---`);
        
        await page.setViewportSize(viewport);
        await page.goto('http://localhost:14627', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(3000);

        // Check if hero section exists
        const heroSection = page.locator('.hero-section');
        const heroExists = await heroSection.count();
        console.log(`Hero section exists: ${heroExists > 0 ? '✅' : '❌'}`);

        // Check if main headline is correct
        const headline = page.locator('.hero-title');
        const headlineVisible = await headline.isVisible();
        const headlineText = headlineVisible ? await headline.textContent() : '';
        console.log(`Headline visible: ${headlineVisible ? '✅' : '❌'}`);
        console.log(`Headline text: ${headlineText.trim()}`);

        // Check if description is correct
        const description = page.locator('.hero-description');
        const descriptionVisible = await description.isVisible();
        console.log(`Description visible: ${descriptionVisible ? '✅' : '❌'}`);

        // Check if Explore Menu CTA exists
        const exploreCta = page.locator('.hero-cta-primary');
        const exploreCtaVisible = await exploreCta.isVisible();
        const exploreCtaText = exploreCtaVisible ? await exploreCta.textContent() : '';
        console.log(`Explore Menu CTA visible: ${exploreCtaVisible ? '✅' : '❌'}`);
        console.log(`Explore Menu CTA text: ${exploreCtaText.trim()}`);

        // Check if promo section exists
        const promoSection = page.locator('.hero-promo');
        const promoExists = await promoSection.count();
        console.log(`Promo section exists: ${promoExists > 0 ? '✅' : '❌'}`);

        // Check if iced tea image loads
        const icedTeaImage = page.locator('.promo-cup-image');
        const imageExists = await icedTeaImage.count();
        console.log(`Iced tea image exists: ${imageExists > 0 ? '✅' : '❌'}`);

        if (imageExists > 0) {
            const imageWidth = await icedTeaImage.evaluate(el => el.naturalWidth);
            const imageHeight = await icedTeaImage.evaluate(el => el.naturalHeight);
            console.log(`Image dimensions: ${imageWidth}x${imageHeight}px`);
            console.log(`Image rendered: ${imageWidth > 0 && imageHeight > 0 ? '✅' : '❌'}`);
        }

        // Check if promo CTA exists
        const promoCta = page.locator('.promo-cta');
        const promoCtaVisible = await promoCta.isVisible();
        const promoCtaText = promoCtaVisible ? await promoCta.textContent() : '';
        console.log(`Promo CTA visible: ${promoCtaVisible ? '✅' : '❌'}`);
        console.log(`Promo CTA text: ${promoCtaText.trim()}`);

        // Check header doesn't cover heading
        const headlineBox = await headline.boundingBox();
        const navbarHeight = await page.evaluate(() => {
            const navbar = document.querySelector('#navbar-container');
            return navbar ? navbar.offsetHeight : 0;
        });
        const headerClear = headlineBox ? headlineBox.y > navbarHeight : false;
        console.log(`Header clear of heading: ${headerClear ? '✅' : '❌'}`);

        // Check for horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.body.scrollWidth > window.innerWidth;
        });
        console.log(`No horizontal scroll: ${!hasHorizontalScroll ? '✅' : '❌'}`);

        // Take screenshot
        await page.screenshot({ path: `homepage-preview-${viewport.name.replace(/\s+/g, '_').toLowerCase()}.png`, fullPage: false });
        console.log(`Screenshot saved: homepage-preview-${viewport.name.replace(/\s+/g, '_').toLowerCase()}.png`);
    }

    await browser.close();
    console.log('\n=== Verification Complete ===');
    console.log('Screenshots saved in project root');
})();
