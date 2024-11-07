// Currency configuration
const STATIC_EXCHANGE_RATES = {
    USD: 1.0,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
    CNY: 6.45
};

const SUPPORTED_CURRENCIES = {
    USD: { symbol: '$', name: 'US Dollar', rate: 1.0 },
    EUR: { symbol: '€', name: 'Euro', rate: 0.85 },
    GBP: { symbol: '£', name: 'British Pound', rate: 0.73 },
    JPY: { symbol: '¥', name: 'Japanese Yen', rate: 110.0 },
    CAD: { symbol: '$', name: 'Canadian Dollar', rate: 1.25 },
    AUD: { symbol: '$', name: 'Australian Dollar', rate: 1.35 },
    CNY: { symbol: '¥', name: 'Chinese Yuan', rate: 6.45 }
};

let currentPaymentMethod = 'bank';
let selectedCurrency = 'USD';
let currentBillAmount = 0;
let currentBillId = null;
let exchangeRates = STATIC_EXCHANGE_RATES;

document.addEventListener('DOMContentLoaded', function() {
    setupPaymentMethodListeners();
    setupCurrencyListeners();
    updateExchangeRates();
    setInterval(updateExchangeRates, 30000); // Update rates every 30 seconds
});

function setupPaymentMethodListeners() {
    const paymentMethodSelect = document.getElementById('paymentMethod');
    if (paymentMethodSelect) {
        paymentMethodSelect.addEventListener('change', function(e) {
            currentPaymentMethod = e.target.value;
            togglePaymentSections();
        });
    }
}

function setupCurrencyListeners() {
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.addEventListener('change', function(e) {
            selectedCurrency = e.target.value;
            updatePaymentDisplay();
        });
    }
}

function togglePaymentSections() {
    const cryptoSection = document.getElementById('cryptoPayment');
    const bankSection = document.getElementById('bankPayment');
    
    if (cryptoSection && bankSection) {
        cryptoSection.style.display = currentPaymentMethod === 'crypto' ? 'block' : 'none';
        bankSection.style.display = currentPaymentMethod === 'bank' ? 'block' : 'none';
    }
    
    if (currentPaymentMethod === 'bank') {
        updateCurrencyOptions();
    }
}

function updateCurrencyOptions() {
    const currencySelect = document.getElementById('currencySelect');
    if (!currencySelect) return;

    currencySelect.innerHTML = Object.entries(SUPPORTED_CURRENCIES)
        .map(([code, info]) => `
            <option value="${code}"${code === selectedCurrency ? ' selected' : ''}>
                ${info.symbol} ${info.name}
            </option>
        `).join('');
    
    updatePaymentDisplay();
}

async function updateExchangeRates() {
    try {
        const response = await fetch('/get_exchange_rates');
        if (!response.ok) throw new Error('Failed to fetch exchange rates');
        
        const data = await response.json();
        if (data.success) {
            exchangeRates = data.rates;
            Object.keys(SUPPORTED_CURRENCIES).forEach(currency => {
                if (exchangeRates[currency]) {
                    SUPPORTED_CURRENCIES[currency].rate = exchangeRates[currency];
                }
            });
            updatePaymentDisplay();
        }
    } catch (error) {
        console.warn('Using fallback exchange rates');
        // Use static rates as fallback
        exchangeRates = STATIC_EXCHANGE_RATES;
        Object.keys(SUPPORTED_CURRENCIES).forEach(currency => {
            SUPPORTED_CURRENCIES[currency].rate = STATIC_EXCHANGE_RATES[currency];
        });
        updatePaymentDisplay();
    }
}

function updatePaymentDisplay() {
    const paymentAmountElement = document.getElementById('paymentAmount');
    const exchangeRateInfo = document.getElementById('exchangeRateInfo');
    
    if (!paymentAmountElement || !currentBillAmount) return;

    const currency = SUPPORTED_CURRENCIES[selectedCurrency];
    if (!currency) return;

    const convertedAmount = (currentBillAmount * currency.rate).toFixed(2);
    paymentAmountElement.textContent = `${currency.symbol}${convertedAmount}`;
    
    if (exchangeRateInfo && selectedCurrency !== 'USD') {
        exchangeRateInfo.textContent = `Exchange rate: 1 USD = ${currency.symbol}${currency.rate.toFixed(4)}`;
        exchangeRateInfo.style.display = 'block';
    } else if (exchangeRateInfo) {
        exchangeRateInfo.style.display = 'none';
    }
}

function showPaymentModal(amount) {
    if (!amount || isNaN(amount)) {
        console.error('Invalid payment amount');
        return;
    }
    
    currentBillAmount = amount;
    const modal = document.getElementById('paymentModal');
    if (modal) {
        updatePaymentDisplay();
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

async function processPayment() {
    if (!currentBillId) {
        alert('Invalid bill ID. Please try again.');
        return;
    }

    try {
        const paymentData = {
            billId: currentBillId,
            paymentMethod: currentPaymentMethod,
            currency: selectedCurrency
        };

        if (currentPaymentMethod === 'bank') {
            paymentData.bankName = document.getElementById('bankName')?.value;
            paymentData.accountNumber = document.getElementById('accountNumber')?.value;
            paymentData.routingNumber = document.getElementById('routingNumber')?.value;

            if (!paymentData.bankName || !paymentData.accountNumber || !paymentData.routingNumber) {
                alert('Please fill in all bank transfer details.');
                return;
            }
        }

        const response = await fetch('/verify_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        const data = await response.json();
        if (data.success) {
            alert('Payment processed successfully! Check your email for confirmation.');
            window.location.reload();
        } else {
            throw new Error(data.error || 'Payment processing failed');
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        alert(error.message || 'Error processing payment. Please try again.');
    }
}

// Expose necessary functions globally
window.showPaymentModal = showPaymentModal;
window.processPayment = processPayment;
