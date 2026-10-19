/**
 * Generate menu snapshot from production API
 * Run: node generate-menu-snapshot.js
 */

const https = require('https');

const API_BASE = 'https://crave-backend-oie3.onrender.com/api';

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function fetchAllMenuItems() {
    let allItems = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        console.log(`Fetching page ${page}...`);
        const response = await fetchJSON(`${API_BASE}/menu?page=${page}`);
        
        if (!response.success || !response.data) {
            throw new Error(`Invalid response for page ${page}`);
        }

        allItems = allItems.concat(response.data);
        
        if (response.pagination && response.pagination.page < response.pagination.totalPages) {
            page++;
        } else {
            hasMore = false;
        }
    }

    return allItems;
}

async function generateSnapshot() {
    console.log('Fetching categories...');
    const categoriesResponse = await fetchJSON(`${API_BASE}/categories`);
    
    if (!categoriesResponse.success || !categoriesResponse.data) {
        throw new Error('Invalid categories response');
    }

    console.log('Fetching all menu items...');
    const menuItems = await fetchAllMenuItems();

    console.log(`Fetched ${menuItems.length} menu items`);
    console.log(`Fetched ${categoriesResponse.data.length} categories`);

    // Validate data
    const invalidItems = menuItems.filter(item => !item.id || !item.name || !item.price);
    if (invalidItems.length > 0) {
        throw new Error(`Invalid items found: ${invalidItems.length} items missing required fields`);
    }

    // Generate snapshot
    const snapshot = {
        timestamp: new Date().toISOString(),
        categories: categoriesResponse.data,
        menuItems: menuItems
    };

    // Write to file
    const fs = require('fs');
    const outputPath = 'menu-snapshot.json';
    fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
    
    console.log(`Snapshot generated: ${outputPath}`);
    console.log(`Size: ${JSON.stringify(snapshot).length} bytes`);
    
    // Generate JS variable format for embedding in HTML
    const jsOutput = `const menuSnapshot = ${JSON.stringify(snapshot, null, 2)};`;
    const jsPath = 'menu-snapshot.js';
    fs.writeFileSync(jsPath, jsOutput);
    
    console.log(`JS format generated: ${jsPath}`);
    
    return snapshot;
}

generateSnapshot().catch(error => {
    console.error('Error generating snapshot:', error);
    process.exit(1);
});
