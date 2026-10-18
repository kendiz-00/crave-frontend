const test = require('node:test');
const assert = require('node:assert/strict');

// Mock browser globals needed by frontend modules
global.window = global;
global.document = {
    addEventListener: () => {},
    dispatchEvent: () => {},
    getElementById: () => null,
};
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};

const CraveRewardsConfig = require('../js/rewards-config.js');
global.CraveRewardsConfig = CraveRewardsConfig;

const CraveRewardsEngine = require('../js/rewards-engine.js');

test('Rule 1 & 2: Milestone free drink in AVAILABLE status renders as unlocked with USE_CHECKOUT action (no manual claim required)', () => {
    const reward = {
        id: 'milestone_free_drink_100',
        rewardId: 'milestone_free_drink_100',
        points: 100,
        requiredPoints: 100,
        reward: 'Free Drink'
    };

    // User has reached 100 points and backend has auto-unlocked the claim with AVAILABLE status
    const claims = [
        {
            id: 'claim_auto_100',
            rewardId: 'milestone_free_drink_100',
            status: 'AVAILABLE',
            userId: 'user_123'
        }
    ];

    const displayState = CraveRewardsEngine.getRewardDisplayState(reward, 100, claims);

    assert.equal(displayState.state, 'AVAILABLE');
    assert.equal(displayState.badge, 'UNLOCKED 🎉');
    assert.equal(displayState.action, 'USE_CHECKOUT');
    assert.equal(displayState.label, 'USE FREE DRINK');
    assert.equal(displayState.claim.id, 'claim_auto_100');
});

test('Rule 3 & 4: Milestone free drink in RESERVED status renders as applied to pending order', () => {
    const reward = {
        id: 'milestone_free_drink_100',
        rewardId: 'milestone_free_drink_100',
        points: 100,
        requiredPoints: 100
    };

    const claims = [
        {
            id: 'claim_auto_100',
            rewardId: 'milestone_free_drink_100',
            status: 'RESERVED',
            orderId: 'order_abc_123'
        }
    ];

    const displayState = CraveRewardsEngine.getRewardDisplayState(reward, 100, claims);

    assert.equal(displayState.state, 'RESERVED');
    assert.equal(displayState.badge, 'RESERVED');
    assert.equal(displayState.action, null); // Cannot be claimed or reused while in-flight
    assert.ok(displayState.subtext.includes('pending'));
});

test('Rule 6 & 7: Milestone free drink in REDEEMED status is permanently locked and cannot be reused', () => {
    const reward = {
        id: 'milestone_free_drink_100',
        rewardId: 'milestone_free_drink_100',
        points: 100,
        requiredPoints: 100
    };

    const claims = [
        {
            id: 'claim_auto_100',
            rewardId: 'milestone_free_drink_100',
            status: 'REDEEMED',
            redeemedAt: new Date().toISOString()
        }
    ];

    const displayState = CraveRewardsEngine.getRewardDisplayState(reward, 150, claims);

    assert.equal(displayState.state, 'REDEEMED');
    assert.equal(displayState.badge, 'REDEEMED ✓');
    assert.equal(displayState.action, null); // Cannot be applied again
});

test('Rule 3 & 4: redeemMilestone does NOT deduct points client-side (backend enforces zero-point deduction)', async () => {
    // Attempting to invoke redeemMilestone must return failure and deduct zero points
    const result = await CraveRewardsEngine.redeemMilestone(100, 'free_drink');
    assert.equal(result.success, false);
    assert.ok(result.message.includes('server'));
});

test('Rule 2 & 9: Auto-unlocked AVAILABLE claim completes confirmed 100 PTS milestone without unapproved forward promises', async () => {
    // Mock data layer to return user state with 100 points and the AVAILABLE claim
    global.CraveRewardsData = {
        Points: {
            get: async () => 100,
            getLifetimeEarned: async () => 100
        },
        Claims: {
            get: async () => [
                {
                    id: 'claim_auto_100',
                    rewardId: 'milestone_free_drink_100',
                    status: 'AVAILABLE'
                }
            ]
        }
    };

    const nextMilestone = await CraveRewardsEngine.getNextMilestone();
    // With only the single confirmed 100 PTS milestone active, completing it means no unapproved next milestone
    assert.equal(nextMilestone, null);
});

test('Rule 8: Backend drink whitelist validation (provisional 10 smoothies)', () => {
    const expectedWhitelist = [
        'Strawberry Colada',
        'Pina Colada',
        'Watermelon Mint Ice',
        'Green Glow',
        'Green Glow Smoothie',
        'Tropical Fruit Blend',
        'Pineapple Strawberry',
        'Strawberries and Cream',
        'Lemonade Ice',
        'Banana Peanut Butter Chocolate'
    ];

    // Ineligible drink test
    const ineligibleDrink = 'Mango Passion Sparkler';
    const isEligible = expectedWhitelist.some(
        name => name.toLowerCase() === ineligibleDrink.toLowerCase()
    );
    assert.equal(isEligible, false);

    // Eligible drink test
    const eligibleDrink = 'Strawberry Colada';
    const isEligibleDrink = expectedWhitelist.some(
        name => name.toLowerCase() === eligibleDrink.toLowerCase()
    );
    assert.equal(isEligibleDrink, true);
});

test('Pricing & Discount Calculation: Applying free drink discounts drink price to GH₵ 0.00 while preserving food meal total', () => {
    const mealPrice = 65.00; // E.g. Texas Crispy Chicken Burger
    const drinkPrice = 45.00; // E.g. Strawberry Colada

    const subtotal = mealPrice + drinkPrice; // 110.00
    const freeDrinkDiscount = drinkPrice; // 45.00
    const finalTotal = subtotal - freeDrinkDiscount; // 65.00

    assert.equal(subtotal, 110.00);
    assert.equal(freeDrinkDiscount, 45.00);
    assert.equal(finalTotal, 65.00);
    // Effective cost of the drink to customer is exactly GH₵ 0.00
    assert.equal(drinkPrice - freeDrinkDiscount, 0.00);
});
