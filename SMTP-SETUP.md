# SMTP Setup Instructions

This guide will help you configure SMTP settings for your changedetectionio-tor application so you can receive email notifications for site changes.

## Automatic Setup (Recommended)

The easiest way to configure SMTP is by using our setup script:

1. Make the setup script executable:

   ```bash
   chmod +x setup-smtp.sh
   ```

2. Run the setup script:

   ```bash
   ./setup-smtp.sh
   ```

3. Follow the prompts to enter your SMTP credentials:
   - Choose from common SMTP providers or use a custom configuration
   - Enter your SMTP username and password
   - Specify the "From" email address for notifications

4. The script will automatically:
   - Save your settings to a `.env` file
   - Offer to restart the application to apply the changes

## Common SMTP Providers

### Gmail

- Host: smtp.gmail.com
- Port: 587
- Secure: false
- Note: For Gmail, you need to use an App Password if you have 2-factor authentication enabled.
  Visit [Google App Passwords](https://myaccount.google.com/apppasswords) to generate one.

### Outlook/Office 365

- Host: smtp.office365.com
- Port: 587
- Secure: false

### Yahoo

- Host: smtp.mail.yahoo.com
- Port: 587
- Secure: false

### Amazon SES

- Host: email-smtp.us-east-1.amazonaws.com (or your region's endpoint)
- Port: 587
- Secure: false
- Note: You'll need your SES SMTP credentials from the AWS console

### SendGrid

- Host: smtp.sendgrid.net
- Port: 587
- Secure: false
- Note: For username, use "apikey" and for password use your SendGrid API key

## Manual Setup

If you prefer to set up SMTP manually, you can:

1. Create or edit the `.env` file at the root of the project
2. Add or modify the following variables:

   ```plaintext
   SMTP_HOST=your-smtp-server.com
   SMTP_PORT=587
   SMTP_USER=your-username
   SMTP_PASSWORD=your-password
   SMTP_FROM=notifications@example.com
   SMTP_SECURE=false
   ```

3. Restart your application:

   ```bash
   docker compose down
   docker compose up -d
   ```

## Testing SMTP Configuration

After setting up your SMTP configuration, you can test it by:

1. Accessing the Next.js application at [http://localhost:3000](http://localhost:3000)
2. Navigate to Settings > Email
3. Use the "Test Email" function to verify your configuration

If you encounter any issues, check the logs of the main-app service:

```bash
docker logs nextjs-app
```

## Troubleshooting

### Connection Issues

- Verify your SMTP credentials are correct
- Check if your SMTP provider requires specific security settings
- Make sure your SMTP provider allows connections from your IP address
- For Gmail, ensure you're using an App Password if 2FA is enabled

### Emails Not Being Sent

- Check the application logs for error messages
- Verify the "From" email address is properly formatted
- Check if your email service has sending limits or restrictions

### SSL/TLS Issues

- Try setting `SMTP_SECURE=true` if your provider requires SSL/TLS
- Some providers may require specific ports for secure connections (e.g., 465)
