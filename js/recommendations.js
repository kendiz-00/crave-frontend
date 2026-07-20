/**
 * CRAVE Recommendation Engine
 * AI-powered product recommendations based on customer behavior
 */

const CraveRecommendations = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const data = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData : null;
    const engine = typeof CraveRewardsEngine !== 'undefined' ? CraveRewardsEngine : null;

    // Sample menu data (in production, this would come from your menu API)
    const menuItems = [
        { name: 'Loaded Fries', category: 'Sides', price: 25, popular: true },
        { name: 'Classic Burger', category: 'Main', price: 45, popular: true },
        { name: 'Chicken Burger', category: 'Main', price: 40, popular: true },
        { name: 'Smoothie', category: 'Drinks', price: 20, popular: true },
        { name: 'Chocolate Cake', category: 'Dessert', price: 15, popular: true },
        { name: 'Ice Cream', category: 'Dessert', price: 12, popular: false },
        { name: 'Fries', category: 'Sides', price: 15, popular: false },
        { name: 'Soda', category: 'Drinks', price: 8, popular: false },
        { name: 'Salad', category: 'Main', price: 30, popular: false },
        { name: 'Chicken Wings', category: 'Main', price: 35, popular: true }
    ];

    // Get recommendations based on purchase history
    function getRecommendationsBasedOnHistory() {
        if (!data) return [];
        
        const itemOrders = data.ItemOrders.get();
        const recommendations = [];
        
        // Find frequently ordered items
        const sortedItems = Object.entries(itemOrders)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        // Find similar items
        for (const [itemName, count] of sortedItems) {
            const item = menuItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
            if (item) {
                const similarItems = menuItems.filter(i => 
                    i.category === item.category && 
                    i.name.toLowerCase() !== itemName.toLowerCase()
                );
                
                recommendations.push(...similarItems.map(i => ({
                    ...i,
                    reason: `Similar to ${itemName}`,
                    confidence: Math.min(90, count * 10)
                })));
            }
        }
        
        return recommendations.slice(0, 5);
    }

    // Get recommendations based on cart contents
    function getRecommendationsBasedOnCart(cartItems) {
        if (!cartItems || cartItems.length === 0) return [];
        
        const recommendations = [];
        const cartCategories = cartItems.map(item => item.category);
        
        // Find items that complement cart items
        for (const cartItem of cartItems) {
            const item = menuItems.find(i => i.name.toLowerCase() === cartItem.name.toLowerCase());
            if (item) {
                const complementaryItems = menuItems.filter(i => 
                    i.category !== item.category &&
                    !cartCategories.includes(i.category)
                );
                
                recommendations.push(...complementaryItems.map(i => ({
                    ...i,
                    reason: `Perfect with your ${item.name}`,
                    confidence: 70
                })));
            }
        }
        
        return recommendations.slice(0, 5);
    }

    // Get popular items
    function getPopularItems() {
        return menuItems
            .filter(item => item.popular)
            .map(item => ({
                ...item,
                reason: 'Popular choice',
                confidence: 80
            }));
    }

    // Get recommendations based on time of day
    function getRecommendationsBasedOnTime() {
        const hour = new Date().getHours();
        let recommendations = [];
        
        if (hour >= 7 && hour < 11) {
            // Breakfast
            recommendations = menuItems
                .filter(item => item.category === 'Main')
                .map(item => ({
                    ...item,
                    reason: 'Great for breakfast',
                    confidence: 75
                }));
        } else if (hour >= 11 && hour < 14) {
            // Lunch
            recommendations = menuItems
                .filter(item => item.category === 'Main' || item.category === 'Sides')
                .map(item => ({
                    ...item,
                    reason: 'Perfect for lunch',
                    confidence: 75
                }));
        } else if (hour >= 17 && hour < 21) {
            // Dinner
            recommendations = menuItems
                .filter(item => item.category === 'Main')
                .map(item => ({
                    ...item,
                    reason: 'Great for dinner',
                    confidence: 75
                }));
        } else {
            // Late night
            recommendations = menuItems
                .filter(item => item.category === 'Sides' || item.category === 'Dessert')
                .map(item => ({
                    ...item,
                    reason: 'Late night craving',
                    confidence: 70
                }));
        }
        
        return recommendations.slice(0, 5);
    }

    // Get "frequently bought together" recommendations
    function getFrequentlyBoughtTogether(itemName) {
        if (!data) return [];
        
        const itemOrders = data.ItemOrders.get();
        const item = menuItems.find(i => i.name.toLowerCase() === itemName.toLowerCase());
        
        if (!item) return [];
        
        // Find items often ordered together (simplified logic)
        const recommendations = menuItems
            .filter(i => i.category !== item.category)
            .map(i => ({
                ...i,
                reason: 'Frequently bought together',
                confidence: 65
            }));
        
        return recommendations.slice(0, 3);
    }

    // Get personalized recommendations
    function getPersonalizedRecommendations() {
        const recommendations = [];
        
        // Add history-based recommendations
        recommendations.push(...getRecommendationsBasedOnHistory());
        
        // Add time-based recommendations
        recommendations.push(...getRecommendationsBasedOnTime());
        
        // Add popular items
        recommendations.push(...getPopularItems());
        
        // Remove duplicates and sort by confidence
        const unique = recommendations.filter((item, index, self) =>
            index === self.findIndex(t => t.name === item.name)
        );
        
        return unique
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 10);
    }

    // Get combo recommendations
    function getComboRecommendations(cartItems) {
        if (!engine) return [];
        
        return engine.getComboRecommendations(cartItems);
    }

    // Get "recommended for you" section
    function getRecommendedForYou() {
        const personalized = getPersonalizedRecommendations();
        
        return personalized.slice(0, 6).map(item => ({
            ...item,
            displayReason: item.reason
        }));
    }

    // Get "complete your meal" suggestions
    function getCompleteYourMeal(cartItems) {
        if (!cartItems || cartItems.length === 0) return [];
        
        const hasMain = cartItems.some(i => i.category === 'Main');
        const hasDrink = cartItems.some(i => i.category === 'Drinks');
        const hasSide = cartItems.some(i => i.category === 'Sides');
        const hasDessert = cartItems.some(i => i.category === 'Dessert');
        
        const suggestions = [];
        
        if (hasMain && !hasDrink) {
            suggestions.push(...menuItems
                .filter(i => i.category === 'Drinks')
                .map(i => ({
                    ...i,
                    reason: 'Add a drink to complete your meal',
                    type: 'drink'
                })));
        }
        
        if (hasMain && !hasSide) {
            suggestions.push(...menuItems
                .filter(i => i.category === 'Sides')
                .map(i => ({
                    ...i,
                    reason: 'Add a side to complete your meal',
                    type: 'side'
                })));
        }
        
        if (hasMain && !hasDessert) {
            suggestions.push(...menuItems
                .filter(i => i.category === 'Dessert')
                .map(i => ({
                    ...i,
                    reason: 'Add a dessert to complete your meal',
                    type: 'dessert'
                })));
        }
        
        return suggestions.slice(0, 4);
    }

    // Track recommendation clicks
    function trackRecommendationClick(itemName, reason) {
        if (!data) return;
        
        // In production, this would send analytics data
        console.log(`Recommendation clicked: ${itemName} (${reason})`);
    }

    // Public API
    return {
        getBasedOnHistory: getRecommendationsBasedOnHistory,
        getBasedOnCart: getRecommendationsBasedOnCart,
        getPopular: getPopularItems,
        getBasedOnTime: getRecommendationsBasedOnTime,
        getFrequentlyBoughtTogether: getFrequentlyBoughtTogether,
        getPersonalized: getPersonalizedRecommendations,
        getRecommendedForYou: getRecommendedForYou,
        getCompleteYourMeal: getCompleteYourMeal,
        getCombos: getComboRecommendations,
        trackClick: trackRecommendationClick
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveRecommendations;
}
