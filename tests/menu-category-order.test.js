'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const MenuCategoryOrder = require('../js/menu-category-order');

const expectedSlugs = [
    'loaded-fries',
    'fried-rice',
    'chicken-wings',
    'american-classics',
    'breakfast',
    'burgers',
    'sandwiches',
    'mexican-food',
    'cakes-desserts',
    'smoothies-refreshers'
];

test('orders the ten public categories and excludes Extras without changing source slugs', () => {
    const categories = [
        { slug: 'extras', name: 'Extras' },
        ...expectedSlugs.slice().reverse().map(slug => ({ slug, name: `Source ${slug}` }))
    ];

    const ordered = MenuCategoryOrder.orderCategories(categories);

    assert.deepEqual(ordered.map(category => category.slug), expectedSlugs);
    assert.equal(categories[0].slug, 'extras');
    assert.equal(ordered.some(category => category.slug === 'extras'), false);
});

test('uses the Smoothies label while retaining the existing category slug', () => {
    const source = { slug: 'smoothies-refreshers', name: 'Smoothies & Refreshers' };
    const [ordered] = MenuCategoryOrder.orderCategories([source]);

    assert.strictEqual(ordered, source);
    assert.equal(MenuCategoryOrder.getDisplayName(ordered.slug, ordered.name), 'Smoothies');
    assert.equal(ordered.slug, 'smoothies-refreshers');
});

test('orders product sections by public category order and supports existing fallback keys', () => {
    const menuData = {
        smoothies: { title: 'Smoothies', items: [] },
        extras: { title: 'Extras', items: [{ name: 'Extra' }] },
        breakfast: { title: 'Breakfast', items: [] },
        cupcakes: { title: 'Cupcakes', items: [] },
        'texas-chicken': { title: 'Texas Crispy Fried Chicken', items: [] },
        'loaded-fries': { title: 'Loaded Fries', items: [] },
        'mexican-food': { title: 'Mexican Food', items: [] }
    };

    const ordered = MenuCategoryOrder.orderMenuEntries(menuData);

    assert.deepEqual(ordered.map(entry => entry.slug), [
        'loaded-fries',
        'chicken-wings',
        'breakfast',
        'mexican-food',
        'cakes-desserts',
        'smoothies-refreshers'
    ]);
    assert.equal(ordered.some(entry => entry.slug === 'extras'), false);
    assert.strictEqual(ordered[1].category, menuData['texas-chicken']);
    assert.strictEqual(ordered[4].category, menuData.cupcakes);
    assert.strictEqual(ordered[5].category, menuData.smoothies);
});
