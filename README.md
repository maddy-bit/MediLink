# MediLink — Project Documentation

> Version 1.0 · Full-stack Healthcare Procedure Discovery & Booking Platform

---

# Table of Contents

1. Project Overview
2. System Architecture
3. Technology Stack
4. Repository Structure
5. Environment Setup
6. Authentication & Authorization
7. Database Models
8. Backend API Reference
9. Frontend Routes & Pages
10. Role System
11. Core Workflows
12. Payment Flow
13. Security
14. Deployment Notes

---

# 1. Project Overview

**MediLink** is a healthcare aggregator platform that helps patients discover, compare, and book medical procedures such as **X-rays, MRIs, CT scans, pathology tests, and consultations** at nearby hospitals.

The platform focuses on **price transparency, location-based discovery, hospital comparison, and quick appointment booking**.

Patients can:

* Search medical treatments
* Compare nearby hospitals
* Sort hospitals by **price, distance, and ratings**
* View slot availability
* Book appointments
* Pay a ₹1 confirmation token
* Submit reviews and ratings

Hospital Admins can:

* Manage hospital services
* View confirmed bookings
* Monitor patient appointments
* Manage slots and pricing

---

# 2. System Architecture

```txt
┌────────────────────────────────────────────┐
│               CLIENT (Browser)             │
│         React + Vite + TailwindCSS         │
│                Port: 5173                  │
└─────────────────┬──────────────────────────┘
                  │ HTTP Requests (Axios)
                  │ JWT Authentication
┌─────────────────▼──────────────────────────┐
│               SERVER (Node.js)             │
│             Express.js Backend             │
│                Port: 5000                  │
│                                            │
│ Middleware Stack                           │
│ Helmet → Rate Limiter → CORS → JWT → JSON │
│                                            │
│ Route Groups                               │
│ /auth                                      │
│ /hospital                                  │
│ /search                                    │
│ /booking                                   │
│ /payment                                   │
│ /review                                    │
│ /admin                                     │
└─────────────────┬──────────────────────────┘
                  │ Mongoose ODM
┌─────────────────▼──────────────────────────┐
│                 MongoDB Atlas              │
│ Collections                                │
│ users                                      │
│ hospitals                                  │
│ bookings                                   │
│ reviews                                    │
│ services                                   │
└────────────────────────────────────────────┘
```

---

# 3. Technology Stack

## Frontend

| Package          | Purpose                 |
| ---------------- | ----------------------- |
| React.js         | UI Framework            |
| Vite             | Development Environment |
| TailwindCSS      | Styling                 |
| Axios            | API Calls               |
| React Router DOM | Routing                 |
| Lucide React     | Icons                   |
| React Hot Toast  | Notifications           |

---

## Backend

| Package            | Purpose               |
| ------------------ | --------------------- |
| Node.js            | Runtime               |
| Express.js         | Server Framework      |
| MongoDB            | Database              |
| Mongoose           | ODM                   |
| JWT                | Authentication        |
| bcryptjs           | Password Hashing      |
| dotenv             | Environment Config    |
| cors               | Cross-Origin Requests |
| cookie-parser      | Cookies               |
| Helmet             | Security Headers      |
| express-rate-limit | Rate Limiting         |

---

# 4. Repository Structure

```txt
MediLink/
│
├── frontend/
│   ├── public/
│   │   └── images/
│   │
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── HospitalCard.jsx
│   │   │   ├── RatingStars.jsx
│   │   │   ├── ReviewSection.jsx
│   │   │   ├── BookingCalendar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── Loader.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── SearchHospital.jsx
│   │   │   ├── HospitalDetails.jsx
│   │   │   ├── BookingPage.jsx
│   │   │   ├── PaymentPage.jsx
│   │   │   ├── MyBookings.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── BookingManagement.jsx
│   │   │       ├── ServiceManagement.jsx
│   │   │       └── SlotManagement.jsx
│   │   │
│   │   ├── layouts/
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── hospitalController.js
│   │   │   ├── bookingController.js
│   │   │   ├── reviewController.js
│   │   │   ├── paymentController.js
│   │   │   └── adminController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Hospital.js
│   │   │   ├── Booking.js
│   │   │   └── Review.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── hospitalRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── reviewRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   └── adminRoutes.js
│   │
│   ├── .env
│   ├── server.js
│   ├── package.json
│   └── data/
│
└── README.md
```

---

# 5. Authentication & Authorization

## Roles

### Patient

