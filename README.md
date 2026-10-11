# Booking Demo Class

A full-stack trial-class booking application inspired by Codeyoung. Parents can book a demo class, an available mentor is assigned, and both receive a dummy meeting link.

## Features

- Book available trial-class time slots.
- Automatically assign an available mentor.
- Support 10 mentors, each with a maximum of 2 demo classes per day.
- Handle parent and mentor time zones, including daylight saving time.
- Generate a dummy class meeting link.
- Store booking details and status in MongoDB.
- Handle unavailable slots and mentor capacity limits.
- Simulate email notifications when real email delivery is not configured.

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- React Router
- Axios

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose

## Project Structure

```text
Booking Demo Class/
├── Backend/
│   ├── src/
│   ├── .env
│   └── package.json
├── Frontend/
│   ├── src/
│   ├── .env
│   └── package.json
└── README.md
```

## Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm (included with Node.js)
- A MongoDB database, either MongoDB Atlas or a local MongoDB installation

## 1. Configure the Backend

Open a terminal in the project root and navigate to the backend:

```bash
cd Backend
npm install
```

Create or update the `Backend/.env` file:

```env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:5173
```

Replace `your_mongodb_connection_string` with your actual MongoDB connection URI.

Ensure the environment variable names match those used by the backend code.

## 2. Start the Backend

From the `Backend` directory, run:

```bash
npm run dev
```

If the project does not define a development script, check `Backend/package.json` for the available start command.

The backend should connect to MongoDB before accepting requests. Keep this terminal running.

## 3. Configure the Frontend

Open a **second terminal** from the project root:

```bash
cd Frontend
npm install
```

Create or update `Frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Ensure the URL matches the actual API prefix configured in the backend.

## 4. Start the Frontend

From the `Frontend` directory, run:

```bash
npm run dev
```

Vite will display the local development URL, usually:

http://localhost:5173

Open that URL in your browser to use the application.

## 5. Booking Workflow

1. The parent opens the booking page.
2. Available dates and time slots are retrieved from the backend.
3. The parent enters the required details and selects a slot.
4. The backend validates availability and assigns an eligible mentor.
5. The booking and its status are stored in MongoDB.
6. A dummy meeting link is generated or retrieved.
7. The parent and mentor are notified, subject to the configured email implementation.
8. The application displays the booking result.

## 6. Time Zones and Daylight Saving

The application must display booking times in the appropriate parent and mentor time zones.

- Use valid IANA time-zone identifiers, such as `America/New_York`, `Europe/London`, and `Asia/Kolkata`.
- Handle daylight-saving transitions using timezone-aware date/time logic.
- Avoid manually adding or subtracting fixed UTC offsets.
- Clearly identify the time zone when displaying a booking.

Verify that the implementation follows the actual timezone data and backend API contract.

## 7. Mentor Capacity

The application is designed to support:

- 10 mentors available for trial classes.
- A maximum of 2 demo classes per mentor per day.
- Automatic assignment based on mentor availability.
- An appropriate error message when no eligible mentor or slot is available.

Capacity checks must be enforced by the backend, not just by the frontend.

## 8. Build the Frontend

To check whether the frontend can be built for production:

```bash
cd Frontend
npm run build
```

If the build succeeds, Vite generates the production files in the `Frontend/dist` directory.

## Troubleshooting

**MongoDB connection fails**
- Check `MONGODB_URI` in `Backend/.env`.
- Verify your database credentials and MongoDB network access.
- Ensure your database is reachable.

**Frontend cannot reach the backend**
- Confirm that the backend is running.
- Verify `VITE_API_BASE_URL` in `Frontend/.env`.
- Check the backend CORS configuration and browser console.

**No available slots**
- Check mentor availability and daily capacity.
- Verify that the requested date and time are valid.
- Check the backend logs for errors.

**Email notifications are not delivered**
- Check whether the application uses simulated notifications or a configured email provider.
- Simulated notifications do not send real emails.

## Notes

- Never commit `.env` files or private credentials.
- Keep `.env.example` files updated with placeholder values.
- Run backend and frontend commands in separate terminals.
- Confirm actual booking persistence and email behavior before claiming that the complete workflow is operational.

