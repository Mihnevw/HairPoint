# Salon Reservation System

A modern web application for managing hairdresser salon appointments using Google Calendar integration.

## Features

- Date and time slot selection
- Google Calendar integration
- Email notifications for clients and administration
- Responsive design
- No database required (uses Google Calendar as data store)

## Prerequisites

- Node.js (v14 or higher)
- Google Cloud Platform account with Calendar API enabled
- Gmail account for sending notifications

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd salon-reservation-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Google Calendar credentials
   - Configure email settings

4. Set up Google Calendar API:
   - Create a project in Google Cloud Console
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs
   - Update the `.env` file with your credentials

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
salon-reservation-system/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   ├── utils/         # Utility functions
│   ├── public/        # Static files
│   └── views/         # Frontend templates
├── .env               # Environment variables
├── package.json       # Project dependencies
└── README.md         # Project documentation
```

## API Endpoints

- `GET /api/available-slots` - Get available time slots for a date
- `POST /api/reservations` - Create a new reservation
- `GET /api/reservations/:id` - Get reservation details
- `DELETE /api/reservations/:id` - Cancel a reservation

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 