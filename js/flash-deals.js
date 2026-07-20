/**
 * CRAVE Flash Deals System
 * Limited-time offers and flash sales
 */

const CraveFlashDeals = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const data = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData : null;
    const notifications = typeof CraveRewardsNotifications !== 'undefined' ? CraveRewardsNotifications : null;

    let activeDeal = null;
    let dealTimer = null;

    // Get available flash deals
    function getAvailableDeals() {
        if (!config) return [];
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();
        
        return Object.entries(config.flashDeals)
            .filter(([key, deal]) => {
                // Check if deal is active
                if (!deal.active) return false;
                
                // Check time restriction
                if (deal.timeRestriction) {
                    const startHour = parseInt(deal.timeRestriction.start.split(':')[0]);
                    const endHour = parseInt(deal.timeRestriction.end.split(':')[0]);
                    if (currentHour < startHour || currentHour >= endHour) {
                        return false;
                    }
                }
                
                // Check day restriction
                if (deal.dayRestriction) {
                    if (!deal.dayRestriction.includes(currentDay)) {
                        return false;
                    }
                }
                
                // Check if already claimed today
                if (data && data.FlashDeals.hasClaimedToday(key)) {
                    return false;
                }
                
                return true;
            })
            .map(([key, deal]) => ({
                key,
                ...deal
            }));
    }

    // Trigger a random flash deal
    function triggerRandomDeal() {
        if (!config) return null;
        
        const availableDeals = getAvailableDeals();
        if (availableDeals.length === 0) return null;
        
        // Select random deal
        const randomIndex = Math.floor(Math.random() * availableDeals.length);
        const deal = availableDeals[randomIndex];
        
        activeDeal = deal;
        
        // Show notification
        if (notifications) {
            notifications.flashDealAvailable(deal);
        }
        
        // Set timer for deal expiration
        if (deal.duration) {
            dealTimer = setTimeout(() => {
                expireDeal();
            }, deal.duration * 1000);
        }
        
        return deal;
    }

    // Expire current deal
    function expireDeal() {
        if (activeDeal && notifications) {
            notifications.show({
                type: 'warning',
                icon: '⏰',
                title: 'Deal Expired',
                message: `${activeDeal.name} is no longer available`
            });
        }
        
        activeDeal = null;
        if (dealTimer) {
            clearTimeout(dealTimer);
            dealTimer = null;
        }
    }

    // Claim a flash deal
    function claimDeal(dealKey) {
        if (!data) return { success: false, message: 'System not available' };
        
        const deal = config.flashDeals[dealKey];
        if (!deal) {
            return { success: false, message: 'Deal not found' };
        }
        
        // Check if already claimed today
        if (data.FlashDeals.hasClaimedToday(dealKey)) {
            return { success: false, message: 'Already claimed today' };
        }
        
        // Mark as claimed
        data.FlashDeals.markClaimed(dealKey);
        
        // Apply discount (simplified - in production would integrate with cart)
        const discount = {
            type: deal.discountType,
            value: deal.discountValue,
            description: deal.description
        };
        
        activeDeal = null;
        
        return {
            success: true,
            discount,
            message: 'Deal claimed successfully!'
        };
    }

    // Get currently active deal
    function getActiveDeal() {
        return activeDeal;
    }

    // Check if deal is claimable
    function canClaimDeal(dealKey) {
        if (!data || !config) return false;
        
        const deal = config.flashDeals[dealKey];
        if (!deal || !deal.active) return false;
        
        if (data.FlashDeals.hasClaimedToday(dealKey)) return false;
        
        return true;
    }

    // Get deal countdown
    function getDealCountdown() {
        if (!activeDeal || !dealTimer) return null;
        
        // This would need to track the actual expiration time
        // For now, return a placeholder
        return {
            minutes: Math.floor(Math.random() * 30) + 10,
            seconds: Math.floor(Math.random() * 60)
        };
    }

    // Show flash deals banner
    function showFlashDealsBanner() {
        const availableDeals = getAvailableDeals();
        if (availableDeals.length === 0) return;
        
        const bannerHTML = `
            <div class="crave-flash-deals-banner" id="craveFlashDealsBanner">
                <div class="crave-flash-deals-content">
                    <div class="crave-flash-deals-icon">⚡</div>
                    <div class="crave-flash-deals-text">
                        <span class="crave-flash-deals-label">FLASH DEAL</span>
                        <span class="crave-flash-deals-name">${availableDeals[0].name}</span>
                    </div>
                    <button class="crave-flash-deals-btn" id="claimFlashDealBtn">Claim Now</button>
                    <button class="crave-flash-deals-close" id="closeFlashDealBanner">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Remove existing banner
        const existingBanner = document.getElementById('craveFlashDealsBanner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        // Add new banner
        document.body.insertAdjacentHTML('beforeend', bannerHTML);
        addFlashDealsBannerStyles();
        setupFlashDealsBannerListeners(availableDeals[0].key);
    }

    // Add banner styles
    function addFlashDealsBannerStyles() {
        if (document.getElementById('crave-flash-deals-banner-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'crave-flash-deals-banner-styles';
        style.textContent = `
            .crave-flash-deals-banner {
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10005;
                background: linear-gradient(135deg, #d4a373, #c49a6c);
                border-radius: 16px;
                padding: 16px 24px;
                box-shadow: 0 8px 24px rgba(212, 163, 115, 0.4);
                animation: slide-down 0.5s ease;
            }

            @keyframes slide-down {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }

            .crave-flash-deals-content {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .crave-flash-deals-icon {
                font-size: 32px;
            }

            .crave-flash-deals-text {
                display: flex;
                flex-direction: column;
            }

            .crave-flash-deals-label {
                font-size: 10px;
                font-weight: 700;
                color: rgba(0, 0, 0, 0.6);
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .crave-flash-deals-name {
                font-size: 14px;
                font-weight: 600;
                color: #000000;
            }

            .crave-flash-deals-btn {
                padding: 8px 20px;
                background: rgba(0, 0, 0, 0.2);
                border: none;
                border-radius: 8px;
                color: #ffffff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .crave-flash-deals-btn:hover {
                background: rgba(0, 0, 0, 0.3);
            }

            .crave-flash-deals-close {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                color: rgba(0, 0, 0, 0.5);
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .crave-flash-deals-close:hover {
                background: rgba(0, 0, 0, 0.1);
                color: rgba(0, 0, 0, 0.8);
            }

            @media (max-width: 768px) {
                .crave-flash-deals-banner {
                    top: auto;
                    bottom: 100px;
                    left: 16px;
                    right: 16px;
                    transform: none;
                    width: auto;
                }

                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Setup banner listeners
    function setupFlashDealsBannerListeners(dealKey) {
        const claimBtn = document.getElementById('claimFlashDealBtn');
        const closeBtn = document.getElementById('closeFlashDealBanner');
        const banner = document.getElementById('craveFlashDealsBanner');
        
        claimBtn.addEventListener('click', () => {
            const result = claimDeal(dealKey);
            
            if (result.success) {
                if (notifications) {
                    notifications.show({
                        type: 'success',
                        icon: '🎉',
                        title: 'Deal Claimed!',
                        message: result.message
                    });
                }
                banner.remove();
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
        
        closeBtn.addEventListener('click', () => {
            banner.remove();
        });
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (banner && banner.parentNode) {
                banner.remove();
            }
        }, 30000);
    }

    // Initialize flash deals system
    function init() {
        // Check for available deals on page load
        setTimeout(() => {
            const availableDeals = getAvailableDeals();
            if (availableDeals.length > 0) {
                // Random chance to show a deal (30%)
                if (Math.random() < 0.3) {
                    showFlashDealsBanner();
                }
            }
        }, 5000);
        
        // Periodically check for new deals
        setInterval(() => {
            const availableDeals = getAvailableDeals();
            if (availableDeals.length > 0 && !document.getElementById('craveFlashDealsBanner')) {
                // 10% chance every minute
                if (Math.random() < 0.1) {
                    showFlashDealsBanner();
                }
            }
        }, 60000);
    }

    // Public API
    return {
        getAvailable: getAvailableDeals,
        triggerRandom: triggerRandomDeal,
        claim: claimDeal,
        getActive: getActiveDeal,
        canClaim: canClaimDeal,
        getCountdown: getDealCountdown,
        showBanner: showFlashDealsBanner,
        init
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveFlashDeals;
}
