/**
 * CRAVE Rewards Configuration
 * Centralized configuration for the entire rewards ecosystem
 */

const CraveRewardsConfig = {
    // Point System
    points: {
        currency: 'GHS',
        exchangeRate: 1, // 1 GHS = 1 Point
        multiplier: {
            bronze: 1,
            silver: 1.25,
            gold: 1.5,
            diamond: 2,
            elite: 2.5
        }
    },

    // Reward Milestones
    milestones: [
        {
            points: 100,
            reward: 'Free Drink',
            icon: '🥤',
            description: 'Complimentary beverage of your choice'
        },
        {
            points: 250,
            reward: 'Free Dessert',
            icon: '🍰',
            description: 'Indulge in any dessert on the menu'
        },
        {
            points: 500,
            reward: 'Free Loaded Fries',
            icon: '🍟',
            description: 'Our signature loaded fries with toppings'
        },
        {
            points: 750,
            reward: 'Premium Combo',
            icon: '🍔',
            description: 'Complete meal with main, side, and drink'
        },
        {
            points: 1000,
            reward: 'VIP Reward',
            icon: '👑',
            description: 'Exclusive VIP experience with special treatment'
        }
    ],

    // Customer Tiers
    tiers: {
        bronze: {
            name: 'Bronze',
            minPoints: 0,
            color: '#CD7F32',
            benefits: ['Standard point earning', 'Basic promotions'],
            icon: '🥉'
        },
        silver: {
            name: 'Silver',
            minPoints: 500,
            color: '#C0C0C0',
            benefits: ['1.25x point multiplier', 'Priority support', 'Exclusive promotions'],
            icon: '🥈'
        },
        gold: {
            name: 'Gold',
            minPoints: 1500,
            color: '#FFD700',
            benefits: ['1.5x point multiplier', 'Priority orders', 'Birthday rewards', 'Exclusive meals'],
            icon: '🥇'
        },
        diamond: {
            name: 'Diamond',
            minPoints: 3000,
            color: '#B9F2FF',
            benefits: ['2x point multiplier', 'Priority orders', 'Birthday rewards', 'Exclusive meals', 'Secret menu access', 'VIP promotions'],
            icon: '💎'
        },
        elite: {
            name: 'Elite',
            minPoints: 5000,
            color: '#9D00FF',
            benefits: ['2.5x point multiplier', 'Priority orders', 'Birthday rewards', 'Exclusive meals', 'Secret menu access', 'VIP promotions', 'Double points days', 'Premium support', 'Early access'],
            icon: '⭐'
        }
    },

    // VIP Membership
    vip: {
        name: 'CRAVE VIP',
        price: 50, // GHS per month
        benefits: [
            'Priority Orders',
            'Exclusive Meals',
            'Birthday Gifts',
            'Secret Menu Access',
            'VIP Promotions',
            'Double Points Days',
            'Premium Support',
            'VIP Badge',
            'Early Access to New Items',
            'Free Delivery on Orders Over GHS 30'
        ]
    },

    // Promo Codes
    promoCodes: {
        WELCOME10: {
            type: 'percentage',
            value: 10,
            description: 'Welcome discount for new customers',
            minOrder: 20,
            maxDiscount: 15,
            usageLimit: 1,
            expiry: null,
            newCustomerOnly: true
        },
        WELCOME20: {
            type: 'percentage',
            value: 20,
            description: 'Special welcome offer',
            minOrder: 50,
            maxDiscount: 30,
            usageLimit: 1,
            expiry: null,
            newCustomerOnly: true
        },
        FREEDELIVERY: {
            type: 'free_delivery',
            value: 0,
            description: 'Free delivery on your order',
            minOrder: 30,
            maxDiscount: null,
            usageLimit: 3,
            expiry: null,
            newCustomerOnly: false
        },
        LUNCH10: {
            type: 'percentage',
            value: 10,
            description: 'Lunch time special',
            minOrder: 25,
            maxDiscount: 20,
            usageLimit: 5,
            expiry: null,
            timeRestriction: { start: '11:00', end: '14:00' },
            newCustomerOnly: false
        },
        FRIDAY15: {
            type: 'percentage',
            value: 15,
            description: 'Friday special',
            minOrder: 40,
            maxDiscount: 25,
            usageLimit: 5,
            expiry: null,
            dayRestriction: [5], // Friday
            newCustomerOnly: false
        },
        VIP25: {
            type: 'percentage',
            value: 25,
            description: 'VIP exclusive discount',
            minOrder: 50,
            maxDiscount: 40,
            usageLimit: 10,
            expiry: null,
            tierRestriction: ['gold', 'diamond', 'elite'],
            newCustomerOnly: false
        },
        LOYAL20: {
            type: 'percentage',
            value: 20,
            description: 'Loyalty reward',
            minOrder: 40,
            maxDiscount: 30,
            usageLimit: 5,
            expiry: null,
            minOrders: 10,
            newCustomerOnly: false
        }
    },

    // Spin & Win Configuration
    spinWheel: {
        unlockConditions: {
            firstOrder: true,
            minSpend: 50,
            referralMilestone: 3
        },
        prizes: [
            { name: 'Free Drink', icon: '🥤', weight: 15, type: 'free_item' },
            { name: 'Free Fries', icon: '🍟', weight: 12, type: 'free_item' },
            { name: 'Free Dessert', icon: '🍰', weight: 10, type: 'free_item' },
            { name: '5% Off', icon: '🏷️', weight: 20, type: 'percentage', value: 5 },
            { name: '10% Off', icon: '🏷️', weight: 15, type: 'percentage', value: 10 },
            { name: '15% Off', icon: '🏷️', weight: 10, type: 'percentage', value: 15 },
            { name: '20% Off', icon: '🏷️', weight: 5, type: 'percentage', value: 20 },
            { name: 'Double Points', icon: '⭐', weight: 8, type: 'multiplier', value: 2 },
            { name: 'Free Delivery', icon: '🚚', weight: 10, type: 'free_delivery' },
            { name: 'Mystery Gift', icon: '🎁', weight: 5, type: 'mystery' },
            { name: 'Extra Spin', icon: '🎡', weight: 5, type: 'extra_spin' }
        ],
        spinCooldown: 24 * 60 * 60 * 1000, // 24 hours
        maxSpinsPerDay: 3
    },

    // Achievements
    achievements: {
        first_order: {
            name: 'First Order',
            icon: '🎉',
            description: 'Complete your first order',
            points: 50,
            condition: 'orders >= 1'
        },
        loaded_fries_lover: {
            name: 'Loaded Fries Lover',
            icon: '🍟',
            description: 'Order loaded fries 5 times',
            points: 100,
            condition: 'item_orders["Loaded Fries"] >= 5'
        },
        smoothie_master: {
            name: 'Smoothie Master',
            icon: '🥤',
            description: 'Order 10 smoothies',
            points: 150,
            condition: 'item_orders["Smoothie"] >= 10'
        },
        dessert_addict: {
            name: 'Dessert Addict',
            icon: '🍰',
            description: 'Order 8 desserts',
            points: 120,
            condition: 'item_orders["Dessert"] >= 8'
        },
        weekend_foodie: {
            name: 'Weekend Foodie',
            icon: '🌟',
            description: 'Order 5 times on weekends',
            points: 100,
            condition: 'weekend_orders >= 5'
        },
        breakfast_lover: {
            name: 'Breakfast Lover',
            icon: '🍳',
            description: 'Order breakfast 7 times',
            points: 130,
            condition: 'breakfast_orders >= 7'
        },
        midnight_craver: {
            name: 'Midnight Craver',
            icon: '🌙',
            description: 'Order after 10 PM 3 times',
            points: 80,
            condition: 'late_night_orders >= 3'
        },
        vip_customer: {
            name: 'VIP Customer',
            icon: '👑',
            description: 'Reach Gold tier',
            points: 200,
            condition: 'tier >= "gold"'
        },
        legend: {
            name: 'Legend',
            icon: '🏆',
            description: 'Reach Elite tier',
            points: 500,
            condition: 'tier >= "elite"'
        },
        big_spender: {
            name: 'Big Spender',
            icon: '💰',
            description: 'Spend over GHS 500 total',
            points: 150,
            condition: 'total_spent >= 500'
        },
        loyal_customer: {
            name: 'Loyal Customer',
            icon: '❤️',
            description: 'Order 20 times',
            points: 200,
            condition: 'orders >= 20'
        },
        referral_hero: {
            name: 'Referral Hero',
            icon: '🤝',
            description: 'Refer 5 friends',
            points: 250,
            condition: 'referrals >= 5'
        }
    },

    // Daily Rewards
    dailyRewards: {
        streaks: {
            1: { points: 10, reward: 'Bonus Points' },
            2: { points: 15, reward: 'Bonus Points' },
            3: { points: 20, reward: '5% Discount' },
            4: { points: 25, reward: 'Bonus Points' },
            5: { points: 30, reward: 'Free Drink Chance' },
            6: { points: 35, reward: 'Bonus Points' },
            7: { points: 50, reward: '10% Discount' },
            14: { points: 100, reward: 'Free Dessert' },
            30: { points: 200, reward: 'Premium Combo' }
        },
        resetTime: '00:00' // Midnight
    },

    // Referral System
    referral: {
        friendReward: {
            type: 'fixed',
            value: 15,
            description: 'GH₵15 discount'
        },
        referrerReward: {
            type: 'credit',
            value: 20,
            description: 'GH₵20 credit'
        },
        maxReferrals: 50
    },

    // Birthday Rewards
    birthday: {
        reward: {
            type: 'free_item',
            description: 'Free Dessert',
            icon: '🎂'
        },
        notificationDaysBefore: 3,
        validityDays: 7
    },

    // Surprise Rewards
    surpriseRewards: {
        enabled: true,
        probability: 0.05, // 5% chance
        rewards: [
            { type: 'free_item', description: 'Free Smoothie', icon: '🥤' },
            { type: 'free_item', description: 'Free Dessert', icon: '🍰' },
            { type: 'points', value: 50, description: '50 Bonus Points', icon: '⭐' },
            { type: 'free_delivery', description: 'Free Delivery', icon: '🚚' },
            { type: 'percentage', value: 10, description: '10% Off', icon: '🏷️' }
        ],
        minOrders: 3,
        minTier: 'silver'
    },

    // Flash Deals
    flashDeals: {
        happyHour: {
            enabled: true,
            time: { start: '17:00', end: '19:00' },
            discount: 15,
            description: 'Happy Hour - 15% Off'
        },
        weekendSpecial: {
            enabled: true,
            days: [5, 6], // Friday, Saturday
            discount: 20,
            description: 'Weekend Special - 20% Off'
        },
        breakfastDeals: {
            enabled: true,
            time: { start: '07:00', end: '10:00' },
            discount: 10,
            description: 'Breakfast Deal - 10% Off'
        },
        lunchDeals: {
            enabled: true,
            time: { start: '12:00', end: '14:00' },
            discount: 12,
            description: 'Lunch Deal - 12% Off'
        },
        lateNightDeals: {
            enabled: true,
            time: { start: '21:00', end: '23:59' },
            discount: 15,
            description: 'Late Night Deal - 15% Off'
        }
    },

    // Combo Builder
    combos: [
        {
            name: 'Classic Combo',
            items: ['Burger', 'Fries', 'Drink'],
            savings: 15,
            description: 'Complete your meal and save GHS 15'
        },
        {
            name: 'Family Feast',
            items: ['2 Burgers', 'Large Fries', '2 Drinks', 'Dessert'],
            savings: 30,
            description: 'Perfect for sharing - save GHS 30'
        },
        {
            name: 'Sweet Treat',
            items: ['Dessert', 'Drink'],
            savings: 8,
            description: 'Indulge and save GHS 8'
        },
        {
            name: 'Power Lunch',
            items: ['Main', 'Side', 'Drink'],
            savings: 12,
            description: 'Fuel up and save GHS 12'
        }
    ],

    // Notification Settings
    notifications: {
        enabled: true,
        sound: true,
        vibration: true,
        duration: 4000,
        position: 'top-right'
    },

    // Storage Keys
    storageKeys: {
        points: 'crave_points',
        tier: 'crave_tier',
        achievements: 'crave_achievements',
        promoCodesUsed: 'crave_promo_codes_used',
        spins: 'crave_spins',
        lastSpin: 'crave_last_spin',
        dailyStreak: 'crave_daily_streak',
        lastDailyClaim: 'crave_last_daily_claim',
        referrals: 'crave_referrals',
        birthday: 'crave_birthday',
        orders: 'crave_orders',
        totalSpent: 'crave_total_spent',
        vipStatus: 'crave_vip_status',
        vipExpiry: 'crave_vip_expiry',
        itemOrders: 'crave_item_orders',
        weekendOrders: 'crave_weekend_orders',
        breakfastOrders: 'crave_breakfast_orders',
        lateNightOrders: 'crave_late_night_orders',
        surpriseRewardLast: 'crave_surprise_reward_last'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveRewardsConfig;
}
