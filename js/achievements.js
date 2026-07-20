/**
 * CRAVE Achievement System
 * Gamification with badges and progress tracking
 */

const CraveAchievements = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const data = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData : null;
    const engine = typeof CraveRewardsEngine !== 'undefined' ? CraveRewardsEngine : null;
    const notifications = typeof CraveRewardsNotifications !== 'undefined' ? CraveRewardsNotifications : null;

    // Get all achievements
    function getAllAchievements() {
        if (!config) return [];
        
        return Object.entries(config.achievements).map(([key, achievement]) => ({
            key,
            ...achievement,
            unlocked: data ? data.Achievements.has(key) : false
        }));
    }

    // Get unlocked achievements
    function getUnlockedAchievements() {
        if (!config || !data) return [];
        
        const unlocked = data.Achievements.get();
        return unlocked.map(key => ({
            key,
            ...config.achievements[key]
        }));
    }

    // Get locked achievements
    function getLockedAchievements() {
        if (!config || !data) return [];
        
        const unlocked = data.Achievements.get();
        return Object.entries(config.achievements)
            .filter(([key]) => !unlocked.includes(key))
            .map(([key, achievement]) => ({
                key,
                ...achievement
            }));
    }

    // Get achievement progress
    function getAchievementProgress(key) {
        if (!config || !data) return null;
        
        const achievement = config.achievements[key];
        if (!achievement) return null;
        
        const condition = achievement.condition;
        let progress = 0;
        let target = 0;
        let current = 0;
        
        // Parse condition to get progress
        if (condition.includes('orders >=')) {
            target = parseInt(condition.match(/\d+/)[0]);
            current = data.Orders.getCount();
            progress = Math.min(100, (current / target) * 100);
        }
        
        if (condition.includes('item_orders[')) {
            const match = condition.match(/item_orders\["(.+)"\] >= (\d+)/);
            if (match) {
                const itemName = match[1];
                target = parseInt(match[2]);
                current = data.ItemOrders.getCount(itemName);
                progress = Math.min(100, (current / target) * 100);
            }
        }
        
        if (condition.includes('weekend_orders >=')) {
            target = parseInt(condition.match(/\d+/)[0]);
            current = data.TimeOrders.getWeekendOrders();
            progress = Math.min(100, (current / target) * 100);
        }
        
        if (condition.includes('breakfast_orders >=')) {
            target = parseInt(condition.match(/\d+/)[0]);
            current = data.TimeOrders.getBreakfastOrders();
            progress = Math.min(100, (current / target) * 100);
        }
        
        if (condition.includes('late_night_orders >=')) {
            target = parseInt(condition.match(/\d+/)[0]);
            current = data.TimeOrders.getLateNightOrders();
            progress = Math.min(100, (current / target) * 100);
        }
        
        if (condition.includes('total_spent >=')) {
            target = parseInt(condition.match(/\d+/)[0]);
            current = data.Orders.getTotalSpent();
            progress = Math.min(100, (current / target) * 100);
        }
        
        if (condition.includes('referrals >=')) {
            target = parseInt(condition.match(/\d+/)[0]);
            current = data.Referrals.getCompletedCount();
            progress = Math.min(100, (current / target) * 100);
        }
        
        if (condition.includes('tier >=')) {
            const tier = condition.match(/tier >= "(.+)"/)[1];
            const currentTier = data.Tier.get();
            const tierOrder = ['bronze', 'silver', 'gold', 'diamond', 'elite'];
            const currentIndex = tierOrder.indexOf(currentTier);
            const targetIndex = tierOrder.indexOf(tier);
            progress = Math.min(100, (currentIndex / targetIndex) * 100);
        }
        
        return {
            key,
            name: achievement.name,
            icon: achievement.icon,
            description: achievement.description,
            points: achievement.points,
            progress,
            current,
            target,
            unlocked: data.Achievements.has(key)
        };
    }

    // Check for new achievements
    function checkAchievements() {
        if (!engine) return [];
        
        engine.checkAchievements();
        return getUnlockedAchievements();
    }

    // Get achievement count
    function getAchievementCount() {
        if (!config || !data) return { unlocked: 0, total: 0 };
        
        const unlocked = data.Achievements.get().length;
        const total = Object.keys(config.achievements).length;
        
        return { unlocked, total };
    }

    // Get total points from achievements
    function getTotalAchievementPoints() {
        if (!config) return 0;
        
        let total = 0;
        for (const achievement of Object.values(config.achievements)) {
            total += achievement.points;
        }
        
        return total;
    }

    // Get earned points from achievements
    function getEarnedAchievementPoints() {
        if (!config || !data) return 0;
        
        const unlocked = data.Achievements.get();
        let earned = 0;
        
        for (const key of unlocked) {
            if (config.achievements[key]) {
                earned += config.achievements[key].points;
            }
        }
        
        return earned;
    }

    // Get achievement by key
    function getAchievement(key) {
        if (!config) return null;
        
        const achievement = config.achievements[key];
        if (!achievement) return null;
        
        return {
            key,
            ...achievement,
            unlocked: data ? data.Achievements.has(key) : false
        };
    }

    // Get achievements by category
    function getAchievementsByCategory(category) {
        const achievements = getAllAchievements();
        
        // Simple categorization based on achievement type
        const categories = {
            ordering: ['first_order', 'loyal_customer', 'big_spender'],
            food: ['loaded_fries_lover', 'smoothie_master', 'dessert_addict'],
            time: ['weekend_foodie', 'breakfast_lover', 'midnight_craver'],
            status: ['vip_customer', 'legend'],
            social: ['referral_hero']
        };
        
        if (categories[category]) {
            return achievements.filter(a => categories[category].includes(a.key));
        }
        
        return achievements;
    }

    // Get achievement rarity
    function getAchievementRarity(key) {
        const achievement = getAchievement(key);
        if (!achievement) return 'common';
        
        if (achievement.points >= 200) return 'legendary';
        if (achievement.points >= 150) return 'epic';
        if (achievement.points >= 100) return 'rare';
        return 'common';
    }

    // Get recent achievements
    function getRecentAchievements(count = 5) {
        // This would require tracking when achievements were unlocked
        // For now, return the most recently unlocked
        return getUnlockedAchievements().slice(-count);
    }

    // Register event listeners for achievement unlocks
    function onAchievementUnlocked(callback) {
        if (!engine) return;
        
        engine.on('achievement_unlocked', callback);
    }

    // Public API
    return {
        getAll: getAllAchievements,
        getUnlocked: getUnlockedAchievements,
        getLocked: getLockedAchievements,
        getProgress: getAchievementProgress,
        check: checkAchievements,
        getCount: getAchievementCount,
        getTotalPoints: getTotalAchievementPoints,
        getEarnedPoints: getEarnedAchievementPoints,
        get: getAchievement,
        getByCategory: getAchievementsByCategory,
        getRarity: getAchievementRarity,
        getRecent: getRecentAchievements,
        onUnlocked: onAchievementUnlocked
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveAchievements;
}
