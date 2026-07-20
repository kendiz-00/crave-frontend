/**
 * CRAVE Premium Spin & Win Wheel
 * Production-quality engagement system with physics, sounds, confetti, and full integration
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

    // Weighted prize probabilities
    const PRIZE_PROBABILITIES = [
        { name: '5 Points', icon: '⭐', probability: 0.40, type: 'points', value: 5 },
        { name: '10 Points', icon: '🌟', probability: 0.25, type: 'points', value: 10 },
        { name: '20 Points', icon: '💫', probability: 0.15, type: 'points', value: 20 },
        { name: 'Free Drink', icon: '🥤', probability: 0.08, type: 'reward', value: 'drink' },
        { name: 'Free Fries', icon: '🍟', probability: 0.05, type: 'reward', value: 'fries' },
        { name: 'Free Dessert', icon: '🍰', probability: 0.03, type: 'reward', value: 'dessert' },
        { name: 'GH₵20 Coupon', icon: '🎟️', probability: 0.02, type: 'coupon', value: 20 },
        { name: 'Premium Combo', icon: '🍔', probability: 0.015, type: 'reward', value: 'combo' },
        { name: 'VIP Golden Reward', icon: '👑', probability: 0.005, type: 'vip', value: 'golden' }
    ];

    // Spin economy rules
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
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    // Play win sound
    function playWinSound() {
        if (!audioContext) return;
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 523.25;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // Vibrate device (mobile)
    function vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
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
            z-index: 10004;
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
        
        const colors = ['#d4a373', '#c49a6c', '#ffd700', '#ff6b6b', '#4ecdc4'];
        
        for (let i = 0; i < 150; i++) {
            confettiParticles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20 - 10,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 10 + 5,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.5,
                drag: 0.99
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

    // Get weighted random prize
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

    // Calculate available spins
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

    // Add wheel styles
    function addWheelStyles() {
        if (document.getElementById('crave-spin-wheel-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'crave-spin-wheel-styles';
        style.textContent = `
            .crave-spin-wheel-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                z-index: 10003;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.4s ease;
            }

            .crave-spin-wheel-overlay.show {
                opacity: 1;
                pointer-events: auto;
            }

            .crave-spin-wheel-modal {
                position: relative;
                background: linear-gradient(135deg, rgba(20, 20, 20, 0.98), rgba(30, 30, 30, 0.98));
                border: 2px solid rgba(212, 163, 115, 0.4);
                border-radius: 32px;
                padding: 48px;
                max-width: 600px;
                width: 95%;
                text-align: center;
                box-shadow: 
                    0 30px 60px rgba(0, 0, 0, 0.6),
                    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                    0 0 150px rgba(212, 163, 115, 0.15);
            }

            .crave-spin-wheel-close {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #888888;
                font-size: 20px;
                cursor: pointer;
                border-radius: 12px;
                transition: all 0.3s ease;
            }

            .crave-spin-wheel-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                transform: rotate(90deg);
            }

            .crave-spin-wheel-title {
                font-size: 36px;
                font-weight: 700;
                color: #d4a373;
                margin-bottom: 8px;
                letter-spacing: 2px;
                text-shadow: 0 2px 20px rgba(212, 163, 115, 0.3);
            }

            .crave-spin-wheel-subtitle {
                font-size: 16px;
                color: #aaaaaa;
                margin-bottom: 40px;
            }

            .crave-spin-wheel-wrapper {
                position: relative;
                width: 380px;
                height: 380px;
                margin: 0 auto 40px;
            }

            .crave-spin-wheel {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                position: relative;
                transition: transform 6s cubic-bezier(0.17, 0.67, 0.12, 0.99);
                box-shadow: 
                    0 0 0 12px rgba(212, 163, 115, 0.4),
                    0 0 0 16px rgba(212, 163, 115, 0.15),
                    0 30px 60px rgba(0, 0, 0, 0.5),
                    inset 0 0 80px rgba(212, 163, 115, 0.15);
            }

            .crave-spin-wheel-segment {
                position: absolute;
                width: 50%;
                height: 50%;
                transform-origin: 100% 100%;
                left: 0;
                top: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                clip-path: polygon(0 0, 100% 0, 100% 100%);
            }

            .crave-spin-wheel-segment-content {
                position: absolute;
                transform: rotate(45deg) translate(50%, -50%);
                text-align: center;
                font-size: 13px;
                color: #ffffff;
                font-weight: 700;
                line-height: 1.3;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }

            .crave-spin-wheel-segment-icon {
                font-size: 28px;
                display: block;
                margin-bottom: 6px;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            }

            .crave-spin-wheel-pointer {
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 25px solid transparent;
                border-right: 25px solid transparent;
                border-top: 50px solid #d4a373;
                filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.4));
                z-index: 10;
            }

            .crave-spin-wheel-center {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #d4a373, #c49a6c);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
                box-shadow: 
                    0 8px 20px rgba(0, 0, 0, 0.4),
                    inset 0 4px 8px rgba(255, 255, 255, 0.3);
                z-index: 5;
                animation: pulse-glow 2s ease-in-out infinite;
            }

            @keyframes pulse-glow {
                0%, 100% { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 4px 8px rgba(255, 255, 255, 0.3), 0 0 30px rgba(212, 163, 115, 0.3); }
                50% { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 4px 8px rgba(255, 255, 255, 0.3), 0 0 50px rgba(212, 163, 115, 0.5); }
            }

            .crave-spin-wheel-button {
                background: linear-gradient(135deg, #d4a373, #c49a6c);
                color: #ffffff;
                border: none;
                padding: 18px 56px;
                font-size: 20px;
                font-weight: 700;
                border-radius: 60px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 
                    0 10px 30px rgba(212, 163, 115, 0.4),
                    inset 0 2px 4px rgba(255, 255, 255, 0.3);
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .crave-spin-wheel-button:hover:not(:disabled) {
                transform: translateY(-3px);
                box-shadow: 
                    0 15px 40px rgba(212, 163, 115, 0.5),
                    inset 0 2px 4px rgba(255, 255, 255, 0.3);
            }

            .crave-spin-wheel-button:active:not(:disabled) {
                transform: translateY(-1px);
            }

            .crave-spin-wheel-button:disabled {
                opacity: 0.4;
                cursor: not-allowed;
                background: rgba(255, 255, 255, 0.1);
            }

            .crave-spin-wheel-spins-left {
                margin-top: 20px;
                font-size: 15px;
                color: #888888;
                font-weight: 500;
            }

            .crave-spin-wheel-spins-left strong {
                color: #d4a373;
            }

            .crave-spin-wheel-result {
                display: none;
                margin-top: 32px;
                padding: 24px;
                background: linear-gradient(135deg, rgba(212, 163, 115, 0.15), rgba(196, 154, 108, 0.1));
                border: 2px solid rgba(212, 163, 115, 0.4);
                border-radius: 20px;
            }

            .crave-spin-wheel-result.show {
                display: block;
                animation: result-appear 0.6s cubic-bezier(0.22, 1, 0.36, 1);
            }

            @keyframes result-appear {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .crave-spin-wheel-result-icon {
                font-size: 64px;
                margin-bottom: 16px;
                animation: bounce-in 0.6s cubic-bezier(0.22, 1, 0.36, 1);
            }

            @keyframes bounce-in {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }

            .crave-spin-wheel-result-title {
                font-size: 24px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 8px;
            }

            .crave-spin-wheel-result-text {
                font-size: 16px;
                color: #aaaaaa;
            }

            .crave-spin-wheel-claim-btn {
                margin-top: 16px;
                background: linear-gradient(135deg, #d4a373, #c49a6c);
                color: #ffffff;
                border: none;
                padding: 12px 32px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 50px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .crave-spin-wheel-claim-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(212, 163, 115, 0.4);
            }

            /* Responsive */
            @media (max-width: 768px) {
                .crave-spin-wheel-modal {
                    padding: 32px 24px;
                    max-width: 95%;
                    border-radius: 24px;
                }

                .crave-spin-wheel-wrapper {
                    width: 300px;
                    height: 300px;
                }

                .crave-spin-wheel-title {
                    font-size: 28px;
                }

                .crave-spin-wheel-subtitle {
                    font-size: 14px;
                }

                .crave-spin-wheel-button {
                    padding: 16px 40px;
                    font-size: 18px;
                }
            }

            /* Reduced Motion */
            @media (prefers-reduced-motion: reduce) {
                .crave-spin-wheel {
                    transition: none;
                }
                
                .crave-spin-wheel-center,
                .crave-spin-wheel-result-icon {
                    animation: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Build the wheel
    function buildWheel() {
        const prizes = PRIZE_PROBABILITIES;
        const segmentAngle = 360 / prizes.length;
        
        const wheelHTML = `
            <div class="crave-spin-wheel-overlay" id="crave-spin-wheel-overlay">
                <div class="crave-spin-wheel-modal">
                    <button class="crave-spin-wheel-close" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                    <h2 class="crave-spin-wheel-title">Spin & Win</h2>
                    <p class="crave-spin-wheel-subtitle">Try your luck and win amazing prizes!</p>
                    
                    <div class="crave-spin-wheel-wrapper">
                        <div class="crave-spin-wheel-pointer"></div>
                        <div class="crave-spin-wheel" id="crave-spin-wheel">
                            ${prizes.map((prize, index) => {
                                const rotation = index * segmentAngle;
                                const colors = [
                                    'rgba(212, 163, 115, 0.9)',
                                    'rgba(196, 154, 108, 0.9)',
                                    'rgba(184, 137, 94, 0.9)',
                                    'rgba(168, 120, 75, 0.9)',
                                    'rgba(212, 175, 115, 0.85)',
                                    'rgba(180, 140, 90, 0.9)'
                                ];
                                const color = colors[index % colors.length];
                                
                                return `
                                    <div class="crave-spin-wheel-segment" style="transform: rotate(${rotation}deg); background: ${color};">
                                        <div class="crave-spin-wheel-segment-content">
                                            <span class="crave-spin-wheel-segment-icon">${prize.icon}</span>
                                            <span>${prize.name}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        <div class="crave-spin-wheel-center">🎡</div>
                    </div>
                    
                    <button class="crave-spin-wheel-button" id="crave-spin-button">Spin Now!</button>
                    <p class="crave-spin-wheel-spins-left" id="crave-spin-spins-left"></p>
                    
                    <div class="crave-spin-wheel-result" id="crave-spin-result">
                        <div class="crave-spin-wheel-result-icon" id="crave-spin-result-icon"></div>
                        <h3 class="crave-spin-wheel-result-title" id="crave-spin-result-title"></h3>
                        <p class="crave-spin-wheel-result-text" id="crave-spin-result-text"></p>
                        <button class="crave-spin-wheel-claim-btn" id="crave-spin-claim-btn">Claim Reward</button>
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
        
        result.classList.remove('show');
        spinBtn.disabled = false;
        
        spinsLeft.innerHTML = `<strong>${availableSpins}</strong> spin${availableSpins !== 1 ? 's' : ''} available`;
        
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

    // Spin the wheel
    function spin() {
        if (isSpinning) return;
        
        const availableSpins = calculateAvailableSpins();
        
        if (availableSpins <= 0) {
            hideWheel();
            return;
        }
        
        isSpinning = true;
        
        const spinBtn = document.getElementById('crave-spin-button');
        spinBtn.disabled = true;
        
        // Get weighted random prize
        const prize = getWeightedPrize();
        const prizes = PRIZE_PROBABILITIES;
        const prizeIndex = prizes.findIndex(p => p.name === prize.name);
        const segmentAngle = 360 / prizes.length;
        
        // Calculate rotation with realistic physics
        const targetRotation = 360 * 6 + (360 - (prizeIndex * segmentAngle) - segmentAngle / 2) + (Math.random() * 20 - 10);
        currentRotation += targetRotation;
        
        wheel.style.transform = `rotate(${currentRotation}deg)`;
        
        // Play tick sounds during spin
        let tickCount = 0;
        const tickInterval = setInterval(() => {
            tickCount++;
            playTickSound();
            if (tickCount > 20) clearInterval(tickInterval);
        }, 200);
        
        // Vibrate on mobile
        vibrate([50, 50, 50]);
        
        // Show result after spin
        setTimeout(() => {
            clearInterval(tickInterval);
            showResult(prize);
            playWinSound();
            vibrate([100, 50, 100]);
            launchConfetti();
            
            if (notifications) {
                notifications.wheelPrize(prize);
            }
            
            // Save prize to LocalStorage
            savePrizeToVault(prize);
            
            isSpinning = false;
        }, 6000);
    }

    // Save prize to reward vault
    function savePrizeToVault(prize) {
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
            data.Points.add(prize.value);
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
        const result = document.getElementById('crave-spin-result');
        const icon = document.getElementById('crave-spin-result-icon');
        const title = document.getElementById('crave-spin-result-title');
        const text = document.getElementById('crave-spin-result-text');
        
        const prizeName = title.textContent;
        
        if (notifications) {
            notifications.show({
                type: 'success',
                icon: '✅',
                title: 'Reward Claimed!',
                message: `${prizeName} has been added to your Reward Vault`
            });
        }
        
        hideWheel();
    }

    // Show result
    function showResult(prize) {
        const result = document.getElementById('crave-spin-result');
        const icon = document.getElementById('crave-spin-result-icon');
        const title = document.getElementById('crave-spin-result-title');
        const text = document.getElementById('crave-spin-result-text');
        
        icon.textContent = prize.icon;
        title.textContent = 'You Won!';
        text.textContent = prize.name;
        
        result.classList.add('show');
    }

    // Public API
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
