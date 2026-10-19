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

test('Stage 1 Non-negotiable Control: When redemption is disabled via options, milestone displays unlocked with redemption coming soon message and disabled action', () => {
    const reward = {
        id: 'milestone_free_drink_100',
        rewardId: 'milestone_free_drink_100',
        points: 100,
        requiredPoints: 100,
        reward: 'Free Drink'
    };

    const claims = [
        {
            id: 'claim_auto_100',
            rewardId: 'milestone_free_drink_100',
            status: 'AVAILABLE',
            userId: 'user_123'
        }
    ];

    // Explicitly pass redemptionEnabled: false
    const displayState = CraveRewardsEngine.getRewardDisplayState(reward, 100, claims, { redemptionEnabled: false });

    assert.equal(displayState.state, 'AVAILABLE');
    assert.equal(displayState.badge, 'UNLOCKED 🎉');
    assert.equal(displayState.action, null, 'Action must be null so no checkout button or link is rendered');
    assert.equal(displayState.disabled, true, 'Reward display state must be marked disabled');
    assert.equal(displayState.label, 'COMING SOON');
    assert.equal(displayState.subtext, 'Your free drink is unlocked! Redemption will be available soon.');
    assert.equal(displayState.claim.id, 'claim_auto_100', 'Earned claim record is preserved');
});

test('Stage 1 Non-negotiable Control: When redemption is disabled via window.REWARDS_FREE_DRINK_REDEMPTION_ENABLED = false, action is disabled', () => {
    global.window.REWARDS_FREE_DRINK_REDEMPTION_ENABLED = false;

    const reward = {
        id: 'milestone_free_drink_100',
        rewardId: 'milestone_free_drink_100',
        points: 100,
        requiredPoints: 100,
        reward: 'Free Drink'
    };

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
    assert.equal(displayState.action, null);
    assert.equal(displayState.disabled, true);
    assert.equal(displayState.subtext, 'Your free drink is unlocked! Redemption will be available soon.');

    // Cleanup global
    delete global.window.REWARDS_FREE_DRINK_REDEMPTION_ENABLED;
});

test('Stage 1 Future Activation: When redemption is explicitly enabled (true), USE_CHECKOUT action is restored', () => {
    global.window.REWARDS_FREE_DRINK_REDEMPTION_ENABLED = true;

    const reward = {
        id: 'milestone_free_drink_100',
        rewardId: 'milestone_free_drink_100',
        points: 100,
        requiredPoints: 100,
        reward: 'Free Drink'
    };

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
    assert.equal(displayState.action, 'USE_CHECKOUT');
    assert.equal(displayState.disabled, false);
    assert.equal(displayState.label, 'USE FREE DRINK');

    delete global.window.REWARDS_FREE_DRINK_REDEMPTION_ENABLED;
});
