document.addEventListener('DOMContentLoaded', function() {
    setupFilterListeners();
});

function setupFilterListeners() {
    const filters = ['dateFilter', 'statusFilter', 'methodFilter'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', updateDashboard);
        }
    });
}

async function updateDashboard() {
    try {
        const dateFilter = document.getElementById('dateFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const methodFilter = document.getElementById('methodFilter').value;

        const response = await fetch(`/api/payments?date=${dateFilter}&status=${statusFilter}&method=${methodFilter}`);
        if (!response.ok) throw new Error('Failed to fetch payments');
        
        const data = await response.json();
        updatePaymentTable(data.payments);
    } catch (error) {
        console.error('Error updating dashboard:', error);
        alert('Failed to update payment history. Please try again.');
    }
}

function updatePaymentTable(payments) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>${formatDate(payment.created_at)}</td>
            <td>${payment.patient_name}</td>
            <td>${formatAmount(payment.total_amount)}</td>
            <td>${payment.payment_method}</td>
            <td>${getCurrency(payment)}</td>
            <td>
                <span class="badge bg-${getStatusBadge(payment.payment_status)}">
                    ${payment.payment_status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="viewDetails('${payment.id}')">
                    View Details
                </button>
            </td>
        </tr>
    `).join('');
}

async function viewDetails(paymentId) {
    try {
        const response = await fetch(`/api/payments/${paymentId}`);
        if (!response.ok) throw new Error('Failed to fetch payment details');
        
        const data = await response.json();
        const modal = new bootstrap.Modal(document.getElementById('paymentDetailsModal'));
        document.getElementById('paymentDetailsContent').innerHTML = formatPaymentDetails(data);
        modal.show();
    } catch (error) {
        console.error('Error viewing payment details:', error);
        alert('Failed to load payment details. Please try again.');
    }
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function formatAmount(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function getCurrency(payment) {
    return payment.payment_method === 'bank' ? 
        payment.bank_currency : 
        payment.payment_currency || 'USD';
}

function getStatusBadge(status) {
    const badges = {
        'pending': 'warning',
        'paid': 'success',
        'failed': 'danger'
    };
    return badges[status] || 'secondary';
}

function formatPaymentDetails(payment) {
    return `
        <div class="container-fluid">
            <div class="row mb-3">
                <div class="col-md-6">
                    <p><strong>Patient Name:</strong> ${payment.patient_name}</p>
                    <p><strong>Date:</strong> ${formatDate(payment.created_at)}</p>
                    <p><strong>Amount:</strong> ${formatAmount(payment.total_amount)}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Payment Method:</strong> ${payment.payment_method}</p>
                    <p><strong>Status:</strong> ${payment.payment_status}</p>
                    <p><strong>Currency:</strong> ${getCurrency(payment)}</p>
                </div>
            </div>
            ${payment.payment_method === 'bank' ? formatBankDetails(payment) : formatCryptoDetails(payment)}
        </div>
    `;
}

function formatBankDetails(payment) {
    return payment.bank_name ? `
        <div class="row">
            <div class="col">
                <h6>Bank Transfer Details</h6>
                <p><strong>Bank Name:</strong> ${payment.bank_name}</p>
                <p><strong>Exchange Rate:</strong> ${payment.bank_exchange_rate}</p>
            </div>
        </div>
    ` : '';
}

function formatCryptoDetails(payment) {
    return payment.transaction_hash ? `
        <div class="row">
            <div class="col">
                <h6>Cryptocurrency Details</h6>
                <p><strong>Currency:</strong> ${payment.payment_currency}</p>
                <p><strong>Amount:</strong> ${payment.crypto_amount}</p>
                <p><strong>Transaction Hash:</strong> ${payment.transaction_hash}</p>
            </div>
        </div>
    ` : '';
}
