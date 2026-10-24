// Checkout Promo Code Initialization
// Dedicated file to ensure promo listeners are attached

(function() {
    'use strict';

    console.log('[Checkout Promo] Initializing promo listeners');

    function setupPromoListeners() {
        console.log('[Checkout Promo] setupPromoListeners called');
        const togglePromoBtn = document.getElementById('togglePromoBtn');
        const promoBody = document.getElementById('promoBody');
        
        // Setup toggle listener
        if (togglePromoBtn && promoBody) {
            togglePromoBtn.addEventListener('click', function() {
                togglePromoBtn.classList.toggle('open');
                // Force display style based on toggle state
                if (togglePromoBtn.classList.contains('open')) {
                    promoBody.style.display = 'block';
                } else {
                    promoBody.style.display = 'none';
                }
            });
        }

        const applyPromoBtn = document.getElementById('applyPromoBtn');
        console.log('[Checkout Promo] applyPromoBtn found:', !!applyPromoBtn);
        if (applyPromoBtn) {
            applyPromoBtn.addEventListener('click', async function() {
                console.log('[Checkout Promo] Apply button clicked');
                const inputEl = document.getElementById('promoCode');
                const msgEl = document.getElementById('promoCodeMessage');
                const code = (inputEl ? inputEl.value : '').trim().toUpperCase();

                console.log('[Checkout Promo] Promo code entered:', code);

                if (!code) {
                    // Clear discount if code is empty
                    window.promoDiscountUsed = 0;
                    window.appliedPromoCode = null;
                    if (msgEl) {
                        msgEl.className = 'promo-code-message';
                        msgEl.textContent = '';
                    }
                    const promoRow = document.getElementById('promoDiscountRow');
                    if (promoRow) promoRow.style.display = 'none';
                    // Recalculate total without discount
                    const subtotalEl = document.getElementById('subtotalAmount');
                    const totalEl = document.getElementById('totalAmount');
                    const deliveryFeeEl = document.getElementById('deliveryFeeAmount');
                    if (subtotalEl && totalEl) {
                        const subtotalText = subtotalEl.textContent.replace('GH¢', '').trim();
                        const subtotal = parseFloat(subtotalText) || 0;
                        const deliveryFeeText = deliveryFeeEl ? deliveryFeeEl.textContent.replace('GH¢', '').trim() : '0';
                        const deliveryFee = parseFloat(deliveryFeeText) || 0;
                        const finalTotal = subtotal + deliveryFee;
                        totalEl.textContent = `GH¢ ${finalTotal.toFixed(2)}`;
                    }
                    return;
                }

                if (typeof CravePromoCodes !== 'undefined') {
                    const cart = JSON.parse(localStorage.getItem('craveCart')) || [];
                    console.log('[Checkout Promo] Cart items:', cart.length);
                    const cartItems = cart.map(item => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        addOns: item.addOns?.map(addOn => ({
                            addOnId: addOn.addOnId,
                            name: addOn.name,
                            price: addOn.price,
                        })) || [],
                    }));

                    // Calculate actual order total for discount calculation
                    let orderTotal = 0;
                    cart.forEach(item => {
                        const itemTotal = (item.unitPrice || item.price || 0) * (item.quantity || 1);
                        orderTotal += itemTotal;
                        // Add add-on prices
                        if (item.addOns && item.addOns.length > 0) {
                            item.addOns.forEach(addOn => {
                                orderTotal += addOn.price * (item.quantity || 1);
                            });
                        }
                    });

                    console.log('[Checkout Promo] Order total calculated:', orderTotal);

                    const result = await CravePromoCodes.apply(code, orderTotal, cartItems);
                    console.log('[Checkout Promo] Promo validation result:', result);

                    if (result && result.valid) {
                        window.promoDiscountUsed = result.discount || 0;
                        window.appliedPromoCode = code;
                        console.log('[Checkout Promo] Discount applied:', window.promoDiscountUsed);
                        if (msgEl) {
                            msgEl.className = 'promo-code-message success';
                            msgEl.innerHTML = `<i class="fas fa-check-circle"></i> Code <strong>${code}</strong> applied! Saved GH¢ ${window.promoDiscountUsed.toFixed(2)}`;
                        }

                        const promoRow = document.getElementById('promoDiscountRow');
                        const promoVal = document.getElementById('promoDiscountSummaryValue');
                        if (promoRow && promoVal) {
                            promoRow.style.display = 'flex';
                            promoVal.textContent = `-GH¢ ${window.promoDiscountUsed.toFixed(2)}`;
                        }
                        // Recalculate total directly
                        if (typeof recalculateTotal === 'function') {
                            recalculateTotal();
                        } else {
                            // Fallback: manually update total
                            const subtotalEl = document.getElementById('subtotalAmount');
                            const totalEl = document.getElementById('totalAmount');
                            const deliveryFeeEl = document.getElementById('deliveryFeeAmount');
                            if (subtotalEl && totalEl) {
                                const subtotalText = subtotalEl.textContent.replace('GH¢', '').trim();
                                const subtotal = parseFloat(subtotalText) || 0;
                                const deliveryFeeText = deliveryFeeEl ? deliveryFeeEl.textContent.replace('GH¢', '').trim() : '0';
                                const deliveryFee = parseFloat(deliveryFeeText) || 0;
                                const finalTotal = subtotal + deliveryFee - window.promoDiscountUsed;
                                totalEl.textContent = `GH¢ ${finalTotal.toFixed(2)}`;
                            }
                        }
                    } else {
                        window.promoDiscountUsed = 0;
                        window.appliedPromoCode = null;
                        console.log('[Checkout Promo] Promo validation failed:', result ? result.message : 'Unknown error');
                        if (msgEl) {
                            msgEl.className = 'promo-code-message error';
                            msgEl.textContent = (result && result.message) ? result.message : 'Invalid or expired promo code';
                        }

                        const promoRow = document.getElementById('promoDiscountRow');
                        if (promoRow) promoRow.style.display = 'none';
                        // Recalculate total directly
                        if (typeof recalculateTotal === 'function') {
                            recalculateTotal();
                        } else {
                            // Fallback: manually update total without discount
                            const subtotalEl = document.getElementById('subtotalAmount');
                            const totalEl = document.getElementById('totalAmount');
                            const deliveryFeeEl = document.getElementById('deliveryFeeAmount');
                            if (subtotalEl && totalEl) {
                                const subtotalText = subtotalEl.textContent.replace('GH¢', '').trim();
                                const subtotal = parseFloat(subtotalText) || 0;
                                const deliveryFeeText = deliveryFeeEl ? deliveryFeeEl.textContent.replace('GH¢', '').trim() : '0';
                                const deliveryFee = parseFloat(deliveryFeeText) || 0;
                                const finalTotal = subtotal + deliveryFee;
                                totalEl.textContent = `GH¢ ${finalTotal.toFixed(2)}`;
                            }
                        }
                    }
                } else {
                    if (msgEl) {
                        msgEl.className = 'promo-code-message error';
                        msgEl.textContent = 'Promo code system unavailable';
                    }
                }
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupPromoListeners);
    } else {
        setupPromoListeners();
    }
})();
