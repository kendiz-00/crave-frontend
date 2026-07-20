/**
 * CRAVE Rewards Data Management Layer
 * Handles all data persistence and retrieval using LocalStorage
 */

const CraveRewardsData = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const keys = config ? config.storageKeys : {};

    // Helper functions for LocalStorage
    function getStorage(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            if (value === null) return defaultValue;
            return JSON.parse(value);
        } catch (e) {
            console.error(`Error reading ${key} from storage:`, e);
            return defaultValue;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Error writing ${key} to storage:`, e);
            return false;
        }
    }

    function removeStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`Error removing ${key} from storage:`, e);
            return false;
        }
    }

    // Points Management
    const Points = {
        get: function() {
            return getStorage(keys.points, 0);
        },

        set: function(points) {
            return setStorage(keys.points, Math.max(0, points));
        },

        add: function(points) {
            const current = this.get();
            return this.set(current + points);
        },

        subtract: function(points) {
            const current = this.get();
            return this.set(current - points);
        }
    };

    // Tier Management
    const Tier = {
        get: function() {
            return getStorage(keys.tier, 'bronze');
        },

        set: function(tier) {
            return setStorage(keys.tier, tier);
        },

        calculate: function(points) {
            if (!config) return 'bronze';
            
            const tiers = Object.keys(config.tiers).reverse();
            for (const tier of tiers) {
                if (points >= config.tiers[tier].minPoints) {
                    return tier;
                }
            }
            return 'bronze';
        },

        update: function() {
            const points = Points.get();
            const newTier = this.calculate(points);
            const currentTier = this.get();
            
            if (newTier !== currentTier) {
                this.set(newTier);
                return { upgraded: true, from: currentTier, to: newTier };
            }
            return { upgraded: false, current: currentTier };
        },

        getInfo: function(tier) {
            if (!config) return null;
            return config.tiers[tier] || config.tiers.bronze;
        }
    };

    // Achievements Management
    const Achievements = {
        get: function() {
            return getStorage(keys.achievements, []);
        },

        set: function(achievements) {
            return setStorage(keys.achievements, achievements);
        },

        add: function(achievementId) {
            const achievements = this.get();
            if (!achievements.includes(achievementId)) {
                achievements.push(achievementId);
                this.set(achievements);
                return true;
            }
            return false;
        },

        has: function(achievementId) {
            return this.get().includes(achievementId);
        },

        remove: function(achievementId) {
            const achievements = this.get();
            const index = achievements.indexOf(achievementId);
            if (index > -1) {
                achievements.splice(index, 1);
                this.set(achievements);
                return true;
            }
            return false;
        }
    };

    // Promo Codes Management
    const PromoCodes = {
        getUsed: function() {
            return getStorage(keys.promoCodesUsed, []);
        },

        setUsed: function(codes) {
            return setStorage(keys.promoCodesUsed, codes);
        },

        markUsed: function(code) {
            const used = this.getUsed();
            if (!used.includes(code)) {
                used.push(code);
                this.setUsed(used);
                return true;
            }
            return false;
        },

        hasUsed: function(code) {
            return this.getUsed().includes(code);
        },

        getUsageCount: function(code) {
            const used = this.getUsed();
            return used.filter(c => c === code).length;
        }
    };

    // Spin Wheel Management
    const SpinWheel = {
        getSpins: function() {
            return getStorage(keys.spins, 0);
        },

        setSpins: function(count) {
            return setStorage(keys.spins, count);
        },

        addSpin: function() {
            return this.setSpins(this.getSpins() + 1);
        },

        getLastSpin: function() {
            return getStorage(keys.lastSpin, 0);
        },

        setLastSpin: function(timestamp) {
            return setStorage(keys.lastSpin, timestamp);
        },

        canSpin: function() {
            if (!config) return false;
            
            const lastSpin = this.getLastSpin();
            const now = Date.now();
            const cooldown = config.spinWheel.spinCooldown;
            
            return (now - lastSpin) >= cooldown;
        },

        getSpinsToday: function() {
            if (!config) return 0;
            
            const lastSpin = this.getLastSpin();
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;
            
            if (now - lastSpin < dayInMs) {
                return this.getSpins();
            }
            return 0;
        },

        recordSpin: function() {
            this.setLastSpin(Date.now());
            return this.addSpin();
        }
    };

    // Daily Rewards Management
    const DailyRewards = {
        getStreak: function() {
            return getStorage(keys.dailyStreak, 0);
        },

        setStreak: function(streak) {
            return setStorage(keys.dailyStreak, streak);
        },

        incrementStreak: function() {
            return this.setStreak(this.getStreak() + 1);
        },

        resetStreak: function() {
            return this.setStreak(0);
        },

        getLastClaim: function() {
            return getStorage(keys.lastDailyClaim, 0);
        },

        setLastClaim: function(timestamp) {
            return setStorage(keys.lastDailyClaim, timestamp);
        },

        canClaim: function() {
            if (!config) return false;
            
            const lastClaim = this.getLastClaim();
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;
            
            return (now - lastClaim) >= dayInMs;
        },

        checkStreakValidity: function() {
            if (!config) return false;
            
            const lastClaim = this.getLastClaim();
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;
            const twoDaysInMs = dayInMs * 2;
            
            if (now - lastClaim > twoDaysInMs) {
                this.resetStreak();
                return false;
            }
            return true;
        },

        claim: function() {
            if (!this.canClaim()) return false;
            
            this.checkStreakValidity();
            this.incrementStreak();
            this.setLastClaim(Date.now());
            
            return this.getStreak();
        }
    };

    // Referral Management
    const Referrals = {
        get: function() {
            return getStorage(keys.referrals, []);
        },

        set: function(referrals) {
            return setStorage(keys.referrals, referrals);
        },

        add: function(referralData) {
            const referrals = this.get();
            referrals.push({
                ...referralData,
                createdAt: Date.now(),
                status: 'pending'
            });
            return this.set(referrals);
        },

        updateStatus: function(referralId, status) {
            const referrals = this.get();
            const referral = referrals.find(r => r.id === referralId);
            if (referral) {
                referral.status = status;
                referral.completedAt = Date.now();
                return this.set(referrals);
            }
            return false;
        },

        getCount: function() {
            return this.get().length;
        },

        getCompletedCount: function() {
            return this.get().filter(r => r.status === 'completed').length;
        },

        getPendingCount: function() {
            return this.get().filter(r => r.status === 'pending').length;
        },

        getTotalReferrals: function() {
            return this.getCount();
        },

        getTotalEarned: function() {
            const completed = this.get().filter(r => r.status === 'completed');
            return completed.length * 20; // GHS 20 per completed referral
        },

        getHistory: function() {
            return this.get();
        },

        getReferralCode: function() {
            return getStorage('crave_referral_code', null);
        },

        setReferralCode: function(code) {
            return setStorage('crave_referral_code', code);
        },

        generateReferralCode: function() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = '';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        }
    };

    // Birthday Management
    const Birthday = {
        get: function() {
            return getStorage(keys.birthday, null);
        },

        set: function(birthday) {
            return setStorage(keys.birthday, birthday);
        },

        isToday: function() {
            const birthday = this.get();
            if (!birthday) return false;
            
            const today = new Date();
            const birthDate = new Date(birthday);
            
            return today.getDate() === birthDate.getDate() && 
                   today.getMonth() === birthDate.getMonth();
        },

        isThisMonth: function() {
            const birthday = this.get();
            if (!birthday) return false;
            
            const today = new Date();
            const birthDate = new Date(birthday);
            
            return today.getMonth() === birthDate.getMonth();
        },

        getDaysUntil: function() {
            const birthday = this.get();
            if (!birthday) return null;
            
            const today = new Date();
            const birthDate = new Date(birthday);
            birthDate.setFullYear(today.getFullYear());
            
            if (birthDate < today) {
                birthDate.setFullYear(today.getFullYear() + 1);
            }
            
            const diff = birthDate - today;
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        },

        getLastRewardYear: function() {
            return getStorage('crave_birthday_reward_year', null);
        },

        setLastRewardYear: function(year) {
            return setStorage('crave_birthday_reward_year', year);
        },

        getLastClaimed: function() {
            return getStorage('crave_birthday_last_claimed', null);
        },

        setLastClaimed: function(timestamp) {
            return setStorage('crave_birthday_last_claimed', timestamp);
        },

        canClaimBirthdayReward: function() {
            const currentYear = new Date().getFullYear();
            const lastRewardYear = this.getLastRewardYear();
            
            return lastRewardYear !== currentYear;
        },

        claimBirthdayReward: function() {
            const currentYear = new Date().getFullYear();
            return this.setLastRewardYear(currentYear);
        }
    };

    // Reward Vault Management
    const RewardVault = {
        get: function() {
            return getStorage('crave_reward_vault', []);
        },

        set: function(vault) {
            return setStorage('crave_reward_vault', vault);
        },

        add: function(reward) {
            const vault = this.get();
            vault.push(reward);
            return this.set(vault);
        },

        remove: function(rewardId) {
            const vault = this.get();
            const filtered = vault.filter(r => r.id !== rewardId);
            return this.set(filtered);
        },

        getById: function(rewardId) {
            const vault = this.get();
            return vault.find(r => r.id === rewardId);
        },

        markRedeemed: function(rewardId) {
            const vault = this.get();
            const reward = vault.find(r => r.id === rewardId);
            if (reward) {
                reward.redeemed = true;
                reward.redeemedAt = new Date().toISOString();
                return this.set(vault);
            }
            return false;
        },

        getActive: function() {
            const vault = this.get();
            const now = new Date();
            return vault.filter(r => !r.redeemed && new Date(r.expiresAt) > now);
        },

        getExpired: function() {
            const vault = this.get();
            const now = new Date();
            return vault.filter(r => new Date(r.expiresAt) <= now);
        },

        getRedeemed: function() {
            const vault = this.get();
            return vault.filter(r => r.redeemed);
        },

        getTotalValue: function() {
            const active = this.getActive();
            let total = 0;
            active.forEach(r => {
                if (r.prize.type === 'coupon') total += r.prize.value;
                if (r.prize.type === 'points') total += r.prize.value;
            });
            return total;
        },

        clearExpired: function() {
            const vault = this.get();
            const now = new Date();
            const filtered = vault.filter(r => new Date(r.expiresAt) > now);
            return this.set(filtered);
        }
    };

    // Spin History & Lifetime Stats
    const SpinStats = {
        getTotalSpins: function() {
            return getStorage('crave_total_spins', 0);
        },

        incrementTotalSpins: function() {
            return setStorage('crave_total_spins', this.getTotalSpins() + 1);
        },

        getTotalPrizesWon: function() {
            return getStorage('crave_total_prizes_won', 0);
        },

        incrementTotalPrizesWon: function() {
            return setStorage('crave_total_prizes_won', this.getTotalPrizesWon() + 1);
        },

        getTotalPointsWon: function() {
            return getStorage('crave_total_points_won', 0);
        },

        addPointsWon: function(points) {
            return setStorage('crave_total_points_won', this.getTotalPointsWon() + points);
        },

        getTotalSavings: function() {
            return getStorage('crave_total_savings', 0);
        },

        addSavings: function(amount) {
            return setStorage('crave_total_savings', this.getTotalSavings() + amount);
        },

        getSpinHistory: function() {
            return getStorage('crave_spin_history', []);
        },

        addSpinHistory: function(spinResult) {
            const history = this.getSpinHistory();
            history.unshift({
                ...spinResult,
                timestamp: new Date().toISOString()
            });
            // Keep only last 50 spins
            if (history.length > 50) history.pop();
            return setStorage('crave_spin_history', history);
        },

        getLastSpinTime: function() {
            return getStorage('crave_last_spin_time', 0);
        },

        setLastSpinTime: function(timestamp) {
            return setStorage('crave_last_spin_time', timestamp);
        },

        getNextSpinTime: function() {
            const lastSpin = this.getLastSpinTime();
            if (lastSpin === 0) return 0;
            return lastSpin + (24 * 60 * 60 * 1000); // 24 hours
        },

        getTimeUntilNextSpin: function() {
            const nextSpin = this.getNextSpinTime();
            const now = Date.now();
            const diff = nextSpin - now;
            return Math.max(0, diff);
        }
    };

    // Order History Management
    const Orders = {
        get: function() {
            return getStorage(keys.orders, []);
        },

        set: function(orders) {
            return setStorage(keys.orders, orders);
        },

        add: function(orderData) {
            const orders = this.get();
            orders.push({
                ...orderData,
                createdAt: Date.now()
            });
            return this.set(orders);
        },

        getCount: function() {
            return this.get().length;
        },

        getTotalSpent: function() {
            return getStorage(keys.totalSpent, 0);
        },

        setTotalSpent: function(amount) {
            return setStorage(keys.totalSpent, amount);
        },

        addSpent: function(amount) {
            return this.setTotalSpent(this.getTotalSpent() + amount);
        }
    };

    // Item Order Tracking
    const ItemOrders = {
        get: function() {
            return getStorage(keys.itemOrders, {});
        },

        set: function(itemOrders) {
            return setStorage(keys.itemOrders, itemOrders);
        },

        increment: function(itemName) {
            const itemOrders = this.get();
            itemOrders[itemName] = (itemOrders[itemName] || 0) + 1;
            return this.set(itemOrders);
        },

        getCount: function(itemName) {
            return this.get()[itemName] || 0;
        }
    };

    // Time-based Order Tracking
    const TimeOrders = {
        getWeekendOrders: function() {
            return getStorage(keys.weekendOrders, 0);
        },

        setWeekendOrders: function(count) {
            return setStorage(keys.weekendOrders, count);
        },

        incrementWeekendOrders: function() {
            return this.setWeekendOrders(this.getWeekendOrders() + 1);
        },

        getBreakfastOrders: function() {
            return getStorage(keys.breakfastOrders, 0);
        },

        setBreakfastOrders: function(count) {
            return setStorage(keys.breakfastOrders, count);
        },

        incrementBreakfastOrders: function() {
            return this.setBreakfastOrders(this.getBreakfastOrders() + 1);
        },

        getLateNightOrders: function() {
            return getStorage(keys.lateNightOrders, 0);
        },

        setLateNightOrders: function(count) {
            return setStorage(keys.lateNightOrders, count);
        },

        incrementLateNightOrders: function() {
            return this.setLateNightOrders(this.getLateNightOrders() + 1);
        }
    };

    // VIP Management
    const VIP = {
        getStatus: function() {
            return getStorage(keys.vipStatus, false);
        },

        setStatus: function(status) {
            return setStorage(keys.vipStatus, status);
        },

        getExpiry: function() {
            return getStorage(keys.vipExpiry, null);
        },

        setExpiry: function(timestamp) {
            return setStorage(keys.vipExpiry, timestamp);
        },

        isActive: function() {
            const status = this.getStatus();
            const expiry = this.getExpiry();
            
            if (!status || !expiry) return false;
            
            return Date.now() < expiry;
        },

        activate: function(duration) {
            this.setStatus(true);
            this.setExpiry(Date.now() + duration);
        },

        deactivate: function() {
            this.setStatus(false);
            this.setExpiry(null);
        }
    };

    // Surprise Rewards
    const SurpriseRewards = {
        getLastReward: function() {
            return getStorage(keys.surpriseRewardLast, 0);
        },

        setLastReward: function(timestamp) {
            return setStorage(keys.surpriseRewardLast, timestamp);
        },

        canReward: function() {
            if (!config) return false;
            
            const lastReward = this.getLastReward();
            const now = Date.now();
            const minInterval = 7 * 24 * 60 * 60 * 1000; // 7 days
            
            return (now - lastReward) >= minInterval;
        },

        recordReward: function() {
            this.setLastReward(Date.now());
        }
    };

    // Flash Deals
    const FlashDeals = {
        getClaimedDeals: function() {
            return getStorage('crave_flash_deals_claimed', {});
        },

        setClaimedDeals: function(deals) {
            return setStorage('crave_flash_deals_claimed', deals);
        },

        markClaimed: function(dealKey) {
            const claimed = this.getClaimedDeals();
            const today = new Date().toDateString();
            claimed[dealKey] = today;
            return this.setClaimedDeals(claimed);
        },

        hasClaimedToday: function(dealKey) {
            const claimed = this.getClaimedDeals();
            const today = new Date().toDateString();
            return claimed[dealKey] === today;
        },

        resetDaily: function() {
            const claimed = this.getClaimedDeals();
            const today = new Date().toDateString();
            const newClaimed = {};
            
            for (const [key, date] of Object.entries(claimed)) {
                if (date === today) {
                    newClaimed[key] = date;
                }
            }
            
            return this.setClaimedDeals(newClaimed);
        }
    };

    // Export all modules
    return {
        Points,
        Tier,
        Achievements,
        PromoCodes,
        SpinWheel,
        DailyRewards,
        Referrals,
        Birthday,
        Orders,
        ItemOrders,
        TimeOrders,
        VIP,
        SurpriseRewards,
        FlashDeals,
        RewardVault,
        SpinStats,
        
        // Utility functions
        clearAll: function() {
            Object.values(keys).forEach(key => removeStorage(key));
        },
        
        exportData: function() {
            const data = {};
            Object.entries(keys).forEach(([name, key]) => {
                data[name] = getStorage(key);
            });
            return data;
        },
        
        importData: function(data) {
            Object.entries(keys).forEach(([name, key]) => {
                if (data[name] !== undefined) {
                    setStorage(key, data[name]);
                }
            });
        }
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveRewardsData;
}
