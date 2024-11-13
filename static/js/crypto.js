const SUPPORTED_CRYPTOCURRENCIES = ['BTC', 'ETH', 'USDC', 'USDT'];
let cryptoPrices = {};
let selectedCrypto = 'BTC';
let cryptoBillAmount = 0;
let retryCount = 0;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

// Fallback static prices
const FALLBACK_PRICES = {
    'BTC': 35000.00,
    'ETH': 1800.00,
    'USDC': 1.00,
    'USDT': 1.00
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updateCryptoPrices() {
    const statusElement = document.getElementById('cryptoStatus');
    try {
        retryCount = 0;
        while (retryCount < MAX_RETRIES) {
            try {
                if (statusElement) {
                    statusElement.textContent = 'Fetching prices...';
                    statusElement.className = 'text-info small';
                }

                const response = await fetch('/get_crypto_prices', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                if (!data) {
                    throw new Error('Empty response received');
                }

                if (data.success) {
                    if (!data.prices || Object.keys(data.prices).length === 0) {
                        throw new Error('No price data received');
                    }
                    cryptoPrices = data.prices;
                    console.log('Successfully updated crypto prices:', cryptoPrices);
                    
                    if (statusElement) {
                        statusElement.textContent = data.is_live ? 
                            'Live prices' : 
                            'Using cached prices';
                        statusElement.className = `text-${data.is_live ? 'success' : 'warning'} small`;
                    }
                    break;  // Success, exit retry loop
                } else {
                    throw new Error(data.error || 'Server returned error status');
                }
            } catch (error) {
                retryCount++;
                if (retryCount < MAX_RETRIES) {
                    const delay = BASE_DELAY * Math.pow(2, retryCount);
                    console.warn(`Retry ${retryCount}/${MAX_RETRIES} after ${delay}ms`);
                    if (statusElement) {
                        statusElement.textContent = `Retrying... (${retryCount}/${MAX_RETRIES})`;
                        statusElement.className = 'text-warning small';
                    }
                    await sleep(delay);
                } else {
                    throw error;  // Rethrow after max retries
                }
            }
        }
    } catch (error) {
        console.error('Error fetching crypto prices:', error.message);
        console.warn('Using fallback prices');
        cryptoPrices = FALLBACK_PRICES;
        
        if (statusElement) {
            statusElement.textContent = 'Using fallback prices due to connection issues';
            statusElement.className = 'text-warning small';
        }
    } finally {
        updatePaymentModal();
    }
}

function showPaymentModal(totalUSD) {
    if (!totalUSD || isNaN(totalUSD)) {
        console.error('Invalid payment amount:', totalUSD);
        return;
    }
    
    cryptoBillAmount = totalUSD;
    const modal = document.getElementById('paymentModal');
    if (modal) {
        updateCryptoPrices(); // Initial price update
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

function updatePaymentModal() {
    try {
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
            cryptoSelector.innerHTML = SUPPORTED_CRYPTOCURRENCIES.map(crypto => {
                const price = cryptoPrices[crypto];
                const priceDisplay = price ? `$${price.toFixed(2)}` : 'N/A';
                return `
                    <option value="${crypto}" ${crypto === selectedCrypto ? 'selected' : ''}>
                        ${crypto} (1 ${crypto} = ${priceDisplay})
                    </option>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error updating payment modal:', error);
    }
}

function calculateCryptoAmount() {
    const price = cryptoPrices[selectedCrypto];
    if (!price || price <= 0) {
        console.error('Invalid crypto price for', selectedCrypto, ':', price);
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

// Price update interval management
let priceUpdateInterval;

function startPriceUpdates() {
    updateCryptoPrices(); // Initial update
    priceUpdateInterval = setInterval(updateCryptoPrices, 30000);
}

function stopPriceUpdates() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
        priceUpdateInterval = null;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', startPriceUpdates);
window.addEventListener('beforeunload', stopPriceUpdates);

// Modal event listeners for better interval management
document.addEventListener('DOMContentLoaded', function() {
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
        paymentModal.addEventListener('shown.bs.modal', startPriceUpdates);
        paymentModal.addEventListener('hidden.bs.modal', stopPriceUpdates);
    }
});

// Expose necessary functions to window
window.showPaymentModal = showPaymentModal;
window.changeCryptoCurrency = changeCryptoCurrency;