* Search treatments
* Compare hospitals
* Book appointments
* Pay ₹1 token
* Leave reviews

### Hospital Admin

* Access admin dashboard
* View confirmed bookings
* Manage slots
* Update pricing

---

## Authentication Flow

```txt
Register
   ↓
Select Role
   ↓
Login
   ↓
JWT Token Generated
   ↓
Protected Routes
```

JWT payload:

```json
{
  "_id": "userId",
  "email": "user@email.com",
  "role": "patient | admin"
}
```

---

# 6. Database Models

## User

```js
{
  name: String,
  email: String,
  password: String,
  role: "patient" | "admin"
}
```

---

## Hospital

```js
{
  name: String,
  latitude: Number,
  longitude: Number,

  services: [
    {
      name: String,
      price: Number
    }
  ],

  overallRating: Number
}
```

---

## Booking

```js
{
  patientId: ObjectId,
  hospitalId: ObjectId,

  service: String,

  date: Date,

  timeSlot: String,

  paymentStatus:
    "Pending" | "Success",

  amountPaid: 1
}
```

---

## Review

```js
{
  hospitalId: ObjectId,
  patientName: String,
  rating: Number,
  comment: String
}
```

---

# 7. Backend API Reference

Base URL:

```txt
http://localhost:5000/api
```

---

## Authentication — `/auth`

| Method | Endpoint       | Description      |
| ------ | -------------- | ---------------- |
| POST   | /auth/register | Register User    |
| POST   | /auth/login    | Login User       |
| GET    | /auth/me       | Get Current User |

---

## Hospital — `/hospital`

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| GET    | /hospital/search | Search treatment |
| GET    | /hospital/:id    | Hospital details |
| GET    | /hospital/nearby | Nearby hospitals |

---

## Booking — `/booking`

| Method | Endpoint             | Description     |
| ------ | -------------------- | --------------- |
| POST   | /booking/create      | Create booking  |
| GET    | /booking/my          | User bookings   |
| PATCH  | /booking/confirm/:id | Confirm booking |

---

## Payment — `/payment`

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| POST   | /payment/mock | Simulate ₹1 payment |

---

## Review — `/review`

| Method | Endpoint            | Description   |
| ------ | ------------------- | ------------- |
| POST   | /review/:hospitalId | Add review    |
| GET    | /review/:hospitalId | Fetch reviews |

---

## Admin — `/admin`

| Method | Endpoint        | Description            |
| ------ | --------------- | ---------------------- |
| GET    | /admin/bookings | All confirmed bookings |
| PUT    | /admin/services | Update service pricing |
| PUT    | /admin/slots    | Manage slots           |

---

# 8. Frontend Routes

## Public Routes

| Route     | Page         |
| --------- | ------------ |
| /         | Landing Page |
| /login    | Login        |
| /register | Register     |

---

## Patient Routes

| Route         | Page             |
| ------------- | ---------------- |
| /search       | Search Treatment |
| /hospital/:id | Hospital Details |
| /booking/:id  | Booking Page     |
| /payment/:id  | Payment Page     |
| /my-bookings  | My Bookings      |

---

## Admin Routes

| Route            | Page            |
| ---------------- | --------------- |
| /admin/dashboard | Dashboard       |
| /admin/bookings  | Booking Feed    |
| /admin/services  | Service Pricing |
| /admin/slots     | Slot Management |

---

# 9. Core Workflows

## Treatment Search Flow

```txt
User Opens Search
       ↓
Location Permission Requested
       ↓
User Searches Treatment
       ↓
Nearby Hospitals Displayed
       ↓
Sort By:
Price | Distance | Ratings
```

---

## Booking Flow

```txt
Select Hospital
       ↓
Choose Slot
       ↓
Proceed to ₹1 Payment
       ↓
Mock Payment Success
       ↓
Booking Confirmed
```

---

## Review Flow

```txt
Visit Hospital Page
       ↓
Select Rating
       ↓
Write Review
       ↓
Submit
       ↓
Live Reviews Updated
```

---

# 10. Security

* JWT Authentication
* Password Hashing (bcrypt)
* Role-Based Authorization
* Protected Routes
* Helmet Security Headers
* Rate Limiting
* CORS Protection

---

# 11. Deployment Notes

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```txt
http://localhost:5000
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

# Future Improvements

* Real Razorpay integration
* Real hospital APIs
* AI-based hospital recommendations
* Emergency ambulance booking
* Doctor video consultation
* Multi-language support
* Medical reports upload
* Appointment reminders
