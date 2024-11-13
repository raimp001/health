from app import app

if __name__ == '__main__':
    # Force HTTPS in production
    app.config['PREFERRED_URL_SCHEME'] = 'https'
    # Ensure proper SSL handling
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['REMEMBER_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    
    # Run the application
    app.run(
        host='0.0.0.0',  # Listen on all available interfaces
        port=5000,       # Default port for Replit
        debug=False      # Disable debug mode in production
    )
