/**
 * CRAVE Rewards Engine
 * Core business logic for the entire rewards ecosystem
 */

const CraveRewardsEngine = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const data = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData : null;
    
    // Event system for rewards events
    const eventListeners = {};

    function on(event, callback) {
        if (!eventListeners[event]) {
            eventListeners[event] = [];
        }
        eventListeners[event].push(callback);
    }

    function emit(event, data) {
        if (eventListeners[event]) {
            eventListeners[event].forEach(callback => callback(data));
        }
    }

    // Points Calculation
    function calculatePoints(amount, multiplier = 1) {
        if (!config) return 0;
        const basePoints = amount * config.points.exchangeRate;
        return Math.floor(basePoints * multiplier);
    }

    // Get current tier multiplier
    function getTierMultiplier() {
        if (!config || !data) return 1;
        const tier = data.Tier.get();
        return config.points.multiplier[tier] || 1;
    }

    // Add points from purchase
    function addPurchasePoints(amount) {
        if (!data) return 0;
        
        const multiplier = getTierMultiplier();
        const points = calculatePoints(amount, multiplier);
        
        data.Points.add(points);
        
        // Check for tier upgrade
        const tierUpdate = data.Tier.update();
        if (tierUpdate.upgraded) {
            emit('tier_upgraded', tierUpdate);
        }
        
        emit('points_earned', { points, amount, multiplier });
        
        return points;
    }

    // Get next reward milestone
    function getNextMilestone() {
        if (!config || !data) return null;
        
        const currentPoints = data.Points.get();
        const milestones = config.milestones;
        
        for (const milestone of milestones) {
            if (currentPoints < milestone.points) {
                return {
                    ...milestone,
                    remaining: milestone.points - currentPoints,
                    progress: (currentPoints / milestone.points) * 100
                };
            }
        }
        
        return null; // All milestones reached
    }

    // Get current milestone progress
    function getMilestoneProgress() {
        if (!config || !data) return null;
        
        const currentPoints = data.Points.get();
        const milestones = config.milestones;
        
        let previousMilestone = { points: 0 };
        let nextMilestone = null;
        
        for (const milestone of milestones) {
            if (currentPoints < milestone.points) {
                nextMilestone = milestone;
                break;
            }
            previousMilestone = milestone;
        }
        
        if (!nextMilestone) {
            // All milestones reached
            return {
                current: previousMilestone,
                next: null,
                progress: 100,
                remaining: 0
            };
        }
        
        const range = nextMilestone.points - previousMilestone.points;
        const progress = ((currentPoints - previousMilestone.points) / range) * 100;
        
        return {
            current: previousMilestone,
            next: nextMilestone,
            progress: Math.min(100, Math.max(0, progress)),
            remaining: nextMilestone.points - currentPoints
        };
    }

    // Redeem reward milestone
    function redeemMilestone(pointsRequired) {
        if (!data) return { success: false, message: 'Data system not available' };
        
        const currentPoints = data.Points.get();
        
        if (currentPoints < pointsRequired) {
            return { success: false, message: 'Not enough points' };
        }
        
        data.Points.subtract(pointsRequired);
        
        emit('reward_redeemed', { points: pointsRequired });
        
        return { success: true, message: 'Reward redeemed successfully' };
    }

    // Process order and award points
    function processOrder(orderData) {
        if (!data) return null;
        
        const amount = orderData.total || 0;
        const pointsEarned = addPurchasePoints(amount);
        
        // Track order
        data.Orders.add(orderData);
        data.Orders.addSpent(amount);
        
        // Track individual items
        if (orderData.items) {
            orderData.items.forEach(item => {
                data.ItemOrders.increment(item.name);
            });
        }
        
        // Track time-based orders
        const hour = new Date().getHours();
        const day = new Date().getDay();
        
        if (day === 5 || day === 6) { // Friday or Saturday
            data.TimeOrders.incrementWeekendOrders();
        }
        
        if (hour >= 7 && hour < 10) { // Breakfast hours
            data.TimeOrders.incrementBreakfastOrders();
        }
        
        if (hour >= 22) { // Late night
            data.TimeOrders.incrementLateNightOrders();
        }
        
        // Check for achievements
        checkAchievements();
        
        // Check for surprise reward
        checkSurpriseReward();
        
        return {
            pointsEarned,
            tier: data.Tier.get(),
            nextMilestone: getNextMilestone()
        };
    }

    // Check and unlock achievements
    function checkAchievements() {
        if (!config || !data) return;
        
        const achievements = config.achievements;
        const unlocked = data.Achievements.get();
        
        for (const [key, achievement] of Object.entries(achievements)) {
            if (unlocked.includes(key)) continue; // Already unlocked
            
            if (evaluateAchievementCondition(achievement.condition)) {
                data.Achievements.add(key);
                data.Points.add(achievement.points);
                emit('achievement_unlocked', { key, achievement });
            }
        }
    }

    // Evaluate achievement condition
    function evaluateAchievementCondition(condition) {
        if (!data) return false;
        
        // Simple condition parser
        if (condition.includes('orders >=')) {
            const minOrders = parseInt(condition.match(/\d+/)[0]);
            return data.Orders.getCount() >= minOrders;
        }
        
        if (condition.includes('item_orders[')) {
            const match = condition.match(/item_orders\["(.+)"\] >= (\d+)/);
            if (match) {
                const itemName = match[1];
                const minOrders = parseInt(match[2]);
                return data.ItemOrders.getCount(itemName) >= minOrders;
            }
        }
        
        if (condition.includes('weekend_orders >=')) {
            const minOrders = parseInt(condition.match(/\d+/)[0]);
            return data.TimeOrders.getWeekendOrders() >= minOrders;
        }
        
        if (condition.includes('breakfast_orders >=')) {
            const minOrders = parseInt(condition.match(/\d+/)[0]);
            return data.TimeOrders.getBreakfastOrders() >= minOrders;
        }
        
        if (condition.includes('late_night_orders >=')) {
            const minOrders = parseInt(condition.match(/\d+/)[0]);
            return data.TimeOrders.getLateNightOrders() >= minOrders;
        }
        
        if (condition.includes('tier >=')) {
            const tier = condition.match(/tier >= "(.+)"/)[1];
            const currentTier = data.Tier.get();
            const tierOrder = ['bronze', 'silver', 'gold', 'diamond', 'elite'];
            return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(tier);
        }
        
        if (condition.includes('total_spent >=')) {
            const minSpent = parseInt(condition.match(/\d+/)[0]);
            return data.Orders.getTotalSpent() >= minSpent;
        }
        
        if (condition.includes('referrals >=')) {
            const minReferrals = parseInt(condition.match(/\d+/)[0]);
            return data.Referrals.getCompletedCount() >= minReferrals;
        }
        
        return false;
    }

    // Check for surprise reward
    function checkSurpriseReward() {
        if (!config || !data) return;
        
        const surpriseConfig = config.surpriseRewards;
        if (!surpriseConfig.enabled) return;
        
        const orders = data.Orders.getCount();
        const tier = data.Tier.get();
        const tierOrder = ['bronze', 'silver', 'gold', 'diamond', 'elite'];
        
        if (orders < surpriseConfig.minOrders) return;
        if (tierOrder.indexOf(tier) < tierOrder.indexOf(surpriseConfig.minTier)) return;
        
        if (!data.SurpriseRewards.canReward()) return;
        
        // Roll for surprise reward
        if (Math.random() < surpriseConfig.probability) {
            const rewards = surpriseConfig.rewards;
            const reward = rewards[Math.floor(Math.random() * rewards.length)];
            
            data.SurpriseRewards.recordReward();
            emit('surprise_reward', reward);
        }
    }

    // Get customer summary
    function getCustomerSummary() {
        if (!data) return null;
        
        return {
            points: data.Points.get(),
            tier: data.Tier.get(),
            tierInfo: data.Tier.getInfo(data.Tier.get()),
            achievements: data.Achievements.get(),
            orders: data.Orders.getCount(),
            totalSpent: data.Orders.getTotalSpent(),
            vipStatus: data.VIP.isActive(),
            dailyStreak: data.DailyRewards.getStreak(),
            referralCount: data.Referrals.getCount(),
            milestoneProgress: getMilestoneProgress()
        };
    }

    // Check for available flash deals
    function getActiveFlashDeals() {
        if (!config) return [];
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();
        const activeDeals = [];
        
        for (const [key, deal] of Object.entries(config.flashDeals)) {
            if (!deal.enabled) continue;
            
            let isActive = false;
            
            if (deal.time) {
                const startHour = parseInt(deal.time.start.split(':')[0]);
                const endHour = parseInt(deal.time.end.split(':')[0]);
                isActive = currentHour >= startHour && currentHour < endHour;
            }
            
            if (deal.days) {
                isActive = deal.days.includes(currentDay);
            }
            
            if (isActive) {
                activeDeals.push({
                    key,
                    ...deal
                });
            }
        }
        
        return activeDeals;
    }

    // Calculate discount from promo code
    function applyPromoCode(code, orderTotal, cartItems = []) {
        if (!config || !data) return { valid: false, message: 'System not available' };
        
        const promoCode = code.toUpperCase();
        const promoConfig = config.promoCodes[promoCode];
        
        if (!promoConfig) {
            return { valid: false, message: 'Invalid promo code' };
        }
        
        // Check if already used
        if (data.PromoCodes.hasUsed(promoCode)) {
            const usageCount = data.PromoCodes.getUsageCount(promoCode);
            if (usageCount >= promoConfig.usageLimit) {
                return { valid: false, message: 'Promo code usage limit reached' };
            }
        }
        
        // Check minimum order
        if (orderTotal < promoConfig.minOrder) {
            return { valid: false, message: `Minimum order GHS ${promoConfig.minOrder} required` };
        }
        
        // Check new customer restriction
        if (promoConfig.newCustomerOnly && data.Orders.getCount() > 0) {
            return { valid: false, message: 'Promo code for new customers only' };
        }
        
        // Check tier restriction
        if (promoConfig.tierRestriction) {
            const currentTier = data.Tier.get();
            if (!promoConfig.tierRestriction.includes(currentTier)) {
                return { valid: false, message: 'Promo code not available for your tier' };
            }
        }
        
        // Check minimum orders
        if (promoConfig.minOrders && data.Orders.getCount() < promoConfig.minOrders) {
            return { valid: false, message: `Minimum ${promoConfig.minOrders} orders required` };
        }
        
        // Check time restriction
        if (promoConfig.timeRestriction) {
            const now = new Date();
            const currentHour = now.getHours();
            const startHour = parseInt(promoConfig.timeRestriction.start.split(':')[0]);
            const endHour = parseInt(promoConfig.timeRestriction.end.split(':')[0]);
            
            if (currentHour < startHour || currentHour >= endHour) {
                return { valid: false, message: 'Promo code not valid at this time' };
            }
        }
        
        // Check day restriction
        if (promoConfig.dayRestriction) {
            const currentDay = new Date().getDay();
            if (!promoCode.dayRestriction.includes(currentDay)) {
                return { valid: false, message: 'Promo code not valid today' };
            }
        }
        
        // Calculate discount
        let discount = 0;
        let discountType = promoConfig.type;
        
        switch (promoConfig.type) {
            case 'percentage':
                discount = orderTotal * (promoConfig.value / 100);
                if (promoConfig.maxDiscount) {
                    discount = Math.min(discount, promoConfig.maxDiscount);
                }
                break;
            case 'fixed':
                discount = promoConfig.value;
                break;
            case 'free_delivery':
                discount = 0; // Handled separately
                break;
            default:
                discount = 0;
        }
        
        return {
            valid: true,
            discount,
            discountType,
            description: promoConfig.description,
            finalTotal: orderTotal - discount
        };
    }

    // Mark promo code as used
    function usePromoCode(code) {
        if (!data) return false;
        return data.PromoCodes.markUsed(code.toUpperCase());
    }

    // Claim daily reward
    function claimDailyReward() {
        if (!config || !data) return { success: false, message: 'System not available' };
        
        if (!data.DailyRewards.canClaim()) {
            return { success: false, message: 'Daily reward already claimed' };
        }
        
        const streak = data.DailyRewards.claim();
        const rewardConfig = config.dailyRewards.streaks[streak] || config.dailyRewards.streaks[7];
        
        let points = 0;
        let reward = null;
        
        if (rewardConfig.reward.includes('Points')) {
            points = rewardConfig.points;
            data.Points.add(points);
        } else {
            reward = rewardConfig.reward;
        }
        
        emit('daily_reward_claimed', { streak, points, reward });
        
        return {
            success: true,
            streak,
            points,
            reward,
            message: `Day ${streak} reward claimed!`
        };
    }

    // Generate referral link
    function generateReferralLink() {
        if (!data) return null;
        
        const code = data.Referrals.generateReferralCode();
        const baseUrl = window.location.origin;
        return `${baseUrl}?ref=${code}`;
    }

    // Process referral
    function processReferral(referralCode) {
        if (!config || !data) return { success: false, message: 'System not available' };
        
        const referralData = {
            id: referralCode,
            referrerBonus: config.referral.referrerReward.value,
            friendBonus: config.referral.friendReward.value
        };
        
        data.Referrals.add(referralData);
        
        emit('referral_processed', referralData);
        
        return {
            success: true,
            message: 'Referral processed successfully',
            ...referralData
        };
    }

    // Complete referral
    function completeReferral(referralId) {
        if (!config || !data) return { success: false, message: 'System not available' };
        
        data.Referrals.updateStatus(referralId, 'completed');
        
        // Award referrer bonus
        const bonus = config.referral.referrerReward.value;
        data.Points.add(bonus); // Convert credit to points
        
        emit('referral_completed', { referralId, bonus });
        
        return {
            success: true,
            message: 'Referral completed! Bonus awarded.'
        };
    }

    // Set birthday
    function setBirthday(birthday) {
        if (!data) return false;
        return data.Birthday.set(birthday);
    }

    // Check birthday reward
    function checkBirthdayReward() {
        if (!config || !data) return null;
        
        if (!data.Birthday.isToday()) return null;
        
        // Check if already claimed this year
        const lastClaimed = data.Birthday.getLastClaimed();
        if (lastClaimed) {
            const lastClaimedDate = new Date(lastClaimed);
            const currentYear = new Date().getFullYear();
            
            if (lastClaimedDate.getFullYear() === currentYear) {
                return null;
            }
        }
        
        return config.birthday.reward;
    }

    // Claim birthday reward
    function claimBirthdayReward() {
        if (!config || !data) return { success: false, message: 'System not available' };
        
        const reward = checkBirthdayReward();
        if (!reward) {
            return { success: false, message: 'Birthday reward not available' };
        }
        
        // Mark as claimed
        data.Birthday.setLastClaimed(Date.now());
        
        emit('birthday_reward_claimed', reward);
        
        return {
            success: true,
            reward,
            message: 'Birthday reward claimed successfully!'
        };
    }

    // Track referral visit
    function trackReferral(referralCode) {
        if (!data) return { success: false, message: 'System not available' };
        
        const referralData = {
            id: referralCode,
            referrerBonus: config.referral.referrerReward.value,
            friendBonus: config.referral.friendReward.value
        };
        
        const isNewReferral = !data.Referrals.get().some(r => r.id === referralCode);
        
        if (isNewReferral) {
            data.Referrals.add(referralData);
        }
        
        return {
            success: true,
            isNewReferral,
            message: 'Referral tracked successfully'
        };
    }

    // Activate VIP
    function activateVIP(duration = 30 * 24 * 60 * 60 * 1000) {
        if (!data) return false;
        
        data.VIP.activate(duration);
        emit('vip_activated');
        
        return true;
    }

    // Check VIP status
    function getVIPStatus() {
        if (!data) return null;
        
        return {
            active: data.VIP.isActive(),
            expiry: data.VIP.getExpiry()
        };
    }

    // Spin wheel availability
    function canSpinWheel() {
        if (!config || !data) return false;
        
        const unlockConditions = config.spinWheel.unlockConditions;
        
        if (unlockConditions.firstOrder && data.Orders.getCount() < 1) {
            return { canSpin: false, reason: 'Complete your first order to unlock' };
        }
        
        if (unlockConditions.minSpend && data.Orders.getTotalSpent() < unlockConditions.minSpend) {
            return { canSpin: false, reason: `Spend GHS ${unlockConditions.minSpend} to unlock` };
        }
        
        if (unlockConditions.referralMilestone && data.Referrals.getCompletedCount() < unlockConditions.referralMilestone) {
            return { canSpin: false, reason: `Refer ${unlockConditions.referralMilestone} friends to unlock` };
        }
        
        if (!data.SpinWheel.canSpin()) {
            return { canSpin: false, reason: 'Spin cooldown active' };
        }
        
        if (data.SpinWheel.getSpinsToday() >= config.spinWheel.maxSpinsPerDay) {
            return { canSpin: false, reason: 'Daily spin limit reached' };
        }
        
        return { canSpin: true };
    }

    // Spin the wheel
    function spinWheel() {
        if (!config || !data) return null;
        
        const canSpin = canSpinWheel();
        if (!canSpin.canSpin) {
            return { success: false, reason: canSpin.reason };
        }
        
        const prizes = config.spinWheel.prizes;
        const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
        let random = Math.random() * totalWeight;
        
        let selectedPrize = null;
        for (const prize of prizes) {
            random -= prize.weight;
            if (random <= 0) {
                selectedPrize = prize;
                break;
            }
        }
        
        data.SpinWheel.recordSpin();
        
        emit('wheel_spun', selectedPrize);
        
        return {
            success: true,
            prize: selectedPrize
        };
    }

    // Get combo recommendations
    function getComboRecommendations(cartItems) {
        if (!config) return [];
        
        const cartItemNames = cartItems.map(item => item.name.toLowerCase());
        const recommendations = [];
        
        for (const combo of config.combos) {
            const comboItems = combo.items.map(item => item.toLowerCase());
            const hasComboItem = comboItems.some(item => 
                cartItemNames.some(cartItem => cartItem.includes(item))
            );
            
            if (hasComboItem) {
                const missingItems = comboItems.filter(item =>
                    !cartItemNames.some(cartItem => cartItem.includes(item))
                );
                
                if (missingItems.length > 0 && missingItems.length < comboItems.length) {
                    recommendations.push({
                        ...combo,
                        missingItems,
                        completion: ((comboItems.length - missingItems.length) / comboItems.length) * 100
                    });
                }
            }
        }
        
        return recommendations.sort((a, b) => b.completion - a.completion);
    }

    // Export public API
    return {
        // Event system
        on,
        emit,
        
        // Points
        calculatePoints,
        addPurchasePoints,
        getTierMultiplier,
        
        // Milestones
        getNextMilestone,
        getMilestoneProgress,
        redeemMilestone,
        
        // Orders
        processOrder,
        
        // Achievements
        checkAchievements,
        
        // Customer
        getCustomerSummary,
        
        // Promo Codes
        applyPromoCode,
        usePromoCode,
        
        // Daily Rewards
        claimDailyReward,
        
        // Referrals
        generateReferralLink,
        processReferral,
        completeReferral,
        trackReferral,
        
        // Birthday
        setBirthday,
        checkBirthdayReward,
        claimBirthdayReward,
        
        // VIP
        activateVIP,
        getVIPStatus,
        
        // Spin Wheel
        canSpinWheel,
        spinWheel,
        
        // Combos
        getComboRecommendations,
        
        // Flash Deals
        getActiveFlashDeals
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveRewardsEngine;
}
