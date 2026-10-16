(function (root, factory) {
    const menuCategoryOrder = factory();

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = menuCategoryOrder;
    }
    if (root) {
        root.MenuCategoryOrder = menuCategoryOrder;
    }
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';

    const categories = [
        { slug: 'loaded-fries', name: 'Loaded Fries' },
        { slug: 'fried-rice', name: 'Fried Rice' },
        { slug: 'chicken-wings', name: 'Chicken & Wings' },
        { slug: 'american-classics', name: 'American Classics' },
        { slug: 'breakfast', name: 'Breakfast' },
        { slug: 'burgers', name: 'Burgers' },
        { slug: 'sandwiches', name: 'Sandwiches' },
        { slug: 'mexican-food', name: 'Mexican Food' },
        { slug: 'cakes-desserts', name: 'Cakes & Desserts' },
        { slug: 'smoothies-refreshers', name: 'Smoothies' }
    ];

    const categoryBySlug = new Map(categories.map(category => [category.slug, category]));
    const fallbackAliases = {
        'texas-chicken': 'chicken-wings',
        cupcakes: 'cakes-desserts',
        smoothies: 'smoothies-refreshers'
    };

    function normalizeSlug(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }

    function getPublicSlug(value) {
        const slug = normalizeSlug(value);
        return fallbackAliases[slug] || slug;
    }

    function orderCategories(input) {
        const categoriesByPublicSlug = new Map();
        (Array.isArray(input) ? input : []).forEach(category => {
            if (!category || typeof category !== 'object') return;
            const slug = getPublicSlug(category.slug || category.name);
            if (categoryBySlug.has(slug) && !categoriesByPublicSlug.has(slug)) {
                categoriesByPublicSlug.set(slug, category);
            }
        });

        return categories
            .filter(category => categoriesByPublicSlug.has(category.slug))
            .map(category => categoriesByPublicSlug.get(category.slug));
    }

    function orderMenuEntries(menuData) {
        const entriesByPublicSlug = new Map();
        Object.entries(menuData || {}).forEach(([key, category]) => {
            const slug = getPublicSlug(key);
            if (categoryBySlug.has(slug) && !entriesByPublicSlug.has(slug)) {
                entriesByPublicSlug.set(slug, category);
            }
        });

        return categories
            .filter(category => entriesByPublicSlug.has(category.slug))
            .map(category => ({
                slug: category.slug,
                category: entriesByPublicSlug.get(category.slug)
            }));
    }

    function getDisplayName(slug, fallbackName) {
        const category = categoryBySlug.get(getPublicSlug(slug));
        return category ? category.name : fallbackName;
    }

    return Object.freeze({
        categories: Object.freeze(categories.map(category => Object.freeze(category))),
        getDisplayName,
        getPublicSlug,
        orderCategories,
        orderMenuEntries
    });
});
