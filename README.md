# BillingDog - Healthcare Billing System

A modern healthcare billing application that enables medical payment processing with cryptocurrency support and automated email receipts. Built with Flask and modern JavaScript.

![BillingDog Logo](https://cdn.jsdelivr.net/npm/lucide-static@0.16.29/icons/dog.svg)

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

### Payment Integration
- Cryptocurrency payment processing
- Bank transfer integration
- Real-time exchange rate updates
- Multiple currency support

## Deployment

This application is designed to be deployed and run on Replit. Follow these steps to deploy:

1. Fork the project on Replit:
   - Visit [https://replit.com/@raimp001/HealthBillPay](https://replit.com/@raimp001/HealthBillPay)
   - Click the "Fork" button

2. Configure environment variables in your Replit project:
   - Open the "Secrets" tab in your Replit project
   - Add the following environment variables:
     ```
     DATABASE_URL=postgresql://...
     MAIL_USERNAME=your-email@gmail.com
     MAIL_PASSWORD=your-email-password
     STRIPE_PUBLISHABLE_KEY=your-stripe-key
     COINBASE_COMMERCE_API_KEY=your-coinbase-key
     ```

3. Deploy:
   - Click the "Run" button in Replit
   - The application will automatically:
     - Install dependencies
     - Configure the database
     - Start the server

4. Access your deployed application:
   - Use the URL provided by Replit
   - The format will be: `https://healthbillpay.[your-replit-username].repl.co`

## Development Setup

### Prerequisites
- Python 3.11 or higher
- PostgreSQL database
- SMTP server access for email notifications

### Local Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/raimp001/HealthBillPay.git
   cd HealthBillPay
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables as described in the deployment section

4. Start the application:
   ```bash
   python main.py
   ```

The application will be available at `http://localhost:5000`

## Project Structure

```
HealthBillPay/
├── app.py              # Main application file
├── models.py           # Database models
├── pdf_generator.py    # PDF generation utilities
├── static/
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── images/        # Static images
├── templates/          # HTML templates
└── main.py            # Application entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature description"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Open an issue in the GitHub repository
- Contact the development team through the repository's issue tracker
- Check the documentation for common solutions

## Acknowledgments

- Bootstrap UI Framework for the responsive design
- Replit for hosting and deployment support
- Font Awesome for icons
- The Flask community for excellent documentation
