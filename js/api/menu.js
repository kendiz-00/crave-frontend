/**
 * CRAVE Menu API
 * Menu-specific API methods
 */

if (typeof window !== 'undefined' && !window.APIClient) {
    console.error('APIClient not loaded. Make sure api.js is loaded before menu.js');
}

const MenuAPI = (function() {
    'use strict';

    // Helper function to extract array from API response
    function extractApiArray(payload) {
        if (Array.isArray(payload)) return payload;
        if (payload && Array.isArray(payload.data)) return payload.data;
        return [];
    }

    /**
     * Get all menu items (fetches all pages)
     */
    async function getAllMenu() {
        if (!window.APIClient) throw new Error('API client not available');
        console.log('Fetching /api/menu (all pages)...');
        console.time('GET /api/menu (all pages)');
        
        let allItems = [];
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
            const result = await window.APIClient.get('/api/menu', { 
                params: { page: page },
                useCache: true, 
                cacheKey: `menu_all_page_${page}` 
            });
            
            const items = extractApiArray(result);
            allItems = allItems.concat(items);
            
            // Check if there are more pages
            if (result.pagination && result.pagination.page < result.pagination.totalPages) {
                page++;
            } else {
                hasMore = false;
            }
        }
        
        console.timeEnd('GET /api/menu (all pages)');
        console.log(`Menu received: ${allItems.length} total items`);
        
        // Return in same format as API response
        return { success: true, data: allItems };
    }

    /**
     * Get featured menu items
     */
    async function getFeaturedMenu() {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.get('/api/menu/featured', { useCache: true, cacheKey: 'menu_featured' });
    }

    /**
     * Search menu items
     */
    async function searchMenu(query) {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.get('/api/menu/search', { 
            params: { q: query },
            useCache: true,
            cacheKey: `menu_search_${query}`
        });
    }

    /**
     * Get menu items by category slug
     */
    async function getMenuByCategory(categorySlug) {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.get(`/api/menu/category/${categorySlug}`, { 
            useCache: true,
            cacheKey: `menu_category_${categorySlug}`
        });
    }

    /**
     * Get all categories
     */
    async function getAllCategories() {
        if (!window.APIClient) throw new Error('API client not available');
        console.log('Fetching /api/categories...');
        console.time('GET /api/categories');
        const result = await window.APIClient.get('/api/categories', { useCache: true, cacheKey: 'categories_all' });
        console.timeEnd('GET /api/categories');
        console.log('Categories received');
        return result;
    }

    /**
     * Get category by slug
     */
    async function getCategoryBySlug(slug) {
        if (!window.APIClient) throw new Error('API client not available');
        return await window.APIClient.get(`/api/categories/${slug}`, { useCache: true });
    }

    /**
     * Clear menu-related cache
     */
    function clearMenuCache() {
        if (!window.APIClient) return;
        window.APIClient.clearCache('menu_all');
        window.APIClient.clearCache('menu_featured');
        window.APIClient.clearCache('categories_all');
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
