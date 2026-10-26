const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('=== Verifying Crave Ghana Homepage Hero Redesign ===\n');

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const viewports = [
        { width: 360, height: 740, name: 'Mobile_360px' },
        { width: 390, height: 844, name: 'Mobile_390px' },
        { width: 430, height: 932, name: 'Mobile_430px' },
        { width: 768, height: 1024, name: 'Tablet_768px' },
        { width: 1280, height: 800, name: 'Desktop_1280px' }
    ];

    const results = [];

    for (const vp of viewports) {
        console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})`);
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('http://localhost:8605/index.html', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);

        const data = await page.evaluate(() => {
            const hero = document.querySelector('.clean-hero');
            const headline = document.querySelector('.hero-headline');
            const ivory = document.querySelector('.headline-ivory');
            const gold = document.querySelector('.headline-gold');
            const desc = document.querySelector('.hero-subheading');
            const claimBtn = document.querySelector('#heroClaimBtn');
            const exploreBtn = document.querySelector('#heroExploreBtn');
            const promoPanel = document.querySelector('.crave-promo-panel');
            const promoImg = document.querySelector('.crave-promo-panel__img');
            const promoLabel = document.querySelector('.crave-promo-panel__label');
            const promoHeading = document.querySelector('.crave-promo-panel__heading');
            const promoCopy = document.querySelector('.crave-promo-panel__copy');
            const promoNote = document.querySelector('.crave-promo-panel__note');
            const whatsapp = document.querySelector('.whatsapp-float');
            const navbar = document.querySelector('#craveNavbar');

            const heroRect = hero ? hero.getBoundingClientRect() : null;
            const headlineRect = headline ? headline.getBoundingClientRect() : null;
            const descRect = desc ? desc.getBoundingClientRect() : null;
            const claimRect = claimBtn ? claimBtn.getBoundingClientRect() : null;
            const exploreRect = exploreBtn ? exploreBtn.getBoundingClientRect() : null;
            const promoRect = promoPanel ? promoPanel.getBoundingClientRect() : null;
            const whatsappRect = whatsapp ? whatsapp.getBoundingClientRect() : null;
            const navRect = navbar ? navbar.getBoundingClientRect() : null;

            return {
                heroFound: Boolean(hero),
                headlineText: headline ? headline.innerText.trim().replace(/\s+/g, ' ') : null,
                ivoryColor: ivory ? window.getComputedStyle(ivory).color : null,
                goldText: gold ? gold.innerText.trim() : null,
                goldColor: gold ? window.getComputedStyle(gold).webkitTextFillColor || window.getComputedStyle(gold).color : null,
                descText: desc ? desc.innerText.trim().replace(/\s+/g, ' ') : null,
                claimBtnText: claimBtn ? claimBtn.innerText.trim().replace(/\s+/g, ' ') : null,
                claimBtnHref: claimBtn ? claimBtn.getAttribute('href') : null,
                exploreBtnText: exploreBtn ? exploreBtn.innerText.trim().replace(/\s+/g, ' ') : null,
                exploreBtnHref: exploreBtn ? exploreBtn.getAttribute('href') : null,
                promoLabel: promoLabel ? promoLabel.innerText.trim() : null,
                promoHeading: promoHeading ? promoHeading.innerText.trim() : null,
                promoCopy: promoCopy ? promoCopy.innerText.trim() : null,
                promoNote: promoNote ? promoNote.innerText.trim() : null,
                imgNaturalWidth: promoImg ? promoImg.naturalWidth : 0,
                imgNaturalHeight: promoImg ? promoImg.naturalHeight : 0,
                imgCurrentSrc: promoImg ? promoImg.currentSrc : null,
                hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
                bodyScrollWidth: document.body.scrollWidth,
                windowInnerWidth: window.innerWidth,
                navBottom: navRect ? navRect.bottom : 0,
                headlineTop: headlineRect ? headlineRect.top : 0,
                rects: {
                    hero: heroRect,
                    headline: headlineRect,
                    desc: descRect,
                    claimBtn: claimRect,
                    exploreBtn: exploreRect,
                    promo: promoRect,
                    whatsapp: whatsappRect
                }
            };
        });

        // Screenshot
        const screenshotPath = path.join(__dirname, '..', `preview-${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        console.log(`- Headline: "${data.headlineText}"`);
        console.log(`- Description: "${data.descText}"`);
        console.log(`- Claim CTA: "${data.claimBtnText}" -> ${data.claimBtnHref}`);
        console.log(`- Explore CTA: "${data.exploreBtnText}" -> ${data.exploreBtnHref}`);
        console.log(`- Promo: "${data.promoLabel}" | "${data.promoHeading}" | "${data.promoCopy}" | "${data.promoNote}"`);
        console.log(`- Image: ${data.imgNaturalWidth}x${data.imgNaturalHeight} (${data.imgCurrentSrc})`);
        console.log(`- Horizontal scroll: ${data.hasHorizontalScroll ? 'FAIL (Overflow)' : 'PASS (No overflow)'}`);
        console.log(`- Header clearance: headlineTop (${data.headlineTop}px) > navBottom (${data.navBottom}px): ${data.headlineTop > data.navBottom ? 'PASS' : 'FAIL'}`);
        if (data.rects.whatsapp && data.rects.claimBtn) {
            const overlap = !(data.rects.whatsapp.right < data.rects.claimBtn.left || 
                              data.rects.whatsapp.left > data.rects.claimBtn.right || 
                              data.rects.whatsapp.bottom < data.rects.claimBtn.top || 
                              data.rects.whatsapp.top > data.rects.claimBtn.bottom);
            console.log(`- WhatsApp CTA overlap: ${overlap ? 'FAIL (Overlapping)' : 'PASS (Clear)'}`);
        }
        console.log(`- Screenshot: preview-${vp.name}.png`);
        results.push({ viewport: vp.name, data });
    }

    await browser.close();
    console.log('\n=== All Viewports Verified ===');
})();
