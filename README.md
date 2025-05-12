# English Language Center Management System

A full-stack web application for managing an English language center, including teachers, students, courses, and scheduling.

## Features

- Comprehensive course management with automatic session generation
- Progress tracking for courses and students
- Automated schedule adjustments for missed sessions
- Responsive design for desktop and mobile
- Interactive UI with smooth animations

## Tech Stack

- **Frontend**: React
- **Backend**: Node.js with Express
- **Database**: MongoDB

## Project Structure

```
center-v1/
├── frontend/        # React frontend
└── backend/         # Express backend
    ├── config/      # Configuration files
    ├── controllers/ # Route controllers
    ├── models/      # MongoDB schemas
    ├── routes/      # API routes
    ├── tests/       # Test scripts
    └── utils/       # Utility functions
```

## Setup and Installation

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/language-center
   TEST_MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/language-center-test
   NODE_ENV=development
   ```

4. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Testing

The project includes comprehensive tests for the database and API functionality:

- Run database tests: `npm run test:db`
- Run API tests: `npm run test:api`
- Run all tests: `npm run test:all`

## Course Management Features

- **Automated Session Generation**: Automatically creates a schedule of sessions based on weekly schedule and total sessions.
- **Progress Tracking**: Tracks completion percentage and automatically updates course status.
- **Compensatory Sessions**: Automatically adds compensatory sessions for absences.
- **Estimated End Date**: Calculates the expected end date based on the schedule.

## API Endpoints

### Teachers
- `GET /api/teachers`: Get all teachers
- `GET /api/teachers/:id`: Get teacher by ID
- `POST /api/teachers`: Create a teacher
- `PUT /api/teachers/:id`: Update a teacher
- `DELETE /api/teachers/:id`: Delete a teacher
- `GET /api/teachers/:id/courses`: Get courses taught by a teacher

### Students
- `GET /api/students`: Get all students
- `GET /api/students/:id`: Get student by ID
- `POST /api/students`: Create a student
- `PUT /api/students/:id`: Update a student
- `DELETE /api/students/:id`: Delete a student
- `GET /api/students/:id/enrollments`: Get enrollments for a student
- `POST /api/students/:id/enroll`: Enroll student in a course

### Courses
- `GET /api/courses`: Get all courses
- `GET /api/courses/:id`: Get course by ID
- `POST /api/courses`: Create a course
- `PUT /api/courses/:id`: Update a course
- `DELETE /api/courses/:id`: Delete a course
- `GET /api/courses/:id/sessions`: Get sessions for a course
- `PUT /api/courses/:id/sessions/:sessionIndex`: Update a session status
- `GET /api/courses/:id/enrollments`: Get enrollments for a course
- `GET /api/courses/:id/progress`: Get course progress summary 