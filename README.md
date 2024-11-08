# BillingDog - Healthcare Billing System

A modern healthcare billing application that enables medical payment processing with cryptocurrency support and automated email receipts. Built with Flask and modern JavaScript.

![BillingDog Interface](static/images/billingdog_interface.png)

## Features

### Core Functionality
- Patient information management and tracking
- ICD-10 code search with autocomplete functionality
- CPT code-based procedure tracking
- Lab services and radiology studies management
- Additional charges and services tracking

### Payment Processing
- Multiple payment methods:
  - Cryptocurrency payments integration
  - Bank transfer support
- Multi-currency support:
  - USD, EUR, GBP, JPY, CAD, AUD, CNY
- Real-time currency conversion
- Automated email receipts
- Professional PDF bill generation

### Insurance Management
- Insurance provider integration
- Automated claim submission
- EDI X12 837P format support
- Claim tracking and status updates
- Policy number management

### Dashboard & Reporting
- Comprehensive payment history dashboard
- Multiple filtering options:
  - Date range
  - Payment status
  - Payment method
- Detailed payment view functionality
- PDF bill download capability

## Quick Start Guide

### 1. Fork on Replit
[![Run on Replit](https://replit.com/badge/github/raimp001/HealthBillPay)](https://replit.com/@raimp001/HealthBillPay)

Click the "Run on Replit" button above or visit [https://replit.com/@raimp001/HealthBillPay](https://replit.com/@raimp001/HealthBillPay) and click "Fork".

### 2. Configure Environment Variables
After forking, set up your environment variables in the Replit Secrets tab:

Required secrets:
```
DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
STRIPE_PUBLISHABLE_KEY=your-stripe-key
COINBASE_COMMERCE_API_KEY=your-coinbase-key
```

### 3. Deploy and Run
1. Click the "Run" button in your Replit project
2. The application will automatically:
   - Install required dependencies
   - Initialize the PostgreSQL database
   - Start the Flask server
3. Access your application at the provided Replit URL

## Application Screenshots

### Billing Interface
![Billing Form](Screenshot%202024-11-02%20at%209.39.43%20AM.png)
The main billing interface allows easy input of patient information and services.

### Payment Dashboard
![Payment Dashboard](Screenshot%202024-11-07%20at%204.35.10%20PM.png)
Track all payments and claims through the comprehensive dashboard.

## Tech Stack

### Backend
- Flask (Python 3.11)
- PostgreSQL Database
- SQLAlchemy ORM
- Flask-Mail for email integration
- ReportLab for PDF generation

### Frontend
- HTML5 & CSS3
- Modern JavaScript (ES6+)
- Bootstrap UI Framework
- Replit Dark Theme integration

## Detailed Setup Instructions

### 1. Database Setup
The application automatically sets up the PostgreSQL database on first run. Tables created include:
- Bills
- Diagnoses
- Procedures
- Insurance Claims

### 2. Email Configuration
For Gmail users:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in your MAIL_PASSWORD secret

### 3. Payment Integration
Configure payment providers:
1. Stripe: Add your publishable key to enable bank transfers
2. Coinbase Commerce: Add API key for cryptocurrency payments

## Project Structure
```
HealthBillPay/
├── app.py              # Main Flask application
├── models.py           # SQLAlchemy database models
├── pdf_generator.py    # PDF generation module
├── static/
│   ├── css/           # Stylesheets
│   │   └── style.css  # Main stylesheet
│   ├── js/            # JavaScript modules
│   │   ├── billing.js # Billing form handling
│   │   ├── payment.js # Payment processing
│   │   └── claim.js   # Insurance claim handling
│   └── images/        # Static images
├── templates/         # HTML templates
│   ├── base.html     # Base template
│   ├── index.html    # Main billing form
│   └── dashboard.html # Payment dashboard
└── requirements.txt   # Python dependencies
```

## Troubleshooting

### Common Issues
1. Database Connection
   - Verify DATABASE_URL format
   - Check PostgreSQL service status
   - Ensure correct credentials

2. Email Sending
   - Verify SMTP settings
   - Check email credentials
   - Enable less secure app access if needed

3. Payment Processing
   - Validate API keys
   - Check payment provider status
   - Verify webhook configurations

## Support and Updates

For support:
1. Open an issue on GitHub
2. Check the [Issues](https://github.com/raimp001/HealthBillPay/issues) section
3. Review documentation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Bootstrap for the responsive UI framework
- Replit for hosting and deployment
- Font Awesome for icons
- Flask community for excellent documentation
