# Database Schema Creation System Test (dbscst)

---

## Overview
`dbscst` is a **Database Schema Creation System Test** project designed to help users generate and manage database schemas dynamically. It consists of two main components:
1. **`dbscst-backend`**: A FastAPI-based backend that handles schema generation, authentication, and API interactions.
2. **`dbscst-frontend`**: A React-based frontend that provides a user interface for interacting with the backend.

---

## Backend Structure: `dbscst-backend`

The backend is structured as follows:

dbscst-backend/
├── src/
│ ├── apps/
│ │ ├── auth/
│ │ │ ├── router.py # Authentication routes
│ │ │ ├── schema.py # Pydantic models for authentication
│ │ │ └── utils.py # Utility functions for auth (e.g., email verification)
│ │ ├── databaseSchema/
│ │ │ ├── models.py # Database models (SQLAlchemy)
│ │ │ ├── router.py # Schema generation routes
│ │ │ ├── schemas.py # Pydantic models for schema generation
│ │ │ └── services/
│ │ │ └── openai.py # OpenAI integration for schema generation
│ ├── core/
│ │ ├── config.py # Configuration settings (e.g., environment variables)
│ │ ├── security.py # Security utilities (e.g., password hashing, JWT)
│ │ └── database/
│ │ └── _db.py # Database connection and session management
│ └── main.py # Entry point for the FastAPI application
├── test/ # Unit and integration tests
├── .gitignore # Specifies files to ignore in Git
└── requirements.txt # Python dependencies


## Getting Started with `dbscst-backend`

### 1. Install Dependencies
Navigate to the `dbscst-backend` directory and install the required Python packages:
```bash
pip install -r requirements.txt

```
### 2. Set Up Environment Variables

Create a .env file in the root of the dbscst-backend directory and add the following environment variables:

# .env
APOSTGRES_DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/dbname
API_KEY=your_api_key
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

Replace the placeholders (your_api_key, your_openai_api_key, etc.) with your actual values.

### 3. Start the Development Server
Navigate to the src directory and run the following command to start the FastAPI development server:
```bash
fastapi dev main.py

```
The server will start at http://localhost:8000.

### 4. Set Up Email Verification (Optional)
If you want to test email verification locally:
```bash
npm install -g ngrok
ngrok http 8000
```

## Getting Started with `Getting Started with dbscst-frontend`

### 1. Install Dependencies
Navigate to the dbscst-frontend directory and install the required Node.js packages:
The frontend is structured as follows:
```bash
npm install

```

### 2. Set Up Environment Variables
Create a .env file in the root of the dbscst-frontend directory and add the following environment variables:

```bash
# .env
VITE_API_KEY=your_api_key 
```

### 3. Start the Development Server
Run the following command to start the React development server:
```bash
npm run dev

```


## API & Data Handling
LLM Service for Schema Generation
The backend uses the OpenAI GPT-4 model to generate database schemas dynamically.

The openai.py service handles interactions with the OpenAI API, ensuring that the generated schemas are accurate and adhere to the specified requirements.

Robust Endpoint Handling
The backend implements robust error handling for all endpoints, ensuring that:

Invalid inputs are rejected with meaningful error messages.

Internal server errors are logged and handled gracefully.

Authentication and authorization are enforced for protected endpoints.

## Schema Generation & Storage
SQL Compatibility
The generated schemas are SQL-compatible, and here’s why:

### Wide Adoption:

SQL databases are widely used across industries, making SQL schemas more versatile and easier to integrate with existing systems.

### Structured Data:

SQL databases enforce a structured schema, which ensures data integrity and consistency. This is particularly useful for applications that require strict data validation.

### Scalability:

Modern SQL databases (e.g., PostgreSQL, MySQL) are highly scalable and support advanced features like indexing, transactions, and stored procedures.

## Tooling and Ecosystem:

SQL databases have a rich ecosystem of tools and libraries for querying, analyzing, and managing data. This makes it easier for developers to work with the generated schemas.

### Compatibility with ORMs:

SQL schemas are compatible with Object-Relational Mapping (ORM) tools like SQLAlchemy, which simplifies database interactions in the application.


## Documentation & Testing
### Design Decisions & Technology Choices
Frontend: Vite + React + TypeScript + TailwindCSS
Vite: Chosen for its fast development server and optimized build process.

React: Used for building a dynamic and responsive user interface.

TypeScript: Ensures type safety and improves code maintainability.

TailwindCSS: Provides utility-first CSS for rapid UI development and customization.

Backend: FastAPI + PostgreSQL
FastAPI: Selected for its high performance, automatic API documentation (Swagger/Redoc), and support for asynchronous programming.

PostgreSQL: Chosen as the relational database for its robustness, scalability, and support for advanced SQL features.

### Authentication & Security
JWT (JSON Web Tokens): Used for secure user authentication and authorization.

Password Hashing: Passwords are hashed using bcrypt for secure storage.

### Schema Generation
OpenAI GPT-4: Used to generate SQL-compatible schemas dynamically based on user input.

Error Handling: Robust error handling ensures a smooth user experience and prevents data corruption.


How It Works
Backend:

The backend provides APIs for:

User authentication (signup, login, email verification).

Database schema generation using OpenAI.

Managing projects, tasks, and team members.

It uses FastAPI for building APIs, SQLAlchemy for database interactions, and JWT for authentication.

Frontend:

The frontend provides a user interface for:

Registering and logging in.

Generating and managing database schemas.

Viewing and editing projects, tasks, and team members.

It uses React for building the UI and Axios for API calls.

Next Steps
Deploy the Backend:

Host the backend on a platform like Render, Heroku, or AWS.

Update the REACT_APP_API_URL in the frontend .env file to point to the deployed backend.

Deploy the Frontend:

Host the frontend on a platform like Vercel, Netlify, or GitHub Pages.

Testing:

Write unit and integration tests for both the backend and frontend.

Documentation:

Add detailed API documentation using Swagger or Redoc for the backend.

This `README.md` provides a clear and structured guide for setting up and using the `dbscst` project. Let me know if you need further assistance! 🚀