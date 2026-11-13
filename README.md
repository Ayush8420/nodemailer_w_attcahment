# Contact form mailer

A small contact form that sends the submitted fields to `ayushtiwari8420@gmail.com` and includes an optional photo attachment.

## Setup

1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `GMAIL_USER` to `ayushtiwari8420@gmail.com` and `GMAIL_APP_PASSWORD` to an app password generated for that Google account. Google app passwords require 2-Step Verification. Do not use your regular Gmail password or publish the `.env` file.
5. Run `npm start` and open [http://localhost:3000](http://localhost:3000).

The email is sent from the authenticated Gmail account to the same address. The visitor's email is set as the reply-to address. Photo uploads are limited to one JPEG, PNG, GIF, or WebP image up to 5 MB.
