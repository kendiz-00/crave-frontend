/**
 * CRAVE Rewards Notification System
 * Premium glassmorphism notifications with sound and vibration
 */

const CraveRewardsNotifications = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    
    // Notification container
    let container = null;
    let notificationQueue = [];
    let isShowing = false;

    // Initialize notification container
    function initContainer() {
        if (container) return;
        
        container = document.createElement('div');
        container.id = 'crave-rewards-notifications';
        container.className = 'crave-rewards-notifications';
        document.body.appendChild(container);
        
        // Add styles
        addStyles();
    }

    // Add notification styles
    function addStyles() {
        if (document.getElementById('crave-rewards-notifications-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'crave-rewards-notifications-styles';
        style.textContent = `
            .crave-rewards-notifications {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10001;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            }

            .crave-rewards-notification {
                position: relative;
                min-width: 320px;
                max-width: 400px;
                background: rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(212, 163, 115, 0.3);
                border-radius: 16px;
                padding: 20px;
                box-shadow: 
                    0 10px 40px rgba(0, 0, 0, 0.3),
                    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                    0 0 60px rgba(212, 163, 115, 0.1);
                pointer-events: auto;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            }

            .crave-rewards-notification.show {
                opacity: 1;
                transform: translateX(0);
            }

            .crave-rewards-notification.hide {
                opacity: 0;
                transform: translateX(100%);
            }

            .crave-rewards-notification::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, rgba(212, 163, 115, 0.8), transparent);
            }

            .crave-rewards-notification-content {
                display: flex;
                align-items: flex-start;
                gap: 16px;
            }

            .crave-rewards-notification-icon {
                width: 48px;
                height: 48px;
                min-width: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(212, 163, 115, 0.15);
                border: 1px solid rgba(212, 163, 115, 0.3);
                border-radius: 12px;
                font-size: 24px;
            }

            .crave-rewards-notification-text {
                flex: 1;
                min-width: 0;
            }

            .crave-rewards-notification-title {
                font-size: 15px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 6px;
                letter-spacing: 0.5px;
            }

            .crave-rewards-notification-message {
                font-size: 13px;
                color: #aaaaaa;
                line-height: 1.5;
                font-weight: 300;
            }

            .crave-rewards-notification-close {
                position: absolute;
                top: 12px;
                right: 12px;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                color: #888888;
                font-size: 16px;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s ease;
            }

            .crave-rewards-notification-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }

            .crave-rewards-notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(90deg, #d4a373, #c49a6c);
                width: 100%;
                transform-origin: left;
            }

            .crave-rewards-notification-progress.animate {
                animation: notification-progress 4s linear forwards;
            }

            @keyframes notification-progress {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }

            /* Notification Types */
            .crave-rewards-notification.success {
                border-color: rgba(76, 175, 80, 0.4);
            }

            .crave-rewards-notification.success .crave-rewards-notification-icon {
                background: rgba(76, 175, 80, 0.15);
                border-color: rgba(76, 175, 80, 0.3);
            }

            .crave-rewards-notification.error {
                border-color: rgba(244, 67, 54, 0.4);
            }

            .crave-rewards-notification.error .crave-rewards-notification-icon {
                background: rgba(244, 67, 54, 0.15);
                border-color: rgba(244, 67, 54, 0.3);
            }

            .crave-rewards-notification.warning {
                border-color: rgba(255, 152, 0, 0.4);
            }

            .crave-rewards-notification.warning .crave-rewards-notification-icon {
                background: rgba(255, 152, 0, 0.15);
                border-color: rgba(255, 152, 0, 0.3);
            }

            .crave-rewards-notification.info {
                border-color: rgba(33, 150, 243, 0.4);
            }

            .crave-rewards-notification.info .crave-rewards-notification-icon {
                background: rgba(33, 150, 243, 0.15);
                border-color: rgba(33, 150, 243, 0.3);
            }

            .crave-rewards-notification.reward {
                border-color: rgba(212, 163, 115, 0.5);
            }

            .crave-rewards-notification.reward .crave-rewards-notification-icon {
                background: rgba(212, 163, 115, 0.2);
                border-color: rgba(212, 163, 115, 0.4);
            }

            /* Confetti Animation */
            .crave-rewards-confetti {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 10002;
                overflow: hidden;
            }

            .crave-rewards-confetti-piece {
                position: absolute;
                width: 10px;
                height: 10px;
                background: #d4a373;
                animation: confetti-fall 3s ease-out forwards;
            }

            @keyframes confetti-fall {
                0% {
                    transform: translateY(-100vh) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .crave-rewards-notifications {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                }

                .crave-rewards-notification {
                    min-width: auto;
                    max-width: none;
                }
            }

            /* Reduced Motion */
            @media (prefers-reduced-motion: reduce) {
                .crave-rewards-notification,
                .crave-rewards-notification-progress,
                .crave-rewards-confetti-piece {
                    animation: none !important;
                    transition: none !important;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Play notification sound
    function playSound(type = 'default') {
        if (!config || !config.notifications.sound) return;
        
        // Create audio context for premium sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different sounds for different types
            switch (type) {
                case 'success':
                    oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
                    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1); // A5
                    break;
                case 'reward':
                    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
                    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
                    break;
                case 'error':
                    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                    break;
                default:
                    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
            }
            
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // Audio not supported
        }
    }

    // Vibrate device
    function vibrate(pattern = [100]) {
        if (!config || !config.notifications.vibration) return;
        
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    // Show confetti
    function showConfetti() {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'crave-rewards-confetti';
        document.body.appendChild(confettiContainer);
        
        const colors = ['#d4a373', '#c49a6c', '#b8895e', '#ffffff', '#ffd700'];
        
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'crave-rewards-confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.animationDuration = (2 + Math.random() * 2) + 's';
            confettiContainer.appendChild(piece);
        }
        
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }

    // Create notification element
    function createNotification(options) {
        const notification = document.createElement('div');
        notification.className = `crave-rewards-notification ${options.type || 'info'}`;
        
        const icon = options.icon || '✨';
        const title = options.title || 'Notification';
        const message = options.message || '';
        const duration = options.duration !== undefined ? options.duration : (config ? config.notifications.duration : 4000);
        
        notification.innerHTML = `
            <button class="crave-rewards-notification-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
            <div class="crave-rewards-notification-content">
                <div class="crave-rewards-notification-icon">${icon}</div>
                <div class="crave-rewards-notification-text">
                    <div class="crave-rewards-notification-title">${title}</div>
                    <div class="crave-rewards-notification-message">${message}</div>
                </div>
            </div>
            <div class="crave-rewards-notification-progress"></div>
        `;
        
        // Close button handler
        const closeBtn = notification.querySelector('.crave-rewards-notification-close');
        closeBtn.addEventListener('click', () => {
            hideNotification(notification);
        });
        
        // Auto-hide
        if (duration > 0) {
            const progress = notification.querySelector('.crave-rewards-notification-progress');
            progress.classList.add('animate');
            
            setTimeout(() => {
                hideNotification(notification);
            }, duration);
        }
        
        return notification;
    }

    // Show notification
    function showNotification(options) {
        initContainer();
        
        const notification = createNotification(options);
        container.appendChild(notification);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Play sound and vibrate
        playSound(options.type);
        if (options.type === 'reward' || options.type === 'success') {
            vibrate([50, 50, 50]);
        } else {
            vibrate([50]);
        }
        
        // Show confetti for rewards
        if (options.confetti) {
            showConfetti();
        }
        
        return notification;
    }

    // Hide notification
    function hideNotification(notification) {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 400);
    }

    // Queue notification
    function queueNotification(options) {
        notificationQueue.push(options);
        processQueue();
    }

    // Process notification queue
    function processQueue() {
        if (isShowing || notificationQueue.length === 0) return;
        
        isShowing = true;
        const options = notificationQueue.shift();
        
        const notification = showNotification(options);
        
        notification.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'transform' && !notification.classList.contains('show')) {
                isShowing = false;
                processQueue();
            }
        });
    }

    // Predefined notification types
    const notifications = {
        pointsEarned: function(points) {
            return {
                type: 'success',
                icon: '⭐',
                title: 'Points Earned!',
                message: `You've earned ${points} Crave Points!`,
                confetti: points >= 50
            };
        },

        tierUpgraded: function(from, to) {
            return {
                type: 'reward',
                icon: '🎉',
                title: 'Tier Upgraded!',
                message: `Congratulations! You've been upgraded from ${from} to ${to}!`,
                confetti: true
            };
        },

        achievementUnlocked: function(achievement) {
            return {
                type: 'reward',
                icon: achievement.icon || '🏆',
                title: 'Achievement Unlocked!',
                message: achievement.name || 'New achievement unlocked!',
                confetti: true
            };
        },

        rewardRedeemed: function(reward) {
            return {
                type: 'success',
                icon: '🎁',
                title: 'Reward Redeemed!',
                message: reward.description || 'Your reward has been redeemed!'
            };
        },

        promoCodeApplied: function(code, discount) {
            return {
                type: 'success',
                icon: '🏷️',
                title: 'Promo Code Applied!',
                message: `Code ${code} applied. You saved GHS ${discount.toFixed(2)}!`
            };
        },

        promoCodeInvalid: function(message) {
            return {
                type: 'error',
                icon: '❌',
                title: 'Invalid Promo Code',
                message: message || 'This promo code is not valid.'
            };
        },

        dailyRewardClaimed: function(streak, reward) {
            return {
                type: 'reward',
                icon: '📅',
                title: 'Daily Reward!',
                message: `Day ${streak} streak claimed! ${reward ? 'Reward: ' + reward : ''}`,
                confetti: streak % 7 === 0
            };
        },

        referralCompleted: function(bonus) {
            return {
                type: 'reward',
                icon: '🤝',
                title: 'Referral Completed!',
                message: `You've earned GHS ${bonus} credit from your referral!`,
                confetti: true
            };
        },

        birthdayReward: function() {
            return {
                type: 'reward',
                icon: '🎂',
                title: 'Happy Birthday!',
                message: 'Enjoy a FREE Dessert with your next order!',
                confetti: true
            };
        },

        surpriseReward: function(reward) {
            return {
                type: 'reward',
                icon: reward.icon || '🎁',
                title: 'Surprise Reward!',
                message: reward.description || 'A special reward just for you!',
                confetti: true
            };
        },

        vipActivated: function() {
            return {
                type: 'reward',
                icon: '👑',
                title: 'VIP Activated!',
                message: 'Welcome to CRAVE VIP! Enjoy exclusive benefits.',
                confetti: true
            };
        },

        wheelPrize: function(prize) {
            return {
                type: 'reward',
                icon: prize.icon || '🎡',
                title: 'You Won!',
                message: prize.name || 'Congratulations on your prize!',
                confetti: true
            };
        },

        flashDealAvailable: function(deal) {
            return {
                type: 'info',
                icon: '⚡',
                title: 'Flash Deal Available!',
                message: deal.description || 'Limited time offer!'
            };
        },

        comboAvailable: function(combo) {
            return {
                type: 'info',
                icon: '🍔',
                title: 'Complete Your Meal',
                message: combo.description || 'Add items to save more!'
            };
        },

        orderPlaced: function(points, tier) {
            return {
                type: 'success',
                icon: '✅',
                title: 'Order Placed!',
                message: `You earned ${points} points. Current tier: ${tier}.`
            };
        }
    };

    // Public API
    return {
        show: showNotification,
        queue: queueNotification,
        
        // Predefined notifications
        pointsEarned: (points) => showNotification(notifications.pointsEarned(points)),
        tierUpgraded: (from, to) => showNotification(notifications.tierUpgraded(from, to)),
        achievementUnlocked: (achievement) => showNotification(notifications.achievementUnlocked(achievement)),
        rewardRedeemed: (reward) => showNotification(notifications.rewardRedeemed(reward)),
        promoCodeApplied: (code, discount) => showNotification(notifications.promoCodeApplied(code, discount)),
        promoCodeInvalid: (message) => showNotification(notifications.promoCodeInvalid(message)),
        dailyRewardClaimed: (streak, reward) => showNotification(notifications.dailyRewardClaimed(streak, reward)),
        referralCompleted: (bonus) => showNotification(notifications.referralCompleted(bonus)),
        birthdayReward: () => showNotification(notifications.birthdayReward()),
        surpriseReward: (reward) => showNotification(notifications.surpriseReward(reward)),
        vipActivated: () => showNotification(notifications.vipActivated()),
        wheelPrize: (prize) => showNotification(notifications.wheelPrize(prize)),
        flashDealAvailable: (deal) => showNotification(notifications.flashDealAvailable(deal)),
        comboAvailable: (combo) => showNotification(notifications.comboAvailable(combo)),
        orderPlaced: (points, tier) => showNotification(notifications.orderPlaced(points, tier)),
        
        // Utility
        hideAll: function() {
            if (container) {
                const notifications = container.querySelectorAll('.crave-rewards-notification');
                notifications.forEach(n => hideNotification(n));
            }
        }
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveRewardsNotifications;
}
