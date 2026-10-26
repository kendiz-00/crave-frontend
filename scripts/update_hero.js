const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Normalize line endings to CRLF
const isCRLF = html.includes('\r\n');
const newline = isCRLF ? '\r\n' : '\n';

// 1. Replace the top hero <style> block
// Find start of hero style
const heroStyleStartTag = '<style>';
const heroStyleComment = '/* Clean Editorial Hero Section */';
const sIdx = html.indexOf(heroStyleComment);
if (sIdx === -1) {
    console.error('Could not find /* Clean Editorial Hero Section */');
    process.exit(1);
}
const styleTagStart = html.lastIndexOf('<style>', sIdx);
const styleTagEnd = html.indexOf('</style>', sIdx);

const newHeroStyle = `<style>
        /* ══════════════════════════════════════════════════════════════════
           CRAVE HOMEPAGE HERO & REDESIGNED ICED TEA PROMOTION
           ══════════════════════════════════════════════════════════════════ */
        
        /* Ensure no inherited pseudo-elements conflict with the hero */
        body.crave-home .clean-hero::before,
        body.crave-home .clean-hero::after {
            content: none !important;
            display: none !important;
        }

        body.crave-home .clean-hero {
            position: relative;
            min-height: 85vh;
            padding: 120px 0 70px;
            display: flex;
            align-items: center;
            overflow: hidden;
            background: #0a0a0c;
            isolation: isolate;
            width: 100%;
            margin: 0;
            box-sizing: border-box;
        }

        body.crave-home .hero-cinematic-bg {
            position: absolute;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
        }

        body.crave-home .hero-bg-glow {
            position: absolute;
            top: 20%;
            right: 15%;
            width: 550px;
            height: 550px;
            background: radial-gradient(circle, rgba(212, 163, 115, 0.12) 0%, transparent 65%);
            filter: blur(60px);
            pointer-events: none;
        }

        body.crave-home .hero-bg-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at center, transparent 35%, rgba(6, 6, 8, 0.88) 100%);
            pointer-events: none;
        }

        body.crave-home .hero-container {
            position: relative;
            z-index: 2;
            width: 100%;
            max-width: 1240px;
            margin: 0 auto;
            padding: 0 24px;
            box-sizing: border-box;
        }

        body.crave-home .hero-split-layout {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 52px;
            align-items: center;
            width: 100%;
        }

        /* Left Column: Copy & Actions */
        body.crave-home .hero-copy-col {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            text-align: left;
            width: 100%;
        }

        body.crave-home .hero-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            background: rgba(212, 163, 115, 0.1);
            border: 1px solid rgba(212, 163, 115, 0.25);
            border-radius: 30px;
            margin-bottom: 22px;
        }

        body.crave-home .eyebrow-icon {
            color: #ffd700;
            font-size: 11px;
        }

        body.crave-home .eyebrow-text {
            font-family: 'Poppins', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #d4a373;
        }

        /* Headline: FOOD WORTH in ivory, CRAVING. in gold */
        body.crave-home .hero-headline {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(2.5rem, 5.2vw, 4.2rem);
            font-weight: 700;
            line-height: 1.1;
            letter-spacing: -0.02em;
            margin: 0 0 22px;
            text-shadow: 0 4px 30px rgba(0, 0, 0, 0.7);
            animation: heroFadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes heroFadeInUp {
            from {
                opacity: 0;
                transform: translateY(22px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            body.crave-home .hero-headline {
                animation: none !important;
            }
        }

        body.crave-home .headline-ivory {
            color: #f0e8d6;
        }

        body.crave-home .headline-gold {
            background: linear-gradient(135deg, #ffd700 0%, #d4a373 60%, #c49a6c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: #d4a373;
            display: inline-block;
        }

        body.crave-home .hero-subheading {
            font-family: 'Poppins', sans-serif;
            font-size: clamp(1rem, 1.4vw, 1.15rem);
            font-weight: 400;
            color: rgba(240, 232, 214, 0.82);
            line-height: 1.68;
            max-width: 540px;
            margin: 0 0 32px;
        }

        /* CTA Group */
        body.crave-home .hero-cta-group {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 34px;
            flex-wrap: wrap;
            width: 100%;
        }

        body.crave-home .hero-btn-primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            min-height: 54px;
            padding: 0 32px;
            background: linear-gradient(135deg, #d4a373 0%, #c49a6c 100%);
            color: #111111;
            border-radius: 30px;
            font-family: 'Poppins', sans-serif;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 8px 24px rgba(212, 163, 115, 0.3);
            transition: transform 0.28s ease, background 0.28s ease, box-shadow 0.28s ease;
            cursor: pointer;
        }

        body.crave-home .hero-btn-primary:hover {
            transform: translateY(-2px);
            background: linear-gradient(135deg, #ffd700 0%, #d4a373 100%);
            box-shadow: 0 12px 32px rgba(255, 215, 0, 0.4);
            color: #111111;
        }

        body.crave-home .hero-btn-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-height: 54px;
            padding: 0 26px;
            font-family: 'Poppins', sans-serif;
            font-size: 15px;
            font-weight: 600;
            color: #f0e8d6;
            text-decoration: none;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(240, 232, 214, 0.2);
            border-radius: 30px;
            transition: all 0.25s ease;
        }

        body.crave-home .hero-btn-link:hover {
            color: #ffd700;
            background: rgba(212, 163, 115, 0.12);
            border-color: rgba(212, 163, 115, 0.4);
            transform: translateY(-2px);
        }

        /* Trust Badges */
        body.crave-home .hero-trust-row {
            display: flex;
            align-items: center;
            gap: 12px;
            font-family: 'Poppins', sans-serif;
            font-size: 13px;
            color: rgba(240, 232, 214, 0.72);
            flex-wrap: wrap;
        }

        body.crave-home .trust-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        body.crave-home .trust-item i {
            color: #d4a373;
            font-size: 12px;
        }

        body.crave-home .trust-sep {
            color: rgba(212, 163, 115, 0.35);
        }

        /* Right Column: Redesigned Free Iced Tea Promotion Panel */
        body.crave-home .hero-promo-col {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
        }

        body.crave-home .crave-promo-panel {
            position: relative;
            width: 100%;
            max-width: 440px;
            background: linear-gradient(155deg, #1a1a1e 0%, #111113 100%);
            border: 1px solid rgba(212, 175, 55, 0.24);
            border-radius: 18px;
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
            padding: 22px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            overflow: hidden;
            box-sizing: border-box;
            transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }

        body.crave-home .crave-promo-panel:hover {
            transform: translateY(-3px);
            border-color: rgba(212, 175, 55, 0.42);
            box-shadow: 0 24px 54px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 163, 115, 0.12);
        }

        body.crave-home .crave-promo-panel__visual {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            overflow: hidden;
            background: #0f0f11;
            padding: 12px 8px;
            box-sizing: border-box;
        }

        body.crave-home .crave-promo-panel__img {
            width: 100%;
            height: auto;
            max-height: 270px;
            object-fit: contain;
            display: block;
            border-radius: 8px;
            filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.5));
            transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }

        body.crave-home .crave-promo-panel:hover .crave-promo-panel__img {
            transform: scale(1.025);
        }

        body.crave-home .crave-promo-panel__content {
            display: flex;
            flex-direction: column;
            gap: 6px;
            text-align: left;
        }

        body.crave-home .crave-promo-panel__label {
            font-family: 'Poppins', sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #d4a373;
        }

        body.crave-home .crave-promo-panel__heading {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: clamp(1.3rem, 2vw, 1.6rem);
            font-weight: 700;
            line-height: 1.25;
            color: #f0e8d6;
            margin: 0;
            letter-spacing: -0.01em;
        }

        body.crave-home .crave-promo-panel__copy {
            font-family: 'Poppins', sans-serif;
            font-size: 14px;
            font-weight: 400;
            line-height: 1.55;
            color: rgba(240, 232, 214, 0.8);
            margin: 0;
        }

        body.crave-home .crave-promo-panel__note {
            font-family: 'Poppins', sans-serif;
            font-size: 10.5px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: rgba(212, 175, 55, 0.7);
            margin-top: 4px;
        }

        /* ══════════════════════════════════════════════════════════════════
           RESPONSIVE MOBILE & TABLET LAYOUTS
           ══════════════════════════════════════════════════════════════════ */
        
        @media (max-width: 991px) {
            body.crave-home .clean-hero {
                min-height: auto;
                padding: 90px 0 60px;
                width: 100%;
            }

            body.crave-home .hero-container {
                padding: 0 18px;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
            }

            body.crave-home .hero-split-layout {
                display: flex;
                flex-direction: column;
                gap: 16px;
                width: 100%;
                margin: 0;
            }

            body.crave-home .hero-copy-col {
                display: contents;
            }

            body.crave-home .hero-eyebrow {
                order: 1;
                align-self: flex-start;
                margin-bottom: 0;
            }

            body.crave-home .hero-headline {
                order: 2;
                font-size: clamp(2rem, 7vw, 2.75rem);
                line-height: 1.12;
                margin-bottom: 0;
                width: 100%;
                text-align: left;
            }

            body.crave-home .hero-subheading {
                order: 3;
                font-size: clamp(0.92rem, 3.2vw, 1.05rem);
                line-height: 1.58;
                margin-bottom: 0;
                max-width: 100%;
                width: 100%;
                text-align: left;
            }

            body.crave-home .hero-cta-group {
                order: 4;
                width: 100%;
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 4px;
                margin-bottom: 8px;
            }

            body.crave-home .hero-promo-col {
                order: 5;
                width: 100%;
                margin: 6px 0 0;
            }

            body.crave-home .crave-promo-panel {
                max-width: 100%;
                width: 100%;
                padding: 18px 20px;
                box-sizing: border-box;
                gap: 12px;
            }

            body.crave-home .crave-promo-panel__visual {
                padding: 8px 6px;
            }

            body.crave-home .crave-promo-panel__img {
                max-height: 180px;
            }

            body.crave-home .crave-promo-panel__heading {
                font-size: clamp(1.2rem, 3.8vw, 1.45rem);
                line-height: 1.25;
            }

            body.crave-home .crave-promo-panel__copy {
                font-size: 13.5px;
                line-height: 1.5;
            }

            body.crave-home .hero-btn-primary,
            body.crave-home .hero-btn-link {
                width: 100%;
                min-height: 50px;
                justify-content: center;
                box-sizing: border-box;
                font-size: 14.5px;
            }

            body.crave-home .hero-trust-row {
                order: 6;
                width: 100%;
                justify-content: flex-start;
                gap: 8px 12px;
                margin-top: 4px;
                font-size: 12px;
            }
        }

        /* 360px - 430px Mobile Screens */
        @media (max-width: 480px) {
            body.crave-home .clean-hero {
                padding: 86px 0 55px;
            }

            body.crave-home .hero-container {
                padding: 0 16px;
            }

            body.crave-home .hero-headline {
                font-size: clamp(1.9rem, 7.8vw, 2.35rem);
                letter-spacing: -0.015em;
            }

            body.crave-home .crave-promo-panel {
                padding: 14px 16px;
                border-radius: 14px;
                gap: 8px;
            }

            body.crave-home .crave-promo-panel__visual {
                padding: 6px 4px;
            }

            body.crave-home .crave-promo-panel__img {
                max-height: 145px;
            }

            body.crave-home .crave-promo-panel__heading {
                font-size: 1.15rem;
            }

            body.crave-home .crave-promo-panel__copy {
                font-size: 13px;
                line-height: 1.45;
            }

            body.crave-home .hero-trust-row {
                font-size: 11.5px;
            }
        }
    </style>`;

