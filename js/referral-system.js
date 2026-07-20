/**
 * CRAVE Referral System
 * Share and earn rewards through referrals
 */

const CraveReferralSystem = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const data = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData : null;
    const engine = typeof CraveRewardsEngine !== 'undefined' ? CraveRewardsEngine : null;
    const notifications = typeof CraveRewardsNotifications !== 'undefined' ? CraveRewardsNotifications : null;

    // Generate unique referral code
    function generateReferralCode() {
        if (!data) return null;
        
        let existingCode = data.Referrals.getReferralCode();
        if (existingCode) return existingCode;
        
        // Generate unique code
        const code = 'CRAVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
        data.Referrals.setReferralCode(code);
        return code;
    }

    // Get referral link
    function getReferralLink() {
        const code = generateReferralCode();
        if (!code) return null;
        
        const baseUrl = window.location.origin;
        return `${baseUrl}?ref=${code}`;
    }

    // Share referral link
    function shareReferralLink(platform = 'general') {
        const link = getReferralLink();
        if (!link) return false;
        
        const message = `Join CRAVE and get GHS 15 off your first order! Use my referral link: ${link}`;
        
        switch (platform) {
            case 'whatsapp':
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                break;
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(link).then(() => {
                    if (notifications) {
                        notifications.show({
                            type: 'success',
                            icon: '📋',
                            title: 'Link Copied!',
                            message: 'Referral link copied to clipboard'
                        });
                    }
                });
                break;
            default:
                if (navigator.share) {
                    navigator.share({
                        title: 'Join CRAVE',
                        text: message,
                        url: link
                    });
                } else {
                    navigator.clipboard.writeText(link);
                }
        }
        
        return true;
    }

    // Track referral visit
    function trackReferralVisit(referralCode) {
        if (!data || !engine) return false;
        
        const result = engine.trackReferral(referralCode);
        
        if (result.success && result.isNewReferral) {
            if (notifications) {
                notifications.show({
                    type: 'info',
                    icon: '🤝',
                    title: 'Referral Tracked',
                    message: 'Complete your first order to earn your referral bonus!'
                });
            }
        }
        
        return result;
    }

    // Get referral stats
    function getReferralStats() {
        if (!data) return null;
        
        return {
            referralCode: data.Referrals.getReferralCode(),
            totalReferrals: data.Referrals.getTotalReferrals(),
            completedReferrals: data.Referrals.getCompletedCount(),
            pendingReferrals: data.Referrals.getPendingCount(),
            totalEarned: data.Referrals.getTotalEarned(),
            referralLink: getReferralLink()
        };
    }

    // Get referral history
    function getReferralHistory() {
        if (!data) return [];
        
        return data.Referrals.getHistory();
    }

    // Check for referral code in URL
    function checkURLForReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref');
        
        if (referralCode) {
            trackReferralVisit(referralCode);
            
            // Clean URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    // Show referral modal
    function showReferralModal() {
        if (!config) return;
        
        const stats = getReferralStats();
        if (!stats) return;
        
        const modalHTML = `
            <div class="crave-referral-modal" id="craveReferralModal">
                <div class="crave-referral-overlay"></div>
                <div class="crave-referral-content">
                    <button class="crave-referral-close" id="closeReferralModal">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="crave-referral-header">
                        <div class="crave-referral-icon">🤝</div>
                        <h2>Refer & Earn</h2>
                        <p>Share CRAVE with friends and earn GHS 20 for each successful referral!</p>
                    </div>
                    
                    <div class="crave-referral-stats">
                        <div class="crave-referral-stat">
                            <span class="crave-referral-stat-value">${stats.completedReferrals}</span>
                            <span class="crave-referral-stat-label">Completed</span>
                        </div>
                        <div class="crave-referral-stat">
                            <span class="crave-referral-stat-value">${stats.pendingReferrals}</span>
                            <span class="crave-referral-stat-label">Pending</span>
                        </div>
                        <div class="crave-referral-stat">
                            <span class="crave-referral-stat-value">GHS ${stats.totalEarned}</span>
                            <span class="crave-referral-stat-label">Earned</span>
                        </div>
                    </div>
                    
                    <div class="crave-referral-link-section">
                        <label>Your Referral Link</label>
                        <div class="crave-referral-link-input">
                            <input type="text" value="${stats.referralLink}" readonly id="referralLinkInput">
                            <button class="crave-referral-copy-btn" id="copyReferralBtn">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="crave-referral-share">
                        <label>Share via</label>
                        <div class="crave-referral-share-buttons">
                            <button class="crave-referral-share-btn whatsapp" data-platform="whatsapp">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                            <button class="crave-referral-share-btn facebook" data-platform="facebook">
                                <i class="fab fa-facebook-f"></i>
                            </button>
                            <button class="crave-referral-share-btn twitter" data-platform="twitter">
                                <i class="fab fa-twitter"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="crave-referral-info">
                        <h3>How it works</h3>
                        <ol>
                            <li>Share your unique referral link with friends</li>
                            <li>Your friend gets GHS 15 off their first order</li>
                            <li>You earn GHS 20 credit when they complete their order</li>
                            <li>Unlimited referrals - earn more!</li>
                        </ol>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to DOM
        const existingModal = document.getElementById('craveReferralModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        addReferralModalStyles();
        setupReferralModalListeners();
    }

    // Add modal styles
    function addReferralModalStyles() {
        if (document.getElementById('crave-referral-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'crave-referral-modal-styles';
        style.textContent = `
            .crave-referral-modal {
                position: fixed;
                inset: 0;
                z-index: 10004;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .crave-referral-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            .crave-referral-content {
                position: relative;
                background: rgba(20, 20, 20, 0.95);
                border: 1px solid rgba(212, 163, 115, 0.3);
                border-radius: 24px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
            }

            .crave-referral-close {
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

            .crave-referral-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }

            .crave-referral-header {
                text-align: center;
                margin-bottom: 32px;
            }

            .crave-referral-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }

            .crave-referral-header h2 {
                font-family: 'Playfair Display', serif;
                font-size: 28px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 8px;
            }

            .crave-referral-header p {
                color: #aaaaaa;
                font-size: 14px;
            }

            .crave-referral-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-bottom: 32px;
            }

            .crave-referral-stat {
                text-align: center;
                padding: 16px;
                background: rgba(212, 163, 115, 0.1);
                border: 1px solid rgba(212, 163, 115, 0.2);
                border-radius: 12px;
            }

            .crave-referral-stat-value {
                display: block;
                font-size: 24px;
                font-weight: 700;
                color: #d4a373;
                margin-bottom: 4px;
            }

            .crave-referral-stat-label {
                color: #888888;
                font-size: 12px;
            }

            .crave-referral-link-section {
                margin-bottom: 24px;
            }

            .crave-referral-link-section label {
                display: block;
                color: #ffffff;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
            }

            .crave-referral-link-input {
                display: flex;
                gap: 8px;
            }

            .crave-referral-link-input input {
                flex: 1;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #ffffff;
                font-size: 14px;
            }

            .crave-referral-copy-btn {
                padding: 12px 16px;
                background: rgba(212, 163, 115, 0.15);
                border: 1px solid rgba(212, 163, 115, 0.3);
                border-radius: 8px;
                color: #d4a373;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .crave-referral-copy-btn:hover {
                background: rgba(212, 163, 115, 0.25);
            }

            .crave-referral-share {
                margin-bottom: 32px;
            }

            .crave-referral-share label {
                display: block;
                color: #ffffff;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 12px;
            }

            .crave-referral-share-buttons {
                display: flex;
                gap: 12px;
            }

            .crave-referral-share-btn {
                flex: 1;
                padding: 16px;
                border: none;
                border-radius: 12px;
                font-size: 24px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .crave-referral-share-btn.whatsapp {
                background: #25D366;
                color: white;
            }

            .crave-referral-share-btn.facebook {
                background: #1877F2;
                color: white;
            }

            .crave-referral-share-btn.twitter {
                background: #1DA1F2;
                color: white;
            }

            .crave-referral-share-btn:hover {
                transform: translateY(-2px);
                opacity: 0.9;
            }

            .crave-referral-info h3 {
                color: #ffffff;
                font-size: 18px;
                margin-bottom: 16px;
            }

            .crave-referral-info ol {
                color: #aaaaaa;
                font-size: 14px;
                padding-left: 20px;
            }

            .crave-referral-info li {
                margin-bottom: 8px;
            }

            @media (max-width: 768px) {
                .crave-referral-content {
                    padding: 24px;
                }

                .crave-referral-stats {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Setup modal listeners
    function setupReferralModalListeners() {
        const modal = document.getElementById('craveReferralModal');
        const closeBtn = document.getElementById('closeReferralModal');
        const copyBtn = document.getElementById('copyReferralBtn');
        const shareBtns = modal.querySelectorAll('.crave-referral-share-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.crave-referral-overlay').addEventListener('click', () => {
            modal.remove();
        });
        
        copyBtn.addEventListener('click', () => {
            shareReferralLink('copy');
        });
        
        shareBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                shareReferralLink(platform);
            });
        });
    }

    // Public API
    return {
        generateCode: generateReferralCode,
        getLink: getReferralLink,
        share: shareReferralLink,
        trackVisit: trackReferralVisit,
        getStats: getReferralStats,
        getHistory: getReferralHistory,
        checkURL: checkURLForReferral,
        showModal: showReferralModal
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveReferralSystem;
}
