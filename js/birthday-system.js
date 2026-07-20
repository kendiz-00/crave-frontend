/**
 * CRAVE Birthday System
 * Birthday rewards and celebration system
 */

const CraveBirthdaySystem = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const data = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData : null;
    const engine = typeof CraveRewardsEngine !== 'undefined' ? CraveRewardsEngine : null;
    const notifications = typeof CraveRewardsNotifications !== 'undefined' ? CraveRewardsNotifications : null;

    // Set user birthday
    function setBirthday(birthdayDate) {
        if (!data) return { success: false, message: 'System not available' };
        
        try {
            const date = new Date(birthdayDate);
            if (isNaN(date.getTime())) {
                return { success: false, message: 'Invalid date' };
            }
            
            data.Birthday.set(birthdayDate);
            
            return {
                success: true,
                message: 'Birthday saved successfully!'
            };
        } catch (e) {
            return { success: false, message: 'Error saving birthday' };
        }
    }

    // Get user birthday
    function getBirthday() {
        if (!data) return null;
        
        return data.Birthday.get();
    }

    // Check if today is user's birthday
    function isBirthdayToday() {
        const birthday = getBirthday();
        if (!birthday) return false;
        
        const today = new Date();
        const birthdayDate = new Date(birthday);
        
        return today.getDate() === birthdayDate.getDate() &&
               today.getMonth() === birthdayDate.getMonth();
    }

    // Check if birthday reward is available
    function isBirthdayRewardAvailable() {
        if (!data) return false;
        
        const birthday = getBirthday();
        if (!birthday) return false;
        
        // Check if reward already claimed this year
        const lastClaimed = data.Birthday.getLastClaimed();
        if (lastClaimed) {
            const lastClaimedDate = new Date(lastClaimed);
            const currentYear = new Date().getFullYear();
            
            if (lastClaimedDate.getFullYear() === currentYear) {
                return false;
            }
        }
        
        return isBirthdayToday();
    }

    // Claim birthday reward
    function claimBirthdayReward() {
        if (!engine) return { success: false, message: 'System not available' };
        
        const result = engine.claimBirthdayReward();
        
        if (result.success && notifications) {
            notifications.birthdayReward();
        }
        
        return result;
    }

    // Get days until birthday
    function getDaysUntilBirthday() {
        const birthday = getBirthday();
        if (!birthday) return null;
        
        const today = new Date();
        const birthdayDate = new Date(birthday);
        birthdayDate.setFullYear(today.getFullYear());
        
        if (birthdayDate < today) {
            birthdayDate.setFullYear(today.getFullYear() + 1);
        }
        
        const diffTime = birthdayDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // Show birthday settings modal
    function showBirthdaySettings() {
        const birthday = getBirthday();
        const modalHTML = `
            <div class="crave-birthday-modal" id="craveBirthdayModal">
                <div class="crave-birthday-overlay"></div>
                <div class="crave-birthday-content">
                    <button class="crave-birthday-close" id="closeBirthdayModal">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="crave-birthday-header">
                        <div class="crave-birthday-icon">🎂</div>
                        <h2>Birthday Rewards</h2>
                        <p>Get a FREE dessert on your birthday!</p>
                    </div>
                    
                    <div class="crave-birthday-form">
                        <label for="birthdayInput">Your Birthday</label>
                        <input type="date" id="birthdayInput" value="${birthday || ''}" class="crave-birthday-input">
                        <button class="crave-birthday-save-btn" id="saveBirthdayBtn">Save Birthday</button>
                    </div>
                    
                    <div class="crave-birthday-info" id="birthdayInfo">
                        <!-- Birthday info will be loaded dynamically -->
                    </div>
                    
                    <div class="crave-birthday-reward-section" id="birthdayRewardSection">
                        <!-- Reward section will be loaded dynamically -->
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        const existingModal = document.getElementById('craveBirthdayModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        addBirthdayModalStyles();
        loadBirthdayInfo();
        setupBirthdayModalListeners();
    }

    // Load birthday info
    function loadBirthdayInfo() {
        const infoSection = document.getElementById('birthdayInfo');
        const rewardSection = document.getElementById('birthdayRewardSection');
        
        const birthday = getBirthday();
        
        if (birthday) {
            const daysUntil = getDaysUntilBirthday();
            
            if (daysUntil === 0) {
                infoSection.innerHTML = `
                    <div class="crave-birthday-today">
                        <span class="crave-birthday-today-icon">🎉</span>
                        <span class="crave-birthday-today-text">Happy Birthday!</span>
                    </div>
                `;
                
                if (isBirthdayRewardAvailable()) {
                    rewardSection.innerHTML = `
                        <button class="crave-birthday-claim-btn" id="claimBirthdayBtn">
                            <i class="fas fa-gift"></i> Claim Your Free Dessert
                        </button>
                    `;
                } else {
                    rewardSection.innerHTML = `
                        <div class="crave-birthday-claimed">
                            <i class="fas fa-check-circle"></i>
                            <span>Birthday reward claimed this year</span>
                        </div>
                    `;
                }
            } else {
                infoSection.innerHTML = `
                    <div class="crave-birthday-countdown">
                        <span class="crave-birthday-countdown-icon">📅</span>
                        <span class="crave-birthday-countdown-text">${daysUntil} days until your birthday</span>
                    </div>
                `;
                rewardSection.innerHTML = '';
            }
        } else {
            infoSection.innerHTML = `
                <div class="crave-birthday-prompt">
                    <span class="crave-birthday-prompt-icon">💝</span>
                    <span class="crave-birthday-prompt-text">Set your birthday to get exclusive rewards!</span>
                </div>
            `;
            rewardSection.innerHTML = '';
        }
    }

    // Add modal styles
    function addBirthdayModalStyles() {
        if (document.getElementById('crave-birthday-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'crave-birthday-modal-styles';
        style.textContent = `
            .crave-birthday-modal {
                position: fixed;
                inset: 0;
                z-index: 10008;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .crave-birthday-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            .crave-birthday-content {
                position: relative;
                background: rgba(20, 20, 20, 0.95);
                border: 1px solid rgba(212, 163, 115, 0.3);
                border-radius: 24px;
                padding: 40px;
                max-width: 450px;
                width: 90%;
            }

            .crave-birthday-close {
                position: absolute;
                top: 16px;
                right: 16px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                color: #888888;
                font-size: 20px;
                cursor: pointer;
                border-radius: 12px;
                transition: all 0.2s ease;
            }

            .crave-birthday-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }

            .crave-birthday-header {
                text-align: center;
                margin-bottom: 32px;
            }

            .crave-birthday-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }

            .crave-birthday-header h2 {
                font-family: 'Playfair Display', serif;
                font-size: 28px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 8px;
            }

            .crave-birthday-header p {
                color: #aaaaaa;
                font-size: 14px;
            }

            .crave-birthday-form {
                margin-bottom: 24px;
            }

            .crave-birthday-form label {
                display: block;
                color: #ffffff;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
            }

            .crave-birthday-input {
                width: 100%;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #ffffff;
                font-size: 14px;
                margin-bottom: 16px;
            }

            .crave-birthday-input:focus {
                outline: none;
                border-color: rgba(212, 163, 115, 0.5);
            }

            .crave-birthday-save-btn {
                width: 100%;
                padding: 12px 24px;
                background: linear-gradient(135deg, #d4a373, #c49a6c);
                color: #ffffff;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .crave-birthday-save-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(212, 163, 115, 0.3);
            }

            .crave-birthday-info {
                padding: 16px;
                background: rgba(212, 163, 115, 0.1);
                border-radius: 12px;
                margin-bottom: 24px;
                text-align: center;
            }

            .crave-birthday-today,
            .crave-birthday-countdown,
            .crave-birthday-prompt {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }

            .crave-birthday-today-icon,
            .crave-birthday-countdown-icon,
            .crave-birthday-prompt-icon {
                font-size: 24px;
            }

            .crave-birthday-today-text {
                color: #d4a373;
                font-size: 16px;
                font-weight: 700;
            }

            .crave-birthday-countdown-text,
            .crave-birthday-prompt-text {
                color: #ffffff;
                font-size: 14px;
            }

            .crave-birthday-reward-section {
                text-align: center;
            }

            .crave-birthday-claim-btn {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 16px 32px;
                background: linear-gradient(135deg, #d4a373, #c49a6c);
                color: #ffffff;
                border: none;
                border-radius: 50px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .crave-birthday-claim-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(212, 163, 115, 0.4);
            }

            .crave-birthday-claimed {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                color: #4CAF50;
                font-size: 14px;
            }

            @media (max-width: 768px) {
                .crave-birthday-content {
                    padding: 24px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Setup modal listeners
    function setupBirthdayModalListeners() {
        const modal = document.getElementById('craveBirthdayModal');
        const closeBtn = document.getElementById('closeBirthdayModal');
        const saveBtn = document.getElementById('saveBirthdayBtn');
        const birthdayInput = document.getElementById('birthdayInput');
        const claimBtn = document.getElementById('claimBirthdayBtn');
        
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.crave-birthday-overlay').addEventListener('click', () => {
            modal.remove();
        });
        
        saveBtn.addEventListener('click', () => {
            const result = setBirthday(birthdayInput.value);
            
            if (result.success) {
                if (notifications) {
                    notifications.show({
                        type: 'success',
                        icon: '🎂',
                        title: 'Birthday Saved!',
                        message: result.message
                    });
                }
                loadBirthdayInfo();
            } else {
                if (notifications) {
                    notifications.show({
                        type: 'error',
                        icon: '❌',
                        title: 'Error',
                        message: result.message
                    });
                }
            }
        });
        
        if (claimBtn) {
            claimBtn.addEventListener('click', () => {
                const result = claimBirthdayReward();
                
                if (result.success) {
                    loadBirthdayInfo();
                } else {
                    if (notifications) {
                        notifications.show({
                            type: 'error',
                            icon: '❌',
                            title: 'Cannot Claim',
                            message: result.message
                        });
                    }
                }
            });
        }
    }

    // Check for birthday on page load
    function checkBirthdayOnLoad() {
        if (isBirthdayToday() && isBirthdayRewardAvailable()) {
            setTimeout(() => {
                if (notifications) {
                    notifications.show({
                        type: 'reward',
                        icon: '🎂',
                        title: 'Happy Birthday!',
                        message: 'Claim your free dessert reward!',
                        confetti: true
                    });
                }
            }, 3000);
        }
    }

    // Public API
    return {
        set: setBirthday,
        get: getBirthday,
        isToday: isBirthdayToday,
        isRewardAvailable: isBirthdayRewardAvailable,
        claim: claimBirthdayReward,
        getDaysUntil: getDaysUntilBirthday,
        showSettings: showBirthdaySettings,
        checkOnLoad: checkBirthdayOnLoad
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveBirthdaySystem;
}