html = html.substring(0, styleTagStart) + newHeroStyle + html.substring(styleTagEnd + '</style>'.length);
console.log('1. Replaced top hero style block.');

// 2. Remove the old circular promo styles (from /* ══ CRAVE Premium Free-Drink Campaign Banner to </style>)
const oldPromoComment = '/* ══ CRAVE Premium Free-Drink Campaign Banner ═══════════════════════ */';
const opIdx = html.indexOf(oldPromoComment);
if (opIdx !== -1) {
    const opCloseStyle = html.indexOf('</style>', opIdx);
    if (opCloseStyle !== -1) {
        html = html.substring(0, opIdx) + '    </style>\r\n' + html.substring(opCloseStyle + '</style>'.length);
        console.log('2. Removed old circular promo styles (preserved closing </style>).');
    }
}

// 3. Replace the hero section HTML and remove orphan duplicate HTML
const heroSectionStart = '<!-- Premium Hero Section with Iced Tea Promotion -->';
const hsSIdx = html.indexOf(heroSectionStart);
if (hsSIdx === -1) {
    console.error('Could not find <!-- Premium Hero Section with Iced Tea Promotion -->');
    process.exit(1);
}

const heroSectionEnd = '<div class="crave-home-ticker-wrap">';
const hsEIdx = html.indexOf(heroSectionEnd);
if (hsEIdx === -1) {
    console.error('Could not find <div class="crave-home-ticker-wrap">');
    process.exit(1);
}

