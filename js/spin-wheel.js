/**
 * CRAVE Premium Spin & Win Wheel
 * Production-quality engagement system with physical depth, audio synthesis, confetti, and backend integration
 */

const CraveSpinWheel = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const engine = typeof CraveRewardsEngine !== 'undefined' ? CraveRewardsEngine : null;
    const data = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData : null;
    const notifications = typeof CraveRewardsNotifications !== 'undefined' ? CraveRewardsNotifications : null;

    let wheelContainer = null;
    let wheel = null;
    let isSpinning = false;
    let currentRotation = 0;
    let audioContext = null;
    let confettiCanvas = null;
    let confettiCtx = null;
    let confettiParticles = [];
    let animationFrame = null;

    // Weighted prize probabilities (PROTECTED LOGIC - DO NOT ALTER)
    const PRIZE_PROBABILITIES = [
        { name: '5 Points', shortLabel: '5 PTS', icon: '⭐', probability: 0.40, type: 'points', value: 5 },
        { name: '10 Points', shortLabel: '10 PTS', icon: '🌟', probability: 0.25, type: 'points', value: 10 },
        { name: '20 Points', shortLabel: '20 PTS', icon: '💫', probability: 0.15, type: 'points', value: 20 },
        { name: 'Free Drink', shortLabel: 'FREE DRINK', icon: '🥤', probability: 0.08, type: 'reward', value: 'drink' },
        { name: 'Free Fries', shortLabel: 'FREE FRIES', icon: '🍟', probability: 0.05, type: 'reward', value: 'fries' },
        { name: 'Free Dessert', shortLabel: 'FREE DESSERT', icon: '🍰', probability: 0.03, type: 'reward', value: 'dessert' },
        { name: 'GH₵20 Coupon', shortLabel: 'GH₵20 OFF', icon: '🎟️', probability: 0.02, type: 'coupon', value: 20 },
        { name: 'Premium Combo', shortLabel: 'COMBO', icon: '🍔', probability: 0.015, type: 'reward', value: 'combo' },
        { name: 'VIP Golden Reward', shortLabel: 'VIP GOLD', icon: '👑', probability: 0.005, type: 'vip', value: 'golden' }
    ];

    // Spin economy rules (PROTECTED LOGIC - DO NOT ALTER)
    const SPIN_ECONOMY = {
        firstOrder: 1,
        spend80: 1,
        spend150: 2,
        dailyStreakBonus: 1,
        referralBonus: 1,
        birthdaySpins: 3,
        flashPromoBonus: 1
    };

    // Initialize the wheel
    function init() {
        if (wheelContainer) return;
        
        createWheelContainer();
        addWheelStyles();
        initAudio();
    }

    // Initialize audio context for wheel sounds
    function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio context not supported');
        }
    }

    // Play wheel tick sound
    function playTickSound() {
        if (!audioContext) return;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 900;
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0.09, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.07);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.07);
        } catch (e) {}
    }

    // Play win sound
    function playWinSound() {
        if (!audioContext) return;
        
        try {
            const now = audioContext.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
            
            notes.forEach((freq, idx) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(audioContext.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';
                
                const startTime = now + idx * 0.12;
                gain.gain.setValueAtTime(0.18, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
                
                osc.start(startTime);
                osc.stop(startTime + 0.45);
            });
        } catch (e) {}
    }

    // Vibrate device (mobile)
    function vibrate(pattern) {
        if (navigator.vibrate) {
            try { navigator.vibrate(pattern); } catch (e) {}
        }
    }

    // Create confetti effect
    function createConfetti() {
        if (confettiCanvas) return;
        
        confettiCanvas = document.createElement('canvas');
        confettiCanvas.id = 'crave-confetti-canvas';
        confettiCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10005;
        `;
        document.body.appendChild(confettiCanvas);
        
        confettiCtx = confettiCanvas.getContext('2d');
        resizeConfetti();
        
        window.addEventListener('resize', resizeConfetti);
    }

    function resizeConfetti() {
        if (confettiCanvas) {
            confettiCanvas.width = window.innerWidth;
            confettiCanvas.height = window.innerHeight;
        }
    }

    function launchConfetti() {
        createConfetti();
        confettiParticles = [];
        
        const colors = ['#d4a373', '#f3d5a3', '#ffd700', '#e5c158', '#ffffff', '#c49a6c'];
        
        for (let i = 0; i < 180; i++) {
            confettiParticles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 24,
                vy: (Math.random() - 0.5) * 24 - 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 12,
                gravity: 0.45,
                drag: 0.985
            });
        }
        
        animateConfetti();
    }

    function animateConfetti() {
        if (confettiParticles.length === 0) {
            if (confettiCanvas) {
                confettiCanvas.remove();
                confettiCanvas = null;
            }
            return;
        }
        
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        
        confettiParticles = confettiParticles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.rotation += p.rotationSpeed;
            
            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate(p.rotation * Math.PI / 180);
            confettiCtx.fillStyle = p.color;
            confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            confettiCtx.restore();
            
            return p.y < confettiCanvas.height + 50;
        });
        
        animationFrame = requestAnimationFrame(animateConfetti);
    }

    // Get weighted random prize (PROTECTED LOGIC - DO NOT ALTER)
    function getWeightedPrize() {
        const random = Math.random();
        let cumulative = 0;
        
        for (const prize of PRIZE_PROBABILITIES) {
            cumulative += prize.probability;
            if (random <= cumulative) {
                return prize;
            }
        }
        
        return PRIZE_PROBABILITIES[0];
    }

    // Calculate available spins (PROTECTED LOGIC - DO NOT ALTER)
    function calculateAvailableSpins() {
        if (!data) return 0;
        
        let earnedSpins = 0;
        const orders = data.Orders.getCount();
        const totalSpent = data.Orders.getTotalSpent();
        const dailyStreak = data.DailyRewards.getStreak();
        const referralsMade = data.Referrals.getCount();
        const birthday = data.Birthday.get();
        
        // First order bonus
        if (orders === 1) earnedSpins += SPIN_ECONOMY.firstOrder;
        
        // Spend thresholds
        if (totalSpent >= 150) earnedSpins += SPIN_ECONOMY.spend150;
        else if (totalSpent >= 80) earnedSpins += SPIN_ECONOMY.spend80;
        
        // Daily streak bonus
        if (dailyStreak >= 7) earnedSpins += SPIN_ECONOMY.dailyStreakBonus;
        
        // Referral bonus
        if (referralsMade > 0) earnedSpins += SPIN_ECONOMY.referralBonus * referralsMade;
        
        // Birthday bonus
        if (birthday && isBirthdayToday(birthday)) earnedSpins += SPIN_ECONOMY.birthdaySpins;
        
        // Subtract spins already used
        const spinsUsed = data.SpinStats.getTotalSpins();
        const availableSpins = Math.max(0, earnedSpins - spinsUsed);
        
        return availableSpins;
    }

    function isBirthdayToday(birthday) {
        const today = new Date();
        const bday = new Date(birthday);
        return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate();
    }

    // Create wheel container
    function createWheelContainer() {
        wheelContainer = document.createElement('div');
        wheelContainer.id = 'crave-spin-wheel-container';
        wheelContainer.className = 'crave-spin-wheel-container';
        document.body.appendChild(wheelContainer);
    }

    // Add wheel styles (Refined Luxury Casino-Inspired Experience)
    function addWheelStyles() {
        if (document.getElementById('crave-spin-wheel-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'crave-spin-wheel-styles';
        style.textContent = `
            /* CRAVE Glassmorphism Spin Modal */
            .crave-spin-wheel-overlay {
                position: fixed;
                inset: 0;
                background: rgba(5, 6, 9, 0.92);
                backdrop-filter: blur(28px);
                -webkit-backdrop-filter: blur(28px);
                z-index: 10003;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                padding: 12px;
                box-sizing: border-box;
            }

            .crave-spin-wheel-overlay.show {
                opacity: 1;
                pointer-events: auto;
            }

            .crave-spin-wheel-modal {
                position: relative;
                background: radial-gradient(circle at 50% 10%, rgba(36, 29, 21, 0.98) 0%, rgba(9, 10, 15, 0.99) 100%);
                border: 1.5px solid rgba(212, 163, 115, 0.32);
                border-radius: 36px;
                padding: clamp(20px, 4vw, 32px) clamp(16px, 4vw, 32px);
                max-width: 480px;
                width: 100%;
                text-align: center;
                box-shadow: 
                    0 30px 90px rgba(0, 0, 0, 0.9),
                    0 0 0 1px rgba(255, 255, 255, 0.06) inset,
                    0 0 140px rgba(212, 163, 115, 0.16);
                overflow: hidden;
                box-sizing: border-box;
            }

            .crave-spin-wheel-close {
                position: absolute;
                top: 18px;
                right: 18px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: rgba(255, 255, 255, 0.7);
                font-size: 18px;
                cursor: pointer;
                border-radius: 50%;
                transition: all 0.25s ease;
                z-index: 35;
            }

            .crave-spin-wheel-close:hover {
                background: rgba(212, 163, 115, 0.22);
                color: #ffffff;
                border-color: rgba(212, 163, 115, 0.6);
                transform: rotate(90deg);
            }

            .crave-spin-wheel-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 5px 14px;
                background: rgba(212, 163, 115, 0.12);
                border: 1px solid rgba(212, 163, 115, 0.32);
                border-radius: 30px;
                font-size: 11px;
                font-weight: 700;
                color: #e5c158;
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-bottom: 8px;
            }

            .crave-spin-wheel-title {
                font-size: clamp(24px, 5.5vw, 32px);
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 4px 0;
                letter-spacing: 0.5px;
                background: linear-gradient(135deg, #ffffff 30%, #f3d5a3 70%, #d4a373 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .crave-spin-wheel-subtitle {
                font-size: clamp(12px, 3vw, 14px);
                color: rgba(255, 255, 255, 0.65);
                margin: 0 0 clamp(16px, 3.5vw, 24px) 0;
                font-weight: 400;
            }

            /* HERO Wheel Container - Takes up 85-90% width */
            .crave-spin-wheel-wrapper {
                position: relative;
                width: min(390px, 86vw);
                height: min(390px, 86vw);
                margin: 0 auto clamp(16px, 3.5vw, 24px);
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(212, 163, 115, 0.2) 0%, rgba(0, 0, 0, 0) 70%);
            }

            .crave-spin-wheel-svg-container {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                position: relative;
                transition: transform 5.5s cubic-bezier(0.15, 0.85, 0.15, 0.99);
                filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.9));
                will-change: transform;
            }

            /* Polished 3D Mechanical Gold Pointer (12 o'clock) */
            .crave-spin-wheel-pointer-container {
                position: absolute;
                top: -14px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 30;
                pointer-events: none;
                filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.9));
            }

            .crave-spin-wheel-pointer-container svg {
                width: 38px;
                height: 52px;
                display: block;
            }

            .crave-spin-wheel-pointer-container.tick {
                animation: pointer-bounce 0.15s ease-in-out;
            }

            @keyframes pointer-bounce {
                0% { transform: translateX(-50%) rotate(0deg); }
                50% { transform: translateX(-50%) rotate(-14deg); }
                100% { transform: translateX(-50%) rotate(0deg); }
            }

            /* Spins indicator text */
            .crave-spin-wheel-spins-left {
                margin: 0 0 12px 0;
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
                font-weight: 600;
                letter-spacing: 0.5px;
            }

            .crave-spin-wheel-spins-left strong {
                color: #e5c158;
                font-weight: 800;
            }

            /* Spin CTA Button */
            .crave-spin-wheel-button {
                background: linear-gradient(135deg, #f3d5a3 0%, #d4a373 50%, #996e3d 100%);
                color: #0c0d11;
                border: none;
                padding: clamp(14px, 3.5vw, 18px) clamp(38px, 8vw, 60px);
                font-size: clamp(16px, 4vw, 19px);
                font-weight: 800;
                border-radius: 100px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 
                    0 12px 32px rgba(212, 163, 115, 0.38),
                    inset 0 2px 4px rgba(255, 255, 255, 0.6);
                text-transform: uppercase;
                letter-spacing: 1.5px;
                width: 100%;
                max-width: 320px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .crave-spin-wheel-button:hover:not(:disabled) {
                transform: translateY(-2px) scale(1.03);
                box-shadow: 
                    0 16px 40px rgba(212, 163, 115, 0.55),
                    inset 0 2px 4px rgba(255, 255, 255, 0.7);
                background: linear-gradient(135deg, #ffffff 0%, #f3d5a3 50%, #c49a6c 100%);
            }

            .crave-spin-wheel-button:active:not(:disabled) {
                transform: translateY(1px) scale(0.99);
            }

            .crave-spin-wheel-button:disabled {
                opacity: 0.45;
                cursor: not-allowed;
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.4);
                box-shadow: none;
            }

            /* Celebration Victory Modal (Hidden before spin) */
            .crave-spin-wheel-result {
                display: none;
                margin-top: 18px;
                padding: 24px 20px;
                background: radial-gradient(circle at 50% 0%, rgba(46, 36, 25, 0.96), rgba(12, 13, 18, 0.99));
                border: 1.5px solid rgba(212, 163, 115, 0.5);
                border-radius: 28px;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75);
            }

            .crave-spin-wheel-result.show {
                display: block !important;
                animation: result-appear 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes result-appear {
                from {
                    opacity: 0;
                    transform: translateY(18px) scale(0.94);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .crave-spin-wheel-result-badge {
                display: inline-block;
                font-size: 11px;
                font-weight: 800;
                color: #e5c158;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 8px;
            }

            .crave-spin-wheel-result-icon {
                font-size: 58px;
                margin-bottom: 10px;
                line-height: 1;
                display: block;
                animation: bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.5));
            }

            @keyframes bounce-in {
                0% { transform: scale(0.3); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }

            .crave-spin-wheel-result-title {
                font-size: 22px;
                font-weight: 800;
                color: #ffffff;
                margin: 0 0 6px 0;
            }

            .crave-spin-wheel-result-text {
                font-size: 15px;
                color: rgba(255, 255, 255, 0.75);
                margin: 0 0 18px 0;
            }

            .crave-spin-wheel-claim-btn {
                background: linear-gradient(135deg, #f3d5a3, #c49a6c);
                color: #0c0d11;
                border: none;
                padding: 12px 38px;
                font-size: 15px;
                font-weight: 800;
                border-radius: 40px;
                cursor: pointer;
                transition: all 0.25s ease;
                box-shadow: 0 6px 20px rgba(212, 163, 115, 0.35);
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .crave-spin-wheel-claim-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 24px rgba(212, 163, 115, 0.5);
            }

            /* Accessibility Reduced Motion */
            @media (prefers-reduced-motion: reduce) {
                .crave-spin-wheel-svg-container {
                    transition: none !important;
                }
                .crave-spin-wheel-result-icon {
                    animation: none !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Build Seamless Multi-Layered Physical SVG Wheel
    function buildWheel() {
        const prizes = PRIZE_PROBABILITIES;
        const totalPrizes = prizes.length;
        const segmentAngle = 360 / totalPrizes; // 40 degrees per segment
        const viewBoxSize = 400;
        const center = viewBoxSize / 2; // 200
        const segmentRadius = 180;

        // Rich metallic obsidian / warm amber gold gradient pairs for slices
        const segmentGradients = [
            { id: 'slice0', c1: '#211a14', c2: '#0d0b09' },
            { id: 'slice1', c1: '#2d1e13', c2: '#160e08' },
            { id: 'slice2', c1: '#1b1d28', c2: '#0b0c11' },
            { id: 'slice3', c1: '#302012', c2: '#181009' },
            { id: 'slice4', c1: '#161924', c2: '#090a0f' },
            { id: 'slice5', c1: '#362414', c2: '#1b110a' },
            { id: 'slice6', c1: '#1a202d', c2: '#0b0e16' },
            { id: 'slice7', c1: '#301f11', c2: '#170e07' },
            { id: 'slice8', c1: '#543e18', c2: '#30220a' } // VIP Golden
        ];

        // Generate SVG Gradient Definitions
        let svgDefsHTML = `
            <defs>
                <!-- Gold Metallic Sheen Gradient for Rim -->
                <linearGradient id="goldRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#fff0cc"/>
                    <stop offset="30%" stop-color="#e5c158"/>
                    <stop offset="55%" stop-color="#8c633a"/>
                    <stop offset="80%" stop-color="#f3d5a3"/>
                    <stop offset="100%" stop-color="#7a5228"/>
                </linearGradient>

                <!-- Coin Outer Gold Gradient -->
                <radialGradient id="coinGoldGrad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="30%" stop-color="#f3d5a3"/>
                    <stop offset="70%" stop-color="#d4a373"/>
                    <stop offset="100%" stop-color="#664624"/>
                </radialGradient>

                <!-- Coin Inner Dark Surface Gradient -->
                <radialGradient id="coinDarkGrad" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stop-color="#282a36"/>
                    <stop offset="80%" stop-color="#0f1015"/>
                    <stop offset="100%" stop-color="#050608"/>
                </radialGradient>

                <!-- Pointer Gold Gradient -->
                <linearGradient id="pointerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="35%" stop-color="#f3d5a3"/>
                    <stop offset="75%" stop-color="#d4a373"/>
                    <stop offset="100%" stop-color="#7a5228"/>
                </linearGradient>

                <radialGradient id="pointerJewelGrad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stop-color="#ff6b6b"/>
                    <stop offset="60%" stop-color="#c92a2a"/>
                    <stop offset="100%" stop-color="#721c24"/>
                </radialGradient>

                <!-- Gold Text Gradient -->
                <linearGradient id="goldTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="50%" stop-color="#f3d5a3"/>
                    <stop offset="100%" stop-color="#d4a373"/>
                </linearGradient>
        `;

        segmentGradients.forEach(g => {
            svgDefsHTML += `
                <linearGradient id="${g.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="${g.c1}"/>
                    <stop offset="100%" stop-color="${g.c2}"/>
                </linearGradient>
            `;
        });
        svgDefsHTML += `</defs>`;

        let svgSegmentsHTML = '';
        let svgElementsHTML = '';

        prizes.forEach((prize, index) => {
            // Angle calculations for top 12 o'clock alignment
            const startAngle = index * segmentAngle - 90;
            const endAngle = (index + 1) * segmentAngle - 90;
            const midAngle = startAngle + segmentAngle / 2;

            // Polar to Cartesian conversion
            const radStart = (startAngle * Math.PI) / 180;
            const radEnd = (endAngle * Math.PI) / 180;
            const radMid = (midAngle * Math.PI) / 180;

            const x1 = center + segmentRadius * Math.cos(radStart);
            const y1 = center + segmentRadius * Math.sin(radStart);
            const x2 = center + segmentRadius * Math.cos(radEnd);
            const y2 = center + segmentRadius * Math.sin(radEnd);

            const pathD = `M ${center} ${center} L ${x1} ${y1} A ${segmentRadius} ${segmentRadius} 0 0 1 ${x2} ${y2} Z`;
            const gradId = segmentGradients[index % segmentGradients.length].id;
            const isVip = prize.type === 'vip';

            svgSegmentsHTML += `
                <path d="${pathD}" 
                      fill="url(#${gradId})" 
                      stroke="${isVip ? '#ffd700' : 'rgba(212, 163, 115, 0.25)'}" 
                      stroke-width="${isVip ? '2.5' : '1.2'}" />
            `;

            // Radial placement for icons & high-impact labels
            const iconRadius = 140;
            const textRadius = 92;

            const iconX = center + iconRadius * Math.cos(radMid);
            const iconY = center + iconRadius * Math.sin(radMid);

            const textX = center + textRadius * Math.cos(radMid);
            const textY = center + textRadius * Math.sin(radMid);

            const rotationDeg = index * segmentAngle + segmentAngle / 2;

            svgElementsHTML += `
                <g transform="rotate(${rotationDeg}, ${iconX}, ${iconY})">
                    <text x="${iconX}" y="${iconY + 6}" 
                          text-anchor="middle" 
                          font-size="24" 
                          filter="drop-shadow(0 3px 6px rgba(0,0,0,0.85))">${prize.icon}</text>
                </g>
                <g transform="rotate(${rotationDeg}, ${textX}, ${textY})">
                    <text x="${textX}" y="${textY + 4}" 
                          text-anchor="middle" 
                          font-size="12" 
                          font-weight="900" 
                          fill="${isVip ? '#ffd700' : '#ffffff'}" 
                          letter-spacing="0.8"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.95))">${prize.shortLabel || prize.name}</text>
                </g>
            `;
        });

        const wheelHTML = `
            <div class="crave-spin-wheel-overlay" id="crave-spin-wheel-overlay">
                <div class="crave-spin-wheel-modal">
                    <button class="crave-spin-wheel-close" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="crave-spin-wheel-badge">
                        <i class="fas fa-crown"></i> CRAVE REWARDS
                    </div>
                    <h2 class="crave-spin-wheel-title">Spin & Win</h2>
                    <p class="crave-spin-wheel-subtitle">Take your chance and unlock a CRAVE reward.</p>
                    
                    <!-- HERO Wheel Container (85-90% width) -->
                    <div class="crave-spin-wheel-wrapper">
                        <!-- Mechanical 3D Gold Pointer at Top (12 o'clock) -->
                        <div class="crave-spin-wheel-pointer-container" id="crave-spin-pointer">
                            <svg viewBox="0 0 40 52">
                                <circle cx="20" cy="10" r="7" fill="url(#pointerGoldGrad)" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.7))" />
                                <path d="M 20 48 L 7 12 L 20 6 L 33 12 Z" fill="url(#pointerGoldGrad)" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.85))" />
                                <circle cx="20" cy="14" r="4" fill="url(#pointerJewelGrad)" />
                            </svg>
                        </div>
                        
                        <!-- Multi-Layered Circular SVG Wheel Graphic -->
                        <div class="crave-spin-wheel-svg-container" id="crave-spin-wheel">
                            <svg viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" width="100%" height="100%">
                                ${svgDefsHTML}
                                
                                <!-- Layer 1: Outer Ambient Rim Glow -->
                                <circle cx="${center}" cy="${center}" r="196" fill="none" stroke="rgba(212, 163, 115, 0.16)" stroke-width="12" />
                                
                                <!-- Layer 2: Heavy Gold Metallic Outer Rim -->
                                <circle cx="${center}" cy="${center}" r="192" fill="none" stroke="url(#goldRimGrad)" stroke-width="14" />
                                
                                <!-- Layer 3: Inner Engraved Beaded Accent Ring -->
                                <circle cx="${center}" cy="${center}" r="184" fill="none" stroke="rgba(255, 235, 180, 0.45)" stroke-width="1.5" stroke-dasharray="4 4" />
                                
                                <!-- Layer 4: Deep Obsidian Inset Groove -->
                                <circle cx="${center}" cy="${center}" r="182" fill="none" stroke="#0a0a0d" stroke-width="3" />
                                
                                <!-- Layer 5: Radial Prize Pie Segments & High-Contrast Labels -->
                                ${svgSegmentsHTML}
                                ${svgElementsHTML}
                                
                                <!-- Layer 6: Inner Hub Gold Boundary Ring -->
                                <circle cx="${center}" cy="${center}" r="54" fill="none" stroke="url(#goldRimGrad)" stroke-width="4" />
                                
                                <!-- Layer 7: 3D CRAVE Medallion Coin Hub -->
                                <circle cx="${center}" cy="${center}" r="52" fill="url(#coinGoldGrad)" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.8))" />
                                <circle cx="${center}" cy="${center}" r="44" fill="url(#coinDarkGrad)" />
                                <circle cx="${center}" cy="${center}" r="42" fill="none" stroke="rgba(212, 163, 115, 0.4)" stroke-width="1" />
                                <path d="M 200 185 L 205 192 L 212 188 L 208 198 L 192 198 L 188 188 L 195 192 Z" fill="#ffd700" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"/>
                                <text x="${center}" y="${center + 12}" text-anchor="middle" font-size="10" font-weight="900" letter-spacing="2" fill="url(#goldTextGrad)">CRAVE</text>
                            </svg>
                        </div>
                    </div>
                    
                    <p class="crave-spin-wheel-spins-left" id="crave-spin-spins-left"></p>
                    
                    <button class="crave-spin-wheel-button" id="crave-spin-button">
                        <i class="fas fa-dharmachakra"></i> SPIN THE WHEEL
                    </button>
                    
                    <!-- Celebration Victory State (Strictly Hidden Before Spin) -->
                    <div class="crave-spin-wheel-result" id="crave-spin-result" style="display: none;">
                        <span class="crave-spin-wheel-result-badge">🎉 CONGRATULATIONS!</span>
                        <div class="crave-spin-wheel-result-icon" id="crave-spin-result-icon"></div>
                        <h3 class="crave-spin-wheel-result-title" id="crave-spin-result-title"></h3>
                        <p class="crave-spin-wheel-result-text" id="crave-spin-result-text"></p>
                        <button class="crave-spin-wheel-claim-btn" id="crave-spin-claim-btn">AWESOME!</button>
                    </div>
                </div>
            </div>
        `;
        
        wheelContainer.innerHTML = wheelHTML;
        
        // Add event listeners
        const overlay = document.getElementById('crave-spin-wheel-overlay');
        const closeBtn = overlay.querySelector('.crave-spin-wheel-close');
        const spinBtn = document.getElementById('crave-spin-button');
        const claimBtn = document.getElementById('crave-spin-claim-btn');
        
        closeBtn.addEventListener('click', hideWheel);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) hideWheel();
        });
        
        spinBtn.addEventListener('click', spin);
        claimBtn.addEventListener('click', claimReward);
        
        wheel = document.getElementById('crave-spin-wheel');
    }

    // Show the wheel
    function showWheel() {
        if (!wheelContainer) init();
        
        const availableSpins = calculateAvailableSpins();
        
        if (availableSpins <= 0) {
            if (notifications) {
                notifications.show({
                    type: 'warning',
                    icon: '🔒',
                    title: 'No Spins Available',
                    message: 'Earn spins by placing orders! First order = 1 spin, Spend GH₵80 = 1 spin, Spend GH₵150 = 2 spins'
                });
            }
            return;
        }
        
        if (!wheel || !wheelContainer.querySelector('.crave-spin-wheel-overlay')) {
            buildWheel();
        }
        
        const overlay = document.getElementById('crave-spin-wheel-overlay');
        const spinBtn = document.getElementById('crave-spin-button');
        const spinsLeft = document.getElementById('crave-spin-spins-left');
        const result = document.getElementById('crave-spin-result');
        
        // STRICTLY HIDE VICTORY CARD BEFORE SPINNING
        if (result) {
            result.style.display = 'none';
            result.classList.remove('show');
        }
        
        spinBtn.disabled = false;
        
        spinsLeft.innerHTML = `<strong>${availableSpins}</strong> SPIN${availableSpins !== 1 ? 'S' : ''} AVAILABLE`;
        
        overlay.classList.add('show');
        
        // Resume audio context if suspended
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    // Hide the wheel
    function hideWheel() {
        const overlay = document.getElementById('crave-spin-wheel-overlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        isSpinning = false;
    }

    // Spin the wheel (Mathematical Alignment & Easing Preserved)
    function spin() {
        if (isSpinning) return;
        
        const availableSpins = calculateAvailableSpins();
        
        if (availableSpins <= 0) {
            hideWheel();
            return;
        }
        
        isSpinning = true;
        
        const spinBtn = document.getElementById('crave-spin-button');
        const pointer = document.getElementById('crave-spin-pointer');
        const result = document.getElementById('crave-spin-result');
        
        if (result) {
            result.style.display = 'none';
            result.classList.remove('show');
        }
        
        spinBtn.disabled = true;
        
        // Get weighted random prize (PROTECTED LOGIC)
        const prize = getWeightedPrize();
        const prizes = PRIZE_PROBABILITIES;
        const prizeIndex = prizes.findIndex(p => p.name === prize.name);
        const segmentAngle = 360 / prizes.length; // 40 deg
        
        // Calculate target rotation to land exactly under top pointer (12 o'clock)
        const targetRotation = 360 * 6 + (360 - (prizeIndex * segmentAngle) - segmentAngle / 2) + (Math.random() * 18 - 9);
        currentRotation += targetRotation;
        
        wheel.style.transform = `rotate(${currentRotation}deg)`;
        
        // Play tick sounds during spin
        let tickCount = 0;
        const tickInterval = setInterval(() => {
            tickCount++;
            playTickSound();
            if (pointer) {
                pointer.classList.add('tick');
                setTimeout(() => pointer.classList.remove('tick'), 100);
            }
            if (tickCount > 22) clearInterval(tickInterval);
        }, 220);
        
        // Vibrate on mobile
        vibrate([40, 40]);
        
        // Show result after spin completes (5.5s animation)
        setTimeout(async () => {
            clearInterval(tickInterval);
            showResult(prize);
            playWinSound();
            vibrate([100, 50, 100]);
            launchConfetti();
            
            if (notifications) {
                notifications.wheelPrize(prize);
            }
            
            // Save prize to backend / LocalStorage (PROTECTED DATA PERSISTENCE)
            await savePrizeToVault(prize);
            
            isSpinning = false;
        }, 5500);
    }

    // Save prize to reward vault (PROTECTED LOGIC - DO NOT ALTER)
    async function savePrizeToVault(prize) {
        if (!data) return;
        
        const vault = data.RewardVault.get() || [];
        const newReward = {
            id: Date.now(),
            prize: prize,
            wonAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            redeemed: false
        };
        
        vault.push(newReward);
        data.RewardVault.set(vault);
        
        // Update spin stats
        data.SpinStats.incrementTotalSpins();
        data.SpinStats.incrementTotalPrizesWon();
        data.SpinStats.setLastSpinTime(Date.now());
        data.SpinStats.addSpinHistory({ prize: prize, result: 'won' });
        
        // Add points if prize is points
        if (prize.type === 'points') {
            await data.Points.add(prize.value, { referenceId: `spin_${Date.now()}`, reason: 'Spin wheel prize' });
            data.SpinStats.addPointsWon(prize.value);
        }
        
        // Add savings if prize is coupon
        if (prize.type === 'coupon') {
            data.SpinStats.addSavings(prize.value);
        }
        
        // Emit event for other systems
        if (engine) {
            engine.emit('spin_completed', { prize: prize });
        }
    }

    // Claim reward
    function claimReward() {
        const title = document.getElementById('crave-spin-result-title');
        const prizeName = title ? title.textContent : 'Your reward';
        
        if (notifications) {
            notifications.show({
                type: 'success',
                icon: '✅',
                title: 'Reward Added!',
                message: `${prizeName} has been saved to your Reward Vault`
            });
        }
        
        hideWheel();
    }

    // Show result (Celebration victory screen revealed ONLY AFTER SPIN)
    function showResult(prize) {
        const result = document.getElementById('crave-spin-result');
        const icon = document.getElementById('crave-spin-result-icon');
        const title = document.getElementById('crave-spin-result-title');
        const text = document.getElementById('crave-spin-result-text');
        
        if (icon) icon.textContent = prize.icon;
        if (title) title.textContent = prize.name;
        if (text) {
            if (prize.type === 'points') {
                text.textContent = `+${prize.value} CRAVE Points have been added to your spendable balance!`;
            } else if (prize.type === 'coupon') {
                text.textContent = `A GHC${prize.value} discount voucher has been saved to your Reward Vault!`;
            } else {
                text.textContent = `Your ${prize.name} voucher has been saved to your Reward Vault!`;
            }
        }
        
        if (result) {
            result.style.display = 'block';
            result.classList.add('show');
        }
    }

    // Public API (PROTECTED INTERFACES)
    return {
        init,
        show: showWheel,
        hide: hideWheel,
        spin,
        getAvailableSpins: calculateAvailableSpins,
        getStats: function() {
            if (!data) return null;
            return {
                totalSpins: data.SpinStats.getTotalSpins(),
                totalPrizes: data.SpinStats.getTotalPrizesWon(),
                totalPoints: data.SpinStats.getTotalPointsWon(),
                totalSavings: data.SpinStats.getTotalSavings(),
                history: data.SpinStats.getSpinHistory()
            };
        }
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveSpinWheel;
}

