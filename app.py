import os
import time
from flask import Flask, render_template, jsonify, request, send_file, abort, send_from_directory
from flask_mail import Mail, Message
from decimal import Decimal
from models import db, Bill, Diagnosis, Procedure, InsuranceClaim
from datetime import datetime, timedelta
import logging
from pdf_generator import generate_bill_pdf
import requests
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
    try:
        return jsonify({
            'success': True,
            'rates': STATIC_EXCHANGE_RATES
        })
    except Exception as e:
        app.logger.error(f"Error fetching exchange rates: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/get_crypto_prices')
def get_crypto_prices():
    try:
        return jsonify({
            'success': True,
            'prices': STATIC_CRYPTO_PRICES
        })
    except Exception as e:
        app.logger.error(f"Error fetching crypto prices: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/claim/<int:bill_id>')
def claim_form(bill_id):
    try:
        bill = Bill.query.get_or_404(bill_id)
        if not bill.insurance_provider:
            abort(400, description="This bill does not have insurance information")
        return render_template('claim_form.html', bill=bill)
    except Exception as e:
        app.logger.error(f"Error loading claim form: {str(e)}")
        return str(e), 500

@app.route('/api/bills/<int:bill_id>')
def get_bill_details(bill_id):
    try:
        bill = Bill.query.get_or_404(bill_id)
        return jsonify({
            'success': True,
            'bill': {
                'id': bill.id,
                'patient_name': bill.patient_name,
                'patient_dob': bill.patient_dob.isoformat(),
                'insurance_provider': bill.insurance_provider,
                'policy_number': bill.policy_number,
                'diagnoses': [{
                    'icd10_code': d.icd10_code,
                    'description': d.description
                } for d in bill.diagnoses],
                'procedures': [{
                    'cpt_code': p.cpt_code,
                    'description': p.description,
                    'amount': float(p.amount)
                } for p in bill.procedures]
            }
        })
    except Exception as e:
        app.logger.error(f"Error fetching bill details: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/submit_claim', methods=['POST'])
def submit_claim():
    try:
        data = request.get_json()
        bill_id = data.get('billId')
        
        if not bill_id:
            return jsonify({"success": False, "error": "Missing bill ID"}), 400
            
        bill = Bill.query.get(bill_id)
        if not bill:
            return jsonify({"success": False, "error": "Bill not found"}), 404

        claim = InsuranceClaim(
            bill_id=bill_id,
            payer_id=data['payerId'],
            payer_name=data['payerName'],
            subscriber_id=data['subscriberId'],
            subscriber_name=data['subscriberName'],
            subscriber_dob=datetime.strptime(data['subscriberDOB'], '%Y-%m-%d').date(),
            relationship_to_subscriber=data['relationshipToSubscriber'],
            date_of_service=datetime.strptime(data['dateOfService'], '%Y-%m-%d').date(),
            place_of_service=data['placeOfService']
        )
        
        claim.claim_number = f"CLM-{datetime.now().strftime('%Y%m%d')}-{bill_id}"
        
        bill.claim_status = 'submitted'
        bill.claim_submission_date = datetime.utcnow()
        bill.claim_number = claim.claim_number
        
        db.session.add(claim)
        db.session.commit()
        
        edi_content = generate_edi_file(claim)
        
        success, message = submit_to_clearinghouse(edi_content)
        
        if success:
            claim.status = 'submitted'
            claim.response_message = message
            db.session.commit()
            
            return jsonify({
                "success": True,
                "message": "Claim submitted successfully",
                "claim_number": claim.claim_number
            })
        else:
            claim.status = 'failed'
            claim.response_message = message
            db.session.commit()
            
            return jsonify({
                "success": False,
                "error": message
            }), 500
            
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error submitting claim: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def generate_edi_file(claim):
    try:
        segments = []
        
        segments.append(f"ISA*00*          *00*          *ZZ*{claim.payer_id}*ZZ*BILLING  *{datetime.now().strftime('%y%m%d')}*{datetime.now().strftime('%H%M')}*^*00501*000000001*0*P*>")
        segments.append(f"GS*HC*{claim.payer_id}*BILLING*{datetime.now().strftime('%Y%m%d')}*{datetime.now().strftime('%H%M')}*1*X*005010X222A1")
        segments.append("ST*837*0001*005010X222A1")
        segments.append(f"BHT*0019*00*{claim.claim_number}*{datetime.now().strftime('%Y%m%d')}*{datetime.now().strftime('%H%M')}*CH")
        segments.append(f"NM1*IL*1*{claim.subscriber_name.split()[1]}*{claim.subscriber_name.split()[0]}****MI*{claim.subscriber_id}")
        segments.append("NM1*85*2*BILLINGDOG HEALTHCARE*****XX*1234567890")
        
        for i, procedure in enumerate(claim.bill.procedures, 1):
            segments.append(f"LX*{i}")
            segments.append(f"SV1*HC:{procedure.cpt_code}*{float(procedure.amount)}*UN*1***1")
        
        segments.append(f"SE*{len(segments)}*0001")
        segments.append("GE*1*1")
        segments.append("IEA*1*000000001")
        
        return "\n".join(segments)
        
    except Exception as e:
        app.logger.error(f"Error generating EDI file: {str(e)}")
        raise

def submit_to_clearinghouse(edi_content):
    try:
        app.logger.info("Simulating claim submission to clearinghouse")
        app.logger.debug(f"EDI Content:\n{edi_content}")
        
        time.sleep(1)
        
        return True, "Claim accepted for processing"
        
    except Exception as e:
        app.logger.error(f"Error submitting to clearinghouse: {str(e)}")
        return False, str(e)

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