const newHeroHTML = `<!-- Clean Editorial Hero Section -->
\t<section class="clean-hero crave-reveal crave-reveal--static" id="craveHeroSection">
\t\t<div class="hero-cinematic-bg">
\t\t\t<div class="hero-bg-glow" aria-hidden="true"></div>
\t\t\t<div class="hero-bg-vignette" aria-hidden="true"></div>
\t\t</div>

\t\t<div class="hero-container">
\t\t\t<div class="hero-split-layout">
\t\t\t\t<!-- Left Column: Copy & Actions -->
\t\t\t\t<div class="hero-copy-col">
\t\t\t\t\t<div class="hero-eyebrow">
\t\t\t\t\t\t<span class="eyebrow-icon">✦</span>
\t\t\t\t\t\t<span class="eyebrow-text">ACCRA'S PREMIUM COMFORT FOOD</span>
\t\t\t\t\t</div>

\t\t\t\t\t<h1 class="hero-headline">
\t\t\t\t\t\t<span class="headline-ivory">FOOD WORTH</span> <span class="headline-gold">CRAVING.</span>
\t\t\t\t\t</h1>

\t\t\t\t\t<p class="hero-subheading">
\t\t\t\t\t\tCrispy fried chicken, loaded fries, handcrafted smoothies & jar cakes. Prepared fresh daily and delivered fast across Accra.
\t\t\t\t\t</p>

\t\t\t\t\t<div class="hero-cta-group">
\t\t\t\t\t\t<a href="register.html?firstOrder=true" class="hero-btn-primary" id="heroClaimBtn">
\t\t\t\t\t\t\t<span>Claim Your Free Iced Tea</span>
\t\t\t\t\t\t\t<i class="fas fa-arrow-right" aria-hidden="true"></i>
\t\t\t\t\t\t</a>
\t\t\t\t\t\t<a href="menu.html" class="hero-btn-link" id="heroExploreBtn">
\t\t\t\t\t\t\t<span>Explore Menu</span>
\t\t\t\t\t\t\t<i class="fas fa-chevron-right" aria-hidden="true"></i>
\t\t\t\t\t\t</a>
\t\t\t\t\t</div>

\t\t\t\t\t<div class="hero-trust-row">
\t\t\t\t\t\t<span class="trust-item"><i class="fas fa-bolt" aria-hidden="true"></i> Fast Delivery</span>
\t\t\t\t\t\t<span class="trust-sep">•</span>
\t\t\t\t\t\t<span class="trust-item"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> Serving All Accra</span>
\t\t\t\t\t\t<span class="trust-sep">•</span>
\t\t\t\t\t\t<span class="trust-item"><i class="fas fa-fire" aria-hidden="true"></i> Fresh Daily</span>
\t\t\t\t\t</div>
\t\t\t\t</div>

\t\t\t\t<!-- Right Column: Redesigned Free Iced Tea Promotion Panel -->
\t\t\t\t<div class="hero-promo-col">
\t\t\t\t\t<div class="crave-promo-panel" id="craveFirstOrderHeroPromo" role="region" aria-label="First order free iced tea offer">
\t\t\t\t\t\t<div class="crave-promo-panel__visual">
\t\t\t\t\t\t\t<picture>
\t\t\t\t\t\t\t\t<source srcset="images/iced_tea.webp" type="image/webp">
\t\t\t\t\t\t\t\t<img src="images/iced_tea.png" alt="CRAVE Branded Iced Tea" class="crave-promo-panel__img" width="500" height="500" decoding="async" loading="eager">
\t\t\t\t\t\t\t</picture>
\t\t\t\t\t\t</div>
\t\t\t\t\t\t<div class="crave-promo-panel__content">
\t\t\t\t\t\t\t<span class="crave-promo-panel__label">A LITTLE SOMETHING ON US</span>
\t\t\t\t\t\t\t<h2 class="crave-promo-panel__heading">Free iced tea with your first order.</h2>
\t\t\t\t\t\t\t<p class="crave-promo-panel__copy">Enjoy a complimentary iced tea with your first order.</p>
\t\t\t\t\t\t\t<span class="crave-promo-panel__note">First order only.</span>
\t\t\t\t\t\t</div>
\t\t\t\t\t</div>
\t\t\t\t</div>
\t\t\t</div>
\t\t</div>
\t</section>

\t`;

