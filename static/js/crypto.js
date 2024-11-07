const SUPPORTED_CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDC', 'USDT'];
let cryptoPrices = {};
let selectedCrypto = 'BTC';
let cryptoBillAmount = 0;

// Fallback static prices
const FALLBACK_PRICES = {
    'BTC': 35000.00,
    'ETH': 1800.00,
    'USDC': 1.00,
    'USDT': 1.00
};

async function updateCryptoPrices() {
    try {
        const response = await fetch('/get_crypto_prices');
        if (!response.ok) {
            throw new Error('Failed to fetch crypto prices');
        }
        
        const data = await response.json();
        if (data.success) {
            cryptoPrices = data.prices;
            updatePaymentModal();
        } else {
            throw new Error(data.error || 'Failed to get crypto prices');
        }
    } catch (error) {
        console.error('Error fetching crypto prices:', error);
        console.log('Using fallback prices');
        cryptoPrices = FALLBACK_PRICES;
        updatePaymentModal();
    }
}

function showPaymentModal(totalUSD) {
    if (!totalUSD || isNaN(totalUSD)) {
        console.error('Invalid payment amount');
        return;
    }
    
    cryptoBillAmount = totalUSD;
    updateCryptoPrices();
    
    const modal = document.getElementById('paymentModal');
    if (modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

function updatePaymentModal() {
    const cryptoAmount = calculateCryptoAmount();
    const cryptoAmountElement = document.getElementById('cryptoAmount');
    const selectedCryptoElement = document.getElementById('selectedCrypto');
    
    if (cryptoAmountElement) {
        cryptoAmountElement.textContent = cryptoAmount.toFixed(8);
    }
    if (selectedCryptoElement) {
        selectedCryptoElement.textContent = selectedCrypto;
    }
    
    // Update crypto selector options
    const cryptoSelector = document.getElementById('cryptoSelector');
    if (cryptoSelector) {
        cryptoSelector.innerHTML = SUPPORTED_CRYPTOCURRENCIES.map(crypto => `
            <option value="${crypto}" ${crypto === selectedCrypto ? 'selected' : ''}>
                ${crypto} (1 ${crypto} = $${cryptoPrices[crypto]?.toFixed(2) || 'N/A'})
            </option>
        `).join('');
    }
}

function calculateCryptoAmount() {
    const price = cryptoPrices[selectedCrypto];
    if (!price || price <= 0) {
        console.error('Invalid crypto price:', price);
        return 0;
    }
    return cryptoBillAmount / price;
}

function changeCryptoCurrency(crypto) {
    if (!SUPPORTED_CRYPTOCURRENCIES.includes(crypto)) {
        console.error('Unsupported cryptocurrency:', crypto);
        return;
    }
    
    selectedCrypto = crypto;
    updatePaymentModal();
}

// Update crypto prices every 30 seconds
let priceUpdateInterval;
document.addEventListener('DOMContentLoaded', function() {
    updateCryptoPrices(); // Initial update
    priceUpdateInterval = setInterval(updateCryptoPrices, 30000);
});

// Clean up interval when leaving the page
window.addEventListener('beforeunload', function() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
});

// Expose necessary functions to window
window.showPaymentModal = showPaymentModal;
window.changeCryptoCurrency = changeCryptoCurrency;
