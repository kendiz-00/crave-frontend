/**
 * CRAVE Payment UI Components
 * Reusable payment method selection and UI
 */

const PaymentUI = (function() {
    'use strict';

    const config = typeof PaymentConfig !== 'undefined' ? PaymentConfig : null;

    /**
     * Render payment method selector
     */
    function renderPaymentMethodSelector(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const {
            selectedMethod = 'card',
            onSelect = null
        } = options;

        const methods = config ? config.methods : {
            card: { name: 'Card', icon: 'fa-credit-card' },
            mobileMoney: { name: 'Mobile Money', icon: 'fa-mobile-alt' },
            bankTransfer: { name: 'Bank Transfer', icon: 'fa-university' }
        };

        container.innerHTML = `
            <div class="payment-methods">
                ${Object.entries(methods).map(([key, method]) => `
                    <div class="payment-method ${key === selectedMethod ? 'selected' : ''}" data-method="${key}">
                        <div class="payment-method-icon">
                            <i class="fas ${method.icon}"></i>
                        </div>
                        <div class="payment-method-name">${method.name}</div>
                        <div class="payment-method-check">
                            <i class="fas fa-check"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners
        container.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', function() {
                container.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
                this.classList.add('selected');
                
                if (onSelect) {
                    onSelect(this.dataset.method);
                }
            });
        });
    }

    /**
     * Render card payment form
     */
    function renderCardForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="card-form">
                <div class="form-group">
                    <label>Card Number</label>
                    <input type="text" class="form-input" placeholder="1234 5678 9012 3456" maxlength="19">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Expiry Date</label>
                        <input type="text" class="form-input" placeholder="MM/YY" maxlength="5">
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input type="text" class="form-input" placeholder="123" maxlength="3">
                    </div>
                </div>
                <div class="form-group">
                    <label>Cardholder Name</label>
                    <input type="text" class="form-input" placeholder="Name on card">
                </div>
            </div>
        `;
    }

    /**
     * Render mobile money form
     */
    function renderMobileMoneyForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="mobile-money-form">
                <div class="form-group">
                    <label>Mobile Network</label>
                    <select class="form-select">
                        <option value="">Select network</option>
                        <option value="mtn">MTN Mobile Money</option>
                        <option value="airteltigo">AirtelTigo Money</option>
                        <option value="vodafone">Vodafone Cash</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" class="form-input" placeholder="050 000 0000">
                </div>
                <div class="form-group">
                    <label>Voucher Code (optional)</label>
                    <input type="text" class="form-input" placeholder="Enter voucher code">
                </div>
            </div>
        `;
    }

    /**
     * Render bank transfer form
     */
    function renderBankTransferForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="bank-transfer-form">
                <div class="bank-info">
                    <h4>Bank Transfer Details</h4>
                    <p>Transfer to the following account:</p>
                    <div class="bank-details">
                        <div class="bank-detail">
                            <span class="label">Bank:</span>
                            <span class="value">GCB Bank</span>
                        </div>
                        <div class="bank-detail">
                            <span class="label">Account Name:</span>
                            <span class="value">CRAVE Restaurant Ltd</span>
                        </div>
                        <div class="bank-detail">
                            <span class="label">Account Number:</span>
                            <span class="value">1234567890</span>
                        </div>
                        <div class="bank-detail">
                            <span class="label">Reference:</span>
                            <span class="value" id="transferReference">-</span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Upload Transfer Receipt</label>
                    <input type="file" class="form-input" accept="image/*">
                </div>
            </div>
        `;
    }

    /**
     * Show payment processing overlay
     */
    function showPaymentProcessing() {
        const overlay = document.createElement('div');
        overlay.className = 'payment-processing-overlay';
        overlay.innerHTML = `
            <div class="payment-processing-content">
                <div class="spinner"></div>
                <p>Processing payment...</p>
                <p class="small">Please don't close this window</p>
            </div>
        `;
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        document.body.appendChild(overlay);
        return overlay;
    }

    /**
     * Hide payment processing overlay
     */
    function hidePaymentProcessing(overlay) {
        if (overlay) {
            overlay.remove();
        }
    }

    /**
     * Add payment UI styles
     */
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .payment-methods {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            }
            .payment-method {
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .payment-method:hover {
                border-color: #d4a574;
                background: rgba(212, 165, 116, 0.1);
            }
            .payment-method.selected {
                border-color: #d4a574;
                background: rgba(212, 165, 116, 0.15);
            }
            .payment-method-icon {
                font-size: 32px;
                color: #d4a574;
                margin-bottom: 10px;
            }
            .payment-method-name {
                font-weight: 600;
                color: #ffffff;
            }
            .payment-method-check {
                position: absolute;
                top: 10px;
                right: 10px;
                color: #10b981;
                opacity: 0;
                transition: opacity 0.3s;
            }
            .payment-method.selected .payment-method-check {
                opacity: 1;
            }
            .card-form,
            .mobile-money-form,
            .bank-transfer-form {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 24px;
            }
            .form-group {
                margin-bottom: 20px;
            }
            .form-group label {
                display: block;
                margin-bottom: 8px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
                font-weight: 500;
            }
            .form-input,
            .form-select {
                width: 100%;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: #ffffff;
                font-size: 14px;
                transition: border-color 0.3s;
            }
            .form-input:focus,
            .form-select:focus {
                outline: none;
                border-color: #d4a574;
            }
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            .bank-info {
                margin-bottom: 20px;
                padding: 20px;
                background: rgba(212, 165, 116, 0.1);
                border-radius: 8px;
            }
            .bank-info h4 {
                color: #d4a574;
                margin-bottom: 10px;
            }
            .bank-detail {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .bank-detail:last-child {
                border-bottom: none;
            }
            .bank-detail .label {
                color: rgba(255, 255, 255, 0.7);
            }
            .bank-detail .value {
                font-weight: 600;
                color: #ffffff;
            }
            .payment-processing-content {
                text-align: center;
                color: #ffffff;
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255, 255, 255, 0.1);
                border-top-color: #d4a574;
                border-radius: 50%;
                margin: 0 auto 20px;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .payment-processing-content p {
                font-size: 18px;
                margin-bottom: 5px;
            }
            .payment-processing-content .small {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize styles
    addStyles();

    // Public API
    return {
        renderPaymentMethodSelector,
        renderCardForm,
        renderMobileMoneyForm,
        renderBankTransferForm,
        showPaymentProcessing,
        hidePaymentProcessing
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentUI;
}
