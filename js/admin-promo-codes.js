/**
 * CRAVE Admin Promo Code Management
 */

const API_BASE = typeof CRAVE_API_BASE !== 'undefined' ? CRAVE_API_BASE : '/api';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('craveAuthToken');
}

// Load all promo codes
async function loadPromoCodes() {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/admin/promo-codes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load promo codes');
        }

        const promoCodes = await response.json();
        renderPromoCodes(promoCodes);
    } catch (error) {
        console.error('Error loading promo codes:', error);
        document.getElementById('promoCodesList').innerHTML =
            '<p class="error">Failed to load promo codes. Please ensure you are logged in as an admin.</p>';
    }
}

// Render promo codes list
function renderPromoCodes(promoCodes) {
    const list = document.getElementById('promoCodesList');

    if (!promoCodes || promoCodes.length === 0) {
        list.innerHTML = '<p class="empty-state">No promo codes found. Click "Create New Promo Code" to add one.</p>';
        return;
    }

    list.innerHTML = promoCodes.map(promo => `
        <div class="promo-code-item ${promo.status === 'INACTIVE' ? 'inactive' : ''}">
            <div class="promo-code-header">
                <h3>${promo.code}</h3>
                <span class="status-badge ${promo.status.toLowerCase()}">${promo.status}</span>
            </div>
            <div class="promo-code-details">
                <p><strong>Name:</strong> ${promo.name}</p>
                <p><strong>Description:</strong> ${promo.description || 'N/A'}</p>
                <p><strong>Discount:</strong> ${promo.discountType === 'PERCENTAGE' ? promo.discountValue + '%' : 'GH₵' + promo.discountValue}</p>
                <p><strong>Usage:</strong> ${promo.usageCount} / ${promo.usageLimit}</p>
                <p><strong>Valid From:</strong> ${new Date(promo.validFrom).toLocaleString()}</p>
                <p><strong>Expires:</strong> ${new Date(promo.expiresAt).toLocaleString()}</p>
                ${promo.minSpend ? `<p><strong>Min Spend:</strong> GH₵${promo.minSpend}</p>` : ''}
                ${promo.maxDiscountAmount ? `<p><strong>Max Discount:</strong> GH₵${promo.maxDiscountAmount}</p>` : ''}
                ${promo.restrictedUserIds.length > 0 ? `<p><strong>Restricted Users:</strong> ${promo.restrictedUserIds.length}</p>` : ''}
                ${promo.restrictedEmails.length > 0 ? `<p><strong>Restricted Emails:</strong> ${promo.restrictedEmails.length}</p>` : ''}
            </div>
            <div class="promo-code-actions">
                <button class="btn btn-secondary" onclick="editPromoCode('${promo.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deletePromoCode('${promo.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Create new promo code
async function createPromoCode(data) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/admin/promo-codes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create promo code');
        }

        closeModal();
        loadPromoCodes();
        alert('Promo code created successfully!');
    } catch (error) {
        console.error('Error creating promo code:', error);
        alert(error.message || 'Failed to create promo code');
    }
}

// Update promo code
async function updatePromoCode(codeId, data) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/admin/promo-codes/${codeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update promo code');
        }

        closeModal();
        loadPromoCodes();
        alert('Promo code updated successfully!');
    } catch (error) {
        console.error('Error updating promo code:', error);
        alert(error.message || 'Failed to update promo code');
    }
}

// Delete promo code
async function deletePromoCode(codeId) {
    if (!confirm('Are you sure you want to delete this promo code?')) {
        return;
    }

    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/admin/promo-codes/${codeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete promo code');
        }

        loadPromoCodes();
        alert('Promo code deleted successfully!');
    } catch (error) {
        console.error('Error deleting promo code:', error);
        alert('Failed to delete promo code');
    }
}

// Edit promo code (load data into form)
async function editPromoCode(codeId) {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/admin/promo-codes/${codeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load promo code');
        }

        const promo = await response.json();
        openModal(promo);
    } catch (error) {
        console.error('Error loading promo code:', error);
        alert('Failed to load promo code');
    }
}

// Modal functions
function openModal(promo = null) {
    const modal = document.getElementById('promoModal');
    const form = document.getElementById('promoForm');
    const title = document.getElementById('modalTitle');

    if (promo) {
        title.textContent = 'Edit Promo Code';
        form.dataset.codeId = promo.id;
        document.getElementById('code').value = promo.code;
        document.getElementById('name').value = promo.name;
        document.getElementById('description').value = promo.description || '';
        document.getElementById('discountType').value = promo.discountType;
        document.getElementById('discountValue').value = promo.discountValue;
        document.getElementById('minSpend').value = promo.minSpend || '';
        document.getElementById('maxDiscountAmount').value = promo.maxDiscountAmount || '';
        document.getElementById('usageLimit').value = promo.usageLimit;
        document.getElementById('validFrom').value = new Date(promo.validFrom).toISOString().slice(0, 16);
        document.getElementById('expiresAt').value = new Date(promo.expiresAt).toISOString().slice(0, 16);
        document.getElementById('restrictedUserIds').value = promo.restrictedUserIds.join(',');
        document.getElementById('restrictedEmails').value = promo.restrictedEmails.join(',');
        document.getElementById('status').value = promo.status;
    } else {
        title.textContent = 'Create Promo Code';
        delete form.dataset.codeId;
        form.reset();
        // Set default validFrom to now
        document.getElementById('validFrom').value = new Date().toISOString().slice(0, 16);
    }

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('promoModal').style.display = 'none';
    document.getElementById('promoForm').reset();
    delete document.getElementById('promoForm').dataset.codeId;
}

// Form submission
document.getElementById('promoForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = {
        code: formData.get('code').toUpperCase(),
        name: formData.get('name'),
        description: formData.get('description') || null,
        discountType: formData.get('discountType'),
        discountValue: parseFloat(formData.get('discountValue')),
        minSpend: formData.get('minSpend') ? parseFloat(formData.get('minSpend')) : null,
        maxDiscountAmount: formData.get('maxDiscountAmount') ? parseFloat(formData.get('maxDiscountAmount')) : null,
        usageLimit: parseInt(formData.get('usageLimit')),
        validFrom: formData.get('validFrom'),
        expiresAt: formData.get('expiresAt'),
        restrictedUserIds: formData.get('restrictedUserIds') ? formData.get('restrictedUserIds').split(',').map(id => id.trim()) : [],
        restrictedEmails: formData.get('restrictedEmails') ? formData.get('restrictedEmails').split(',').map(email => email.trim()) : [],
        status: formData.get('status'),
    };

    const codeId = this.dataset.codeId;

    if (codeId) {
        await updatePromoCode(codeId, data);
    } else {
        await createPromoCode(data);
    }
});

// Event listeners
document.getElementById('createPromoBtn').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('promoModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Load promo codes on page load
document.addEventListener('DOMContentLoaded', loadPromoCodes);
