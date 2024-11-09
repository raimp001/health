import os
import time
from flask import Flask, render_template, jsonify, request, send_file, abort, send_from_directory
from flask_mail import Mail, Message
from decimal import Decimal
from models import db, Bill, Diagnosis, Procedure, InsuranceClaim
from datetime import datetime, timedelta
import logging
import requests
from pdf_generator import generate_bill_pdf
import json

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')

# Initialize extensions
mail = Mail(app)
db.init_app(app)

# Initialize database tables
with app.app_context():
    try:
        db.create_all()
        app.logger.info("Database tables created successfully")
    except Exception as e:
        app.logger.error(f"Database error: {str(e)}")

# Static exchange rates for fallback
STATIC_EXCHANGE_RATES = {
    'USD': 1.0,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110.0,
    'CAD': 1.25,
    'AUD': 1.35,
    'CNY': 6.45
}

# Static crypto prices for fallback
STATIC_CRYPTO_PRICES = {
    'BTC': 35000.00,
    'ETH': 2000.00,
    'USDT': 1.00,
    'USDC': 1.00
}

# Cache durations
CACHE_DURATION = 30  # seconds
last_rates_update = 0
last_crypto_update = 0
cached_exchange_rates = None
cached_crypto_prices = None

def get_live_exchange_rates():
    """Fetch live exchange rates from an API"""
    try:
        response = requests.get('https://api.exchangerate-api.com/v4/latest/USD', timeout=5)
        if response.status_code == 200:
            data = response.json()
            rates = {
                'USD': 1.0,
                'EUR': data['rates'].get('EUR', STATIC_EXCHANGE_RATES['EUR']),
                'GBP': data['rates'].get('GBP', STATIC_EXCHANGE_RATES['GBP']),
                'JPY': data['rates'].get('JPY', STATIC_EXCHANGE_RATES['JPY']),
                'CAD': data['rates'].get('CAD', STATIC_EXCHANGE_RATES['CAD']),
                'AUD': data['rates'].get('AUD', STATIC_EXCHANGE_RATES['AUD']),
                'CNY': data['rates'].get('CNY', STATIC_EXCHANGE_RATES['CNY'])
            }
            return rates
    except Exception as e:
        app.logger.error(f"Error fetching exchange rates: {str(e)}")
    return None

def get_live_crypto_prices():
    """Fetch live cryptocurrency prices from Coinbase API"""
    try:
        coinbase_key = os.environ.get('COINBASE_COMMERCE_API_KEY')
        if not coinbase_key:
            return None

        headers = {
            'X-CC-Api-Key': coinbase_key,
            'X-CC-Version': '2018-03-22'
        }
        
        crypto_symbols = ['BTC', 'ETH', 'USDT', 'USDC']
        prices = {}
        
        for symbol in crypto_symbols:
            try:
                response = requests.get(
                    f'https://api.commerce.coinbase.com/v2/exchange-rates?currency={symbol}',
                    headers=headers,
                    timeout=5
                )
                if response.status_code == 200:
                    data = response.json()
                    usd_rate = float(data['data']['rates']['USD'])
                    prices[symbol] = usd_rate
                else:
                    prices[symbol] = STATIC_CRYPTO_PRICES[symbol]
            except Exception as e:
                app.logger.error(f"Error fetching {symbol} price: {str(e)}")
                prices[symbol] = STATIC_CRYPTO_PRICES[symbol]
                
        return prices if all(symbol in prices for symbol in crypto_symbols) else None
    except Exception as e:
        app.logger.error(f"Error fetching crypto prices: {str(e)}")
        return None

@app.route('/')
def index():
    try:
        app.logger.info("Rendering index page")
        return render_template('index.html')
    except Exception as e:
        app.logger.error(f"Error rendering template: {str(e)}")
        return f"Error loading page: {str(e)}", 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

@app.route('/dashboard')
def dashboard():
    try:
        payments = Bill.query.order_by(Bill.created_at.desc()).all()
        return render_template('dashboard.html', payments=payments)
    except Exception as e:
        app.logger.error(f"Error loading dashboard: {str(e)}")
        return f"Error loading dashboard: {str(e)}", 500

@app.route('/get_exchange_rates')
def get_exchange_rates():
    global last_rates_update, cached_exchange_rates
    
    try:
        current_time = time.time()
        
        # Check if we need to update the cache
        if cached_exchange_rates is None or (current_time - last_rates_update) >= CACHE_DURATION:
            rates = get_live_exchange_rates()
            if rates:
                cached_exchange_rates = rates
                last_rates_update = current_time
            else:
                app.logger.warning("Using fallback exchange rates")
                cached_exchange_rates = STATIC_EXCHANGE_RATES
                
        return jsonify({
            'success': True,
            'rates': cached_exchange_rates,
            'is_live': cached_exchange_rates != STATIC_EXCHANGE_RATES
        })
    except Exception as e:
        app.logger.error(f"Error in exchange rates endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'rates': STATIC_EXCHANGE_RATES,
            'is_live': False
        })

@app.route('/get_crypto_prices')
def get_crypto_prices():
    global last_crypto_update, cached_crypto_prices
    
    try:
        current_time = time.time()
        
        # Check if we need to update the cache
        if cached_crypto_prices is None or (current_time - last_crypto_update) >= CACHE_DURATION:
            prices = get_live_crypto_prices()
            if prices:
                cached_crypto_prices = prices
                last_crypto_update = current_time
            else:
                app.logger.warning("Using fallback crypto prices")
                cached_crypto_prices = STATIC_CRYPTO_PRICES
                
        return jsonify({
            'success': True,
            'prices': cached_crypto_prices,
            'is_live': cached_crypto_prices != STATIC_CRYPTO_PRICES
        })
    except Exception as e:
        app.logger.error(f"Error in crypto prices endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'prices': STATIC_CRYPTO_PRICES,
            'is_live': False
        })

# ... [rest of the existing routes remain unchanged] ...

@app.template_filter('status_badge')
def status_badge(status):
    badges = {
        'pending': 'warning',
        'paid': 'success',
        'failed': 'danger'
    }
    return badges.get(status, 'secondary')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
