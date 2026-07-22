/**
 * CRAVE Menu API
 * Menu-specific API methods
 */

const APIClient = typeof APIClient !== 'undefined' ? APIClient : null;

if (!APIClient) {
    console.error('APIClient not loaded. Make sure api.js is loaded before menu.js');
}

const MenuAPI = (function() {
    'use strict';

    /**
     * Get all menu items
     */
    async function getAllMenu() {
        if (!APIClient) throw new Error('API client not available');
        return await APIClient.get('/menu', { useCache: true, cacheKey: 'menu_all' });
    }

    /**
     * Get featured menu items
     */
    async function getFeaturedMenu() {
        if (!APIClient) throw new Error('API client not available');
        return await APIClient.get('/menu/featured', { useCache: true, cacheKey: 'menu_featured' });
    }

    /**
     * Search menu items
     */
    async function searchMenu(query) {
        if (!APIClient) throw new Error('API client not available');
        return await APIClient.get('/menu/search', { 
            params: { q: query },
            useCache: true,
            cacheKey: `menu_search_${query}`
        });
    }

    /**
     * Get menu items by category slug
     */
    async function getMenuByCategory(categorySlug) {
        if (!APIClient) throw new Error('API client not available');
        return await APIClient.get(`/menu/category/${categorySlug}`, { 
            useCache: true,
            cacheKey: `menu_category_${categorySlug}`
        });
    }

    /**
     * Get all categories
     */
    async function getAllCategories() {
        if (!APIClient) throw new Error('API client not available');
        return await APIClient.get('/categories', { useCache: true, cacheKey: 'categories_all' });
    }

    /**
     * Get category by slug
     */
    async function getCategoryBySlug(slug) {
        if (!APIClient) throw new Error('API client not available');
        return await APIClient.get(`/categories/${slug}`, { useCache: true });
    }

    /**
     * Clear menu-related cache
     */
    function clearMenuCache() {
        if (!APIClient) return;
        APIClient.clearCache('menu_all');
        APIClient.clearCache('menu_featured');
        APIClient.clearCache('categories_all');
    }

    // Public API
    return {
        getAll: getAllMenu,
        getFeatured: getFeaturedMenu,
        search: searchMenu,
        getByCategory: getMenuByCategory,
        getCategories: getAllCategories,
        getCategory: getCategoryBySlug,
        clearCache: clearMenuCache
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuAPI;
}
