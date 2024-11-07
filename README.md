# BillingDog - Healthcare Billing System

A modern healthcare billing application that supports crypto payments and email receipts using Flask and JavaScript.

## Features

- Patient information management
- ICD-10 code search and diagnosis tracking
- CPT code-based procedure tracking
- Multiple payment options (Cryptocurrency and Bank Transfer)
- Multiple currency support
- Email receipts
- PDF bill generation
- Insurance claim submission (EDI X12 837P format)
- Payment history dashboard

## Tech Stack

- Backend: Flask (Python)
- Frontend: HTML, JavaScript, Bootstrap
- Database: PostgreSQL
- PDF Generation: ReportLab
- Email: Flask-Mail
- Styling: Bootstrap with Replit Dark Theme

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```
   DATABASE_URL=postgresql://...
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-email-password
   ```

4. Initialize the database:
   ```bash
   flask db upgrade
   ```

5. Run the application:
   ```bash
   python main.py
   ```

## Development

The application is structured as follows:

- `app.py`: Main application file with route handlers
- `models.py`: Database models
- `pdf_generator.py`: PDF generation utilities
- `static/`: Static assets (CSS, JavaScript)
- `templates/`: HTML templates
- `main.py`: Application entry point

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Deployment

The application is deployed on Replit. To deploy:

1. Fork the project on Replit
2. Set up the required environment variables
3. Run the application using the run button

## Support

For support, please open an issue in the GitHub repository.
