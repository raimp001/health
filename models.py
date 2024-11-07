from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Bill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_name = db.Column(db.String(100), nullable=False)
    patient_dob = db.Column(db.Date, nullable=False)
    insurance_provider = db.Column(db.String(100))
    policy_number = db.Column(db.String(50))
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    payment_status = db.Column(db.String(20), default='pending')
    payment_method = db.Column(db.String(20))  # 'crypto' or 'bank'
    
    # Crypto payment fields
    transaction_hash = db.Column(db.String(66))
    payment_currency = db.Column(db.String(10))
    crypto_amount = db.Column(db.Numeric(20, 8))
    
    # Bank transfer fields
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(50))
    routing_number = db.Column(db.String(50))
    bank_currency = db.Column(db.String(3))
    bank_exchange_rate = db.Column(db.Numeric(10, 4))
    
    # Insurance claim fields
    claim_status = db.Column(db.String(20), default='pending')  # pending, submitted, approved, denied
    claim_submission_date = db.Column(db.DateTime)
    claim_number = db.Column(db.String(50))
    
    # Relationships
    diagnoses = db.relationship('Diagnosis', backref='bill', lazy=True, cascade="all, delete-orphan")
    procedures = db.relationship('Procedure', backref='bill', lazy=True, cascade="all, delete-orphan")
    claims = db.relationship('InsuranceClaim', backref='bill', lazy=True)

class Diagnosis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bill.id', ondelete='CASCADE'), nullable=False)
    icd10_code = db.Column(db.String(10), nullable=False)
    description = db.Column(db.String(200))
    amount = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)

class Procedure(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bill.id', ondelete='CASCADE'), nullable=False)
    cpt_code = db.Column(db.String(10), nullable=False)
    description = db.Column(db.String(200))
    amount = db.Column(db.Numeric(10, 2), nullable=False)

class InsuranceClaim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bill.id'), nullable=False)
    payer_id = db.Column(db.String(50), nullable=False)
    payer_name = db.Column(db.String(100), nullable=False)
    subscriber_id = db.Column(db.String(50), nullable=False)
    subscriber_name = db.Column(db.String(100), nullable=False)
    subscriber_dob = db.Column(db.Date, nullable=False)
    relationship_to_subscriber = db.Column(db.String(20), nullable=False)
    date_of_service = db.Column(db.Date, nullable=False)
    place_of_service = db.Column(db.String(2), nullable=False)
    status = db.Column(db.String(20), default='pending')
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    claim_number = db.Column(db.String(50))
    response_message = db.Column(db.Text)
