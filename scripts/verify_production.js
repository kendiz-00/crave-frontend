const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const PROD_URL = 'https://crave-frontend.vercel.app/';

const viewports = [
  { name: 'Desktop_1280px', width: 1280, height: 800, isMobile: false },
  { name: 'Mobile_360px', width: 360, height: 740, isMobile: true },
  { name: 'Mobile_390px', width: 390, height: 844, isMobile: true },
  { name: 'Mobile_430px', width: 430, height: 932, isMobile: true }
];

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile
    });

    console.log(`\n--- Testing ${vp.name} (${vp.width}x${vp.height}) on ${PROD_URL} ---`);
    await page.goto(PROD_URL, { waitUntil: 'networkidle' });

    // Wait for hero to render
    const hero = await page.waitForSelector('.clean-hero');
    const heroBox = await hero.boundingBox();

    // Check Headline
    const headline = await page.waitForSelector('.clean-hero .hero-headline');
    const ivoryPart = await page.$('.clean-hero .hero-headline .headline-ivory');
    const goldPart = await page.$('.clean-hero .hero-headline .headline-gold');
    const headlineText = await headline.innerText();

    const ivoryColor = await ivoryPart.evaluate(el => window.getComputedStyle(el).color);
    const goldColor = await goldPart.evaluate(el => {
      const s = window.getComputedStyle(el);
      return { fill: s.webkitTextFillColor, bg: s.backgroundImage };
    });
    const anim = await headline.evaluate(el => window.getComputedStyle(el).animationName);

    // Check Iced Tea Image
    const img = await page.$('.crave-promo-panel__img');
    const imgInfo = await img.evaluate(el => ({
      src: el.currentSrc || el.src,
      complete: el.complete,
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
      width: el.offsetWidth,
      height: el.offsetHeight
    }));

    // Check CTAs
    const ctaClaim = await page.$('#heroClaimBtn');
    const ctaMenu = await page.$('#heroExploreBtn');
    const claimBox = await ctaClaim.boundingBox();
    const menuBox = await ctaMenu.boundingBox();
    const claimHref = await ctaClaim.getAttribute('href');
    const menuHref = await ctaMenu.getAttribute('href');

    // Check WhatsApp Floating button position
    const whatsapp = await page.$('.whatsapp-float, #whatsapp-btn');
    let waBox = null;
    let waClear = true;
    if (whatsapp) {
      waBox = await whatsapp.boundingBox();
      if (waBox && claimBox) {
        const overlap = !(claimBox.x + claimBox.width < waBox.x ||
                          waBox.x + waBox.width < claimBox.x ||
                          claimBox.y + claimBox.height < waBox.y ||
                          waBox.y + waBox.height < claimBox.y);
        waClear = !overlap;
      }
    }

    // Outer edge alignment
    const headBox = await headline.boundingBox();
    const card = await page.$('.crave-promo-panel');
    const cardBox = await card.boundingBox();
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    // Screenshot
    const shotPath = path.resolve(`crave-frontend/prod-${vp.name}.png`);
    await page.screenshot({ path: shotPath });

    // Also copy to artifact dir
    const artifactPath = `C:\\Users\\J. Vincent Doh\\.gemini\\antigravity\\brain\\c18a3db1-8a75-4391-ac69-13bcc9a1440e\\prod-${vp.name}.png`;
    fs.copyFileSync(shotPath, artifactPath);

    const res = {
      viewport: vp.name,
      headlineText: headlineText.replace(/\s+/g, ' ').trim(),
      ivoryColor,
      goldBackground: goldColor.bg.slice(0, 50) + '...',
      animation: anim,
      imgLoaded: imgInfo.complete && imgInfo.naturalWidth > 0,
      naturalSize: `${imgInfo.naturalWidth}x${imgInfo.naturalHeight}`,
      imgSrc: imgInfo.src.split('/').pop(),
      claimCta: { visible: !!claimBox && claimBox.width > 0, href: claimHref },
      menuCta: { visible: !!menuBox && menuBox.width > 0, href: menuHref },
      waClear,
      horizontalOverflow: scrollWidth <= vp.width,
      screenshot: artifactPath
    };
    results.push(res);
    console.log(JSON.stringify(res, null, 2));

    await page.close();
  }

  await browser.close();
  console.log('\nAll production verifications finished successfully.');
})();