html = html.substring(0, hsSIdx) + newHeroHTML + html.substring(hsEIdx);
console.log('3. Replaced hero HTML & eliminated duplicate orphan markup.');

// 4. Update heroBg selector
html = html.replace("var heroBg = document.querySelector('.hero-section .hero-background');", "var heroBg = document.querySelector('.clean-hero .hero-cinematic-bg, .hero-section .hero-background');");
console.log('4. Updated heroBg selector.');

// 5. Replace bottom initPromoDismiss script
const oldScriptComment = '// Old promo banner removed in redesign';
const osIdx = html.indexOf(oldScriptComment);
if (osIdx !== -1) {
    const scStart = html.lastIndexOf('<script>', osIdx);
    const scEnd = html.indexOf('</script>', osIdx);
    const newHeroScript = `<script>
(function() {
  'use strict';
  document.addEventListener('DOMContentLoaded', async function() {
    var claimBtn = document.getElementById('heroClaimBtn');
    if (!claimBtn) return;
    
    // Check promo state if getFirstOrderPromoState is defined
    if (typeof getFirstOrderPromoState === 'function') {
      try {
        var promoState = await getFirstOrderPromoState();
        if (promoState && promoState.state === 'claimed') {
          claimBtn.innerHTML = '<span>Choose Your Iced Tea</span> <i class="fas fa-arrow-right" aria-hidden="true"></i>';
          claimBtn.href = 'menu.html#smoothies';
        } else if (promoState && promoState.state === 'ineligible') {
          claimBtn.innerHTML = '<span>Explore Menu</span> <i class="fas fa-arrow-right" aria-hidden="true"></i>';
          claimBtn.href = 'menu.html';
        }
      } catch (err) {
        console.debug('Promo state check:', err);
      }
    }
    
    claimBtn.addEventListener('click', function(e) {
      if (typeof handleExplicitFirstOrderClaim === 'function') {
        e.preventDefault();
        handleExplicitFirstOrderClaim(claimBtn, 'hero');
      }
    });

    var promoPanel = document.getElementById('craveFirstOrderHeroPromo');
    if (promoPanel) {
      promoPanel.style.cursor = 'pointer';
      promoPanel.addEventListener('click', function() {
        claimBtn.click();
      });
    }
  });
})();
</script>`;
    html = html.substring(0, scStart) + newHeroScript + html.substring(scEnd + '</script>'.length);
    console.log('5. Replaced bottom script.');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('index.html update complete!');
