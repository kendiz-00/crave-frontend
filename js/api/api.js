/**
 * CRAVE API Client
 * Reusable fetch wrapper with error handling, loading states, and caching
 */

const APIConfig = typeof APIConfig !== 'undefined' ? APIConfig : {
    baseURL: 'http://localhost:3001/api',
    timeout: 10000,
    cacheDuration: 5 * 60 * 1000,
    retry: {
        maxAttempts: 3,
        delay: 1000,
        backoffMultiplier: 2
    }
};

const APIClient = (function() {
    'use strict';

    // Simple in-memory cache
    const cache = new Map();

    /**
     * Get cached response if available and not expired
     */
    function getCached(key) {
        const cached = cache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > APIConfig.cacheDuration) {
            cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    /**
     * Store response in cache
     */
    function setCache(key, data) {
        cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear cache for a specific key or all cache
     */
    function clearCache(key) {
        if (key) {
            cache.delete(key);
        } else {
            cache.clear();
        }
    }

    /**
     * Create AbortController for timeout
     */
    function createTimeout(timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        return { controller, timeoutId };
    }

    /**
     * Delay function for retry logic
     */
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Make HTTP request with retry logic
     */
    async function fetchWithRetry(url, options, attempt = 1) {
        try {
            const { controller, timeoutId } = createTimeout(APIConfig.timeout);
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = new Error(`HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.response = response;
                throw error;
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            // Retry on network errors or 5xx errors
            const shouldRetry = 
                attempt < APIConfig.retry.maxAttempts &&
                (error.name === 'TypeError' || 
                 (error.status && error.status >= 500));

            if (shouldRetry) {
                const retryDelay = APIConfig.retry.delay * Math.pow(APIConfig.retry.backoffMultiplier, attempt - 1);
                await delay(retryDelay);
                return fetchWithRetry(url, options, attempt + 1);
            }

            throw error;
        }
    }

    /**
     * Build full URL from endpoint
     */
    function buildURL(endpoint, params = {}) {
        const url = new URL(APIConfig.baseURL + endpoint);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        return url.toString();
    }

    /**
     * Generic GET request
     */
    async function get(endpoint, options = {}) {
        const {
            params = {},
            useCache = true,
            cacheKey = null,
            headers = {}
        } = options;

        const key = cacheKey || endpoint + JSON.stringify(params);
        
        // Check cache first
        if (useCache) {
            const cached = getCached(key);
            if (cached) {
                return cached;
            }
        }

        const url = buildURL(endpoint, params);
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const data = await fetchWithRetry(url, requestOptions);
        
        // Cache the response
        if (useCache) {
            setCache(key, data);
        }

        return data;
    }

    /**
     * Generic POST request
     */
    async function post(endpoint, body, options = {}) {
        const {
            headers = {}
        } = options;

        const url = buildURL(endpoint);
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(body)
        };

        return await fetchWithRetry(url, requestOptions);
    }

    /**
     * Generic PUT request
     */
    async function put(endpoint, body, options = {}) {
        const {
            headers = {}
        } = options;

        const url = buildURL(endpoint);
        const requestOptions = {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: JSON.stringify(body)
        };

        return await fetchWithRetry(url, requestOptions);
    }

    /**
     * Generic DELETE request
     */
    async function del(endpoint, options = {}) {
        const {
            headers = {}
        } = options;

        const url = buildURL(endpoint);
        const requestOptions = {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        return await fetchWithRetry(url, requestOptions);
    }

    // Public API
    return {
        get,
        post,
        put,
        delete: del,
        clearCache,
        buildURL
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
