/**
 * CRAVE Homepage Dynamic Rewards Controller
 * Single authoritative manager for homepage rewards UI state:
 * - Guest State (not logged in): Aspirational Join Rewards CTA
 * - Authenticated State (logged in): Real user points, tier, and milestone progress from GET /api/rewards
 * - Loading State: Skeleton shimmer loader
 * - Error/Retry State: Graceful retry option on API failure
 */
const CraveHomeRewards = (function() {
    'use strict';

    let cardCol = null;
    let actionRow = null;
    let isFetching = false;

    // Milestone progress calculator (derived from backend points)
    function calculateMilestoneProgress(points, tierName) {
        const milestones = [
            { name: 'Silver VIP', points: 500 },
            { name: 'Gold VIP', points: 1500 },
            { name: 'Platinum VIP', points: 3500 }
        ];

        let nextMilestone = null;
        for (let i = 0; i < milestones.length; i++) {
            if (points < milestones[i].points) {
                nextMilestone = milestones[i];
                break;
            }
        }

        if (!nextMilestone) {
            return {
                label: 'Highest VIP Status Achieved',
                percent: 100
            };
        }

        const prevPoints = tierName === 'silver' ? 500 : (tierName === 'gold' ? 1500 : 0);
        const range = nextMilestone.points - prevPoints;
        const currentInRange = Math.max(0, points - prevPoints);
        const percent = Math.min(100, Math.max(0, Math.floor((currentInRange / range) * 100)));

        return {
            label: `Progress to ${nextMilestone.name}`,
            percent: percent
        };
    }

    // Render Loading State (Shimmer Skeleton)
    function renderLoadingState() {
        if (!cardCol) return;
        cardCol.innerHTML = `
            <div class="vip-membership-card vip-membership-card--loading" aria-busy="true" aria-label="Loading rewards data">
                <div class="card-shimmer" aria-hidden="true"></div>
                <div class="vip-card-header">
                    <div class="vip-card-brand">
                        <span class="brand-name">CRAVE</span>
                        <span class="brand-tag">REWARDS VIP</span>
                    </div>
                    <div class="vip-card-skeleton-badge"></div>
                </div>
                <div class="vip-card-body">
                    <div class="vip-card-skeleton-line short"></div>
                    <div class="vip-card-skeleton-line tall"></div>
                    <div class="vip-card-skeleton-track"></div>
                </div>
                <div class="vip-card-footer">
                    <div class="vip-card-skeleton-pills"></div>
                </div>
            </div>
        `;
    }

    // Render Guest State (Not Logged In)
    function renderGuestState() {
        if (!cardCol) return;
        cardCol.innerHTML = `
            <div class="vip-membership-card vip-membership-card--guest">
                <div class="card-shimmer" aria-hidden="true"></div>
                <div class="vip-card-header">
                    <div class="vip-card-brand">
                        <span class="brand-name">CRAVE</span>
                        <span class="brand-tag">REWARDS VIP</span>
                    </div>
                    <div class="vip-tier-chip vip-tier-chip--guest">
                        <span class="chip-star">✦</span>
                        <span class="chip-label">MEMBERSHIP</span>
                    </div>
                </div>
                <div class="vip-card-body">
                    <div class="guest-card-eyebrow">JOIN CRAVE REWARDS</div>
                    <h3 class="guest-card-title">Get More From Every Craving.</h3>
                    <p class="guest-card-desc">Earn points automatically as you order and unlock exclusive perks made to elevate your next feast.</p>
                    <div class="guest-benefits-list">
                        <div class="guest-benefit-item">
                            <span class="benefit-icon">🎁</span>
                            <span>Earn points on every order</span>
                        </div>
                        <div class="guest-benefit-item">
                            <span class="benefit-icon">⭐</span>
                            <span>Unlock exclusive member perks</span>
                        </div>
                        <div class="guest-benefit-item">
                            <span class="benefit-icon">⚡</span>
                            <span>Enjoy a faster rewards experience</span>
                        </div>
                    </div>
                </div>
                <div class="vip-card-footer">
                    <div class="perks-pills">
                        <span class="perk-pill">⚡ Free Delivery</span>
                        <span class="perk-pill">🎡 Daily Spin</span>
                        <span class="perk-pill">🎂 Birthday Treat</span>
                    </div>
                </div>
            </div>
        `;

        if (actionRow) {
            actionRow.innerHTML = `
                <a href="register.html" class="rewards-btn-primary" id="craveRewardsPrimaryCta">
                    <span>Join CRAVE Rewards</span>
                    <i class="fas fa-arrow-right" aria-hidden="true"></i>
                </a>
            `;
        }
    }

    // Render Authenticated State (Real Backend Data)
    function renderAuthenticatedState(rewardData) {
        if (!cardCol) return;

        const points = Number(rewardData.points || 0);
        const tierRaw = (rewardData.tier || 'bronze').toLowerCase();
        const tierFormatted = tierRaw.toUpperCase();

        const milestone = calculateMilestoneProgress(points, tierRaw);

        cardCol.innerHTML = `
            <div class="vip-membership-card vip-membership-card--authenticated">
                <div class="card-shimmer" aria-hidden="true"></div>
                <div class="vip-card-header">
                    <div class="vip-card-brand">
                        <span class="brand-name">CRAVE</span>
                        <span class="brand-tag">REWARDS VIP</span>
                    </div>
                    <div class="vip-tier-chip">
                        <span class="chip-star">⭐</span>
                        <span class="chip-label">${tierFormatted} TIER</span>
                    </div>
                </div>
                <div class="vip-card-body">
                    <div class="points-label">AVAILABLE BALANCE</div>
                    <div class="points-val-row">
                        <span class="points-number">${points.toLocaleString()}</span>
                        <span class="points-unit">PTS</span>
                    </div>
                    <div class="vip-progress-wrap">
                        <div class="progress-info">
                            <span>${milestone.label}</span>
                            <span>${milestone.percent}%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: ${milestone.percent}%;"></div>
                        </div>
                    </div>
                </div>
                <div class="vip-card-footer">
                    <div class="perks-pills">
                        <span class="perk-pill">⚡ Free Delivery</span>
                        <span class="perk-pill">🎡 Daily Spin</span>
                        <span class="perk-pill">🎂 Birthday Treat</span>
                    </div>
                </div>
            </div>
        `;

        if (actionRow) {
            actionRow.innerHTML = `
                <a href="rewards.html" class="rewards-btn-primary" id="craveRewardsPrimaryCta">
                    <span>View My Rewards</span>
                    <i class="fas fa-arrow-right" aria-hidden="true"></i>
                </a>
            `;
        }
    }

    // Render API Failure / Retry State
    function renderErrorState() {
        if (!cardCol) return;
        cardCol.innerHTML = `
            <div class="vip-membership-card vip-membership-card--error">
                <div class="card-shimmer" aria-hidden="true"></div>
                <div class="vip-card-header">
                    <div class="vip-card-brand">
                        <span class="brand-name">CRAVE</span>
                        <span class="brand-tag">REWARDS VIP</span>
                    </div>
                </div>
                <div class="vip-card-body" style="text-align: center; padding: 24px 12px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; color: #d4a574; margin-bottom: 12px; display: block;"></i>
                    <div style="font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); margin-bottom: 16px;">
                        Your rewards are temporarily unavailable.
                    </div>
                    <button id="craveHomeRewardsRetryBtn" type="button" class="rewards-btn-secondary" style="padding: 10px 22px; font-size: 13px; font-weight: 600; border-radius: 999px; background: rgba(212, 165, 116, 0.15); color: #d4a574; border: 1px solid rgba(212, 165, 116, 0.35); cursor: pointer; transition: all 0.2s ease;">
                        <i class="fas fa-sync-alt" style="margin-right: 6px;"></i> Retry
                    </button>
                </div>
            </div>
        `;

        const retryBtn = document.getElementById('craveHomeRewardsRetryBtn');
        if (retryBtn) {
            retryBtn.onclick = () => {
                updateState();
            };
        }
    }

    // Main updateState function
    async function updateState() {
        cardCol = document.getElementById('craveRewardsCardCol');
        actionRow = document.getElementById('craveRewardsActionRow');
        if (!cardCol) return;

        // Check if user is authenticated via AuthManager
        const isAuth = typeof AuthManager !== 'undefined' && AuthManager.checkAuth && AuthManager.checkAuth();

        if (!isAuth) {
            renderGuestState();
            return;
        }

        if (isFetching) return;
        isFetching = true;
        renderLoadingState();

        try {
            let rewardData = null;

            // Fetch from backend API using AuthAPI or CraveRewardsData
            if (typeof AuthAPI !== 'undefined' && AuthAPI.getRewards) {
                const response = await AuthAPI.getRewards();
                if (response && response.success && response.data) {
                    rewardData = response.data;
                }
            } else if (typeof CraveRewardsData !== 'undefined' && CraveRewardsData.fetchBackendRewards) {
                rewardData = await CraveRewardsData.fetchBackendRewards();
            }

            if (rewardData && (rewardData.points !== undefined || rewardData.tier !== undefined)) {
                renderAuthenticatedState(rewardData);
            } else {
                renderErrorState();
            }
        } catch (err) {
            console.error('Error fetching homepage rewards:', err);
            renderErrorState();
        } finally {
            isFetching = false;
        }
    }

    // Initialize and listen for events
    function init() {
        cardCol = document.getElementById('craveRewardsCardCol');
        actionRow = document.getElementById('craveRewardsActionRow');
        if (!cardCol) return;

        updateState();

        // Listen to AuthManager & document events for multi-tab/logout safety
        document.addEventListener('auth:login', () => {
            updateState();
        });
        document.addEventListener('auth:logout', () => {
            renderGuestState();
        });
        document.addEventListener('rewardsStateChanged', (e) => {
            if (e.detail) {
                renderAuthenticatedState(e.detail);
            } else {
                updateState();
            }
        });
        window.addEventListener('storage', (e) => {
            if (e.key === 'crave_access_token' || e.key === 'crave_user_data') {
                updateState();
            }
        });
    }

    return {
        init,
        updateState,
        renderGuestState
    };
})();

// Auto-initialize when DOM ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            CraveHomeRewards.init();
        });
    } else {
        CraveHomeRewards.init();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveHomeRewards;
}
