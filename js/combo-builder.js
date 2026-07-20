/**
 * CRAVE Combo Builder
 * Build and customize meal combos with smart recommendations
 */

const CraveComboBuilder = (function() {
    'use strict';

    const config = typeof CraveRewardsConfig !== 'undefined' ? CraveRewardsConfig : null;
    const data = typeof CraveRewardsData !== 'undefined' ? CraveRewardsData : null;
    const engine = typeof CraveRewardsEngine !== 'undefined' ? CraveRewardsEngine : null;
    const notifications = typeof CraveRewardsNotifications !== 'undefined' ? CraveRewardsNotifications : null;

    let currentCombo = null;
    let comboContainer = null;

    // Get available combos
    function getAvailableCombos() {
        if (!config) return [];
        
        return Object.entries(config.combos).map(([key, combo]) => ({
            key,
            ...combo
        }));
    }

    // Get combo by key
    function getCombo(key) {
        if (!config) return null;
        
        return {
            key,
            ...config.combos[key]
        };
    }

    // Calculate combo price
    function calculateComboPrice(combo, selections = {}) {
        if (!combo) return 0;
        
        let totalPrice = combo.basePrice || 0;
        
        // Add prices for selected items
        for (const [category, item] of Object.entries(selections)) {
            if (item && item.price) {
                totalPrice += item.price;
            }
        }
        
        // Apply combo discount
        if (combo.discount) {
            totalPrice = totalPrice * (1 - combo.discount / 100);
        }
        
        return Math.max(0, totalPrice);
    }

    // Get combo savings
    function getComboSavings(combo, selections = {}) {
        if (!combo) return 0;
        
        let regularPrice = combo.basePrice || 0;
        
        for (const [category, item] of Object.entries(selections)) {
            if (item && item.price) {
                regularPrice += item.price;
            }
        }
        
        const comboPrice = calculateComboPrice(combo, selections);
        return regularPrice - comboPrice;
    }

    // Show combo builder modal
    function showComboBuilder(comboKey) {
        const combo = getCombo(comboKey);
        if (!combo) return;
        
        currentCombo = combo;
        
        // Create modal
        const modalHTML = `
            <div class="crave-combo-builder-modal" id="craveComboBuilderModal">
                <div class="crave-combo-builder-overlay"></div>
                <div class="crave-combo-builder-content">
                    <button class="crave-combo-builder-close" id="closeComboBuilder">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="crave-combo-builder-header">
                        <div class="crave-combo-builder-icon">🍔</div>
                        <h2>${combo.name}</h2>
                        <p>${combo.description}</p>
                    </div>
                    
                    <div class="crave-combo-builder-categories" id="comboCategories">
                        <!-- Categories will be loaded dynamically -->
                    </div>
                    
                    <div class="crave-combo-builder-summary">
                        <div class="crave-combo-builder-price">
                            <span class="crave-combo-builder-label">Combo Price:</span>
                            <span class="crave-combo-builder-value" id="comboPrice">GHS ${combo.basePrice.toFixed(2)}</span>
                        </div>
                        <div class="crave-combo-builder-savings" id="comboSavings">
                            <span class="crave-combo-builder-label">You Save:</span>
                            <span class="crave-combo-builder-value" id="savingsValue">GHS 0.00</span>
                        </div>
                    </div>
                    
                    <button class="crave-combo-builder-add-btn" id="addComboToCart">
                        Add Combo to Cart
                    </button>
                </div>
            </div>
        `;
        
        // Remove existing modal
        const existingModal = document.getElementById('craveComboBuilderModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        addComboBuilderStyles();
        loadComboCategories(combo);
        setupComboBuilderListeners();
    }

    // Load combo categories
    function loadComboCategories(combo) {
        const categoriesContainer = document.getElementById('comboCategories');
        
        categoriesContainer.innerHTML = combo.categories.map((category, index) => {
            const items = category.items || [];
            
            return `
                <div class="crave-combo-category" data-category="${index}">
                    <h3 class="crave-combo-category-title">${category.name}</h3>
                    <div class="crave-combo-category-items">
                        ${items.map((item, itemIndex) => `
                            <div class="crave-combo-item ${itemIndex === 0 ? 'selected' : ''}" 
                                 data-item="${itemIndex}" 
                                 data-price="${item.price || 0}">
                                <div class="crave-combo-item-name">${item.name}</div>
                                <div class="crave-combo-item-price">GHS ${(item.price || 0).toFixed(2)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
        // Setup item selection
        categoriesContainer.querySelectorAll('.crave-combo-item').forEach(item => {
            item.addEventListener('click', function() {
                const category = this.closest('.crave-combo-category');
                category.querySelectorAll('.crave-combo-item').forEach(i => i.classList.remove('selected'));
                this.classList.add('selected');
                updateComboPrice();
            });
        });
    }

    // Update combo price
    function updateComboPrice() {
        if (!currentCombo) return;
        
        const selections = {};
        const categories = document.querySelectorAll('.crave-combo-category');
        
        categories.forEach((category, index) => {
            const selectedItem = category.querySelector('.crave-combo-item.selected');
            if (selectedItem) {
                const itemIndex = parseInt(selectedItem.dataset.item);
                selections[index] = currentCombo.categories[index].items[itemIndex];
            }
        });
        
        const price = calculateComboPrice(currentCombo, selections);
        const savings = getComboSavings(currentCombo, selections);
        
        document.getElementById('comboPrice').textContent = `GHS ${price.toFixed(2)}`;
        document.getElementById('savingsValue').textContent = `GHS ${savings.toFixed(2)}`;
        
        if (savings > 0) {
            document.getElementById('comboSavings').style.display = 'flex';
        } else {
            document.getElementById('comboSavings').style.display = 'none';
        }
    }

    // Add combo to cart
    function addComboToCart() {
        if (!currentCombo) return;
        
        const selections = {};
        const categories = document.querySelectorAll('.crave-combo-category');
        
        categories.forEach((category, index) => {
            const selectedItem = category.querySelector('.crave-combo-item.selected');
            if (selectedItem) {
                const itemIndex = parseInt(selectedItem.dataset.item);
                selections[index] = currentCombo.categories[index].items[itemIndex];
            }
        });
        
        const price = calculateComboPrice(currentCombo, selections);
        
        // Create combo item for cart
        const comboItem = {
            id: `combo_${currentCombo.key}_${Date.now()}`,
            name: currentCombo.name,
            price: price,
            quantity: 1,
            isCombo: true,
            comboKey: currentCombo.key,
            selections: selections
        };
        
        // Add to cart
        const cart = JSON.parse(localStorage.getItem('craveCart') || '[]');
        cart.push(comboItem);
        localStorage.setItem('craveCart', JSON.stringify(cart));
        
        // Show notification
        if (notifications) {
            notifications.show({
                type: 'success',
                icon: '🍔',
                title: 'Combo Added!',
                message: `${currentCombo.name} added to cart`
            });
        }
        
        // Close modal
        document.getElementById('craveComboBuilderModal').remove();
    }

    // Add modal styles
    function addComboBuilderStyles() {
        if (document.getElementById('crave-combo-builder-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'crave-combo-builder-styles';
        style.textContent = `
            .crave-combo-builder-modal {
                position: fixed;
                inset: 0;
                z-index: 10006;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .crave-combo-builder-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }

            .crave-combo-builder-content {
                position: relative;
                background: rgba(20, 20, 20, 0.95);
                border: 1px solid rgba(212, 163, 115, 0.3);
                border-radius: 24px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
            }

            .crave-combo-builder-close {
                position: absolute;
                top: 16px;
                right: 16px;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                color: #888888;
                font-size: 20px;
                cursor: pointer;
                border-radius: 12px;
                transition: all 0.2s ease;
            }

            .crave-combo-builder-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }

            .crave-combo-builder-header {
                text-align: center;
                margin-bottom: 32px;
            }

            .crave-combo-builder-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }

            .crave-combo-builder-header h2 {
                font-family: 'Playfair Display', serif;
                font-size: 28px;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 8px;
            }

            .crave-combo-builder-header p {
                color: #aaaaaa;
                font-size: 14px;
            }

            .crave-combo-category {
                margin-bottom: 24px;
            }

            .crave-combo-category-title {
                font-size: 16px;
                font-weight: 600;
                color: #ffffff;
                margin-bottom: 12px;
            }

            .crave-combo-category-items {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 12px;
            }

            .crave-combo-item {
                padding: 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .crave-combo-item:hover {
                border-color: rgba(212, 163, 115, 0.3);
                background: rgba(212, 163, 115, 0.1);
            }

            .crave-combo-item.selected {
                border-color: rgba(212, 163, 115, 0.5);
                background: rgba(212, 163, 115, 0.15);
            }

            .crave-combo-item-name {
                color: #ffffff;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 4px;
            }

            .crave-combo-item-price {
                color: #d4a373;
                font-size: 12px;
            }

            .crave-combo-builder-summary {
                display: flex;
                justify-content: space-between;
                padding: 20px;
                background: rgba(212, 163, 115, 0.1);
                border-radius: 12px;
                margin-bottom: 24px;
            }

            .crave-combo-builder-price,
            .crave-combo-builder-savings {
                display: flex;
                flex-direction: column;
            }

            .crave-combo-builder-label {
                color: #888888;
                font-size: 12px;
                margin-bottom: 4px;
            }

            .crave-combo-builder-value {
                color: #ffffff;
                font-size: 20px;
                font-weight: 700;
            }

            .crave-combo-builder-savings .crave-combo-builder-value {
                color: #4CAF50;
            }

            .crave-combo-builder-add-btn {
                width: 100%;
                padding: 16px 24px;
                background: linear-gradient(135deg, #d4a373, #c49a6c);
                color: #ffffff;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .crave-combo-builder-add-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(212, 163, 115, 0.3);
            }

            @media (max-width: 768px) {
                .crave-combo-builder-content {
                    padding: 24px;
                }

                .crave-combo-category-items {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Setup modal listeners
    function setupComboBuilderListeners() {
        const modal = document.getElementById('craveComboBuilderModal');
        const closeBtn = document.getElementById('closeComboBuilder');
        const addBtn = document.getElementById('addComboToCart');
        
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.crave-combo-builder-overlay').addEventListener('click', () => {
            modal.remove();
        });
        
        addBtn.addEventListener('click', addComboToCart);
    }

    // Show combo recommendations based on cart
    function showComboRecommendations(cartItems) {
        if (!engine) return;
        
        const recommendations = engine.getComboRecommendations(cartItems);
        if (recommendations.length === 0) return;
        
        const bannerHTML = `
            <div class="crave-combo-recommendations-banner" id="craveComboBanner">
                <div class="crave-combo-recommendations-content">
                    <div class="crave-combo-recommendations-icon">🍔</div>
                    <div class="crave-combo-recommendations-text">
                        <span class="crave-combo-recommendations-label">COMBO DEAL</span>
                        <span class="crave-combo-recommendations-name">${recommendations[0].name}</span>
                        <span class="crave-combo-recommendations-savings">Save GHS ${recommendations[0].savings.toFixed(2)}</span>
                    </div>
                    <button class="crave-combo-recommendations-btn" data-combo="${recommendations[0].key}">Build Combo</button>
                    <button class="crave-combo-recommendations-close" id="closeComboBanner">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Remove existing banner
        const existingBanner = document.getElementById('craveComboBanner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', bannerHTML);
        addComboBannerStyles();
        setupComboBannerListeners();
    }

    // Add banner styles
    function addComboBannerStyles() {
        if (document.getElementById('crave-combo-banner-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'crave-combo-banner-styles';
        style.textContent = `
            .crave-combo-recommendations-banner {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10007;
                background: rgba(20, 20, 20, 0.95);
                border: 1px solid rgba(212, 163, 115, 0.3);
                border-radius: 16px;
                padding: 16px 24px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                animation: slide-up 0.5s ease;
            }

            @keyframes slide-up {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }

            .crave-combo-recommendations-content {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .crave-combo-recommendations-icon {
                font-size: 32px;
            }

            .crave-combo-recommendations-text {
                display: flex;
                flex-direction: column;
            }

            .crave-combo-recommendations-label {
                font-size: 10px;
                font-weight: 700;
                color: #d4a373;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .crave-combo-recommendations-name {
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
            }

            .crave-combo-recommendations-savings {
                font-size: 12px;
                color: #4CAF50;
            }

            .crave-combo-recommendations-btn {
                padding: 8px 20px;
                background: rgba(212, 163, 115, 0.15);
                border: 1px solid rgba(212, 163, 115, 0.3);
                border-radius: 8px;
                color: #d4a373;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .crave-combo-recommendations-btn:hover {
                background: rgba(212, 163, 115, 0.25);
            }

            .crave-combo-recommendations-close {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                color: #888888;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .crave-combo-recommendations-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }

            @media (max-width: 768px) {
                .crave-combo-recommendations-banner {
                    left: 16px;
                    right: 16px;
                    transform: none;
                    width: auto;
                }

                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Setup banner listeners
    function setupComboBannerListeners() {
        const closeBtn = document.getElementById('closeComboBanner');
        const banner = document.getElementById('craveComboBanner');
        const buildBtn = banner.querySelector('.crave-combo-recommendations-btn');
        
        closeBtn.addEventListener('click', () => {
            banner.remove();
        });
        
        buildBtn.addEventListener('click', () => {
            const comboKey = buildBtn.dataset.combo;
            banner.remove();
            showComboBuilder(comboKey);
        });
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (banner && banner.parentNode) {
                banner.remove();
            }
        }, 30000);
    }

    // Public API
    return {
        getAvailable: getAvailableCombos,
        get: getCombo,
        calculatePrice: calculateComboPrice,
        getSavings: getComboSavings,
        showBuilder: showComboBuilder,
        showRecommendations: showComboRecommendations
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraveComboBuilder;
}
