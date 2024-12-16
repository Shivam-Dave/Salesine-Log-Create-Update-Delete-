# Salesine-Log Create,Update,Delete 
 
An authentication system integrated with task management features, built using **Node.js**, **Express**, **PostgreSQL**, and **JWT** for secure user authentication. The frontend is implemented using vanilla HTML, CSS, and JavaScript for simplicity.

## Features

- **User Authentication**
  - Register with username, email, and password.
  - Login with email and password.
  - Secure token-based authentication using **JWT**.
  - Logout functionality to invalidate active sessions.

- **Task Management**
  - Create tasks with timestamps and user tracking.
  - List all tasks that are not deleted.
  - Update tasks with proper user tracking.
  - Delete tasks (soft delete) with user tracking.

- **Security**
  - Passwords are hashed using **bcrypt** before storage.
  - Tokens are verified against the database for validity and expiration.

## Project Structure

```plaintext
├── middleware/
│   └── auth.js         # Middleware for token authentication
├── backend/
│   ├── db.js           # Database connection using PostgreSQL
│   └── server.js       # Main server file
├── public/
│   ├── index.html      # Login and Registration page
│   ├── dashboard.html  # User dashboard for task management
│   ├── styles.css      # Basic styling
│   └── script.js       # Client-side logic
├── .env                # Environment variables
├── README.md           # Project documentation
└── package.json        # Project dependencies and scripts
```

**Prerequisites**
Before starting, ensure you have the following installed:

 - Node.js (v14 or higher)
 - PostgreSQL (v12 or higher)

**Setup Instructions**

1. Clone the repository:
```
bashCopygit clone https://github.com/your-username/auth-task-management.git
cd auth-task-management
```

2. Install dependencies:
```
bashCopynpm install
```

3. Set up the database:

Create a PostgreSQL database named auth_system.
Run the following SQL scripts to create the necessary tables:
```
sqlCopyCREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  task_id SERIAL PRIMARY KEY,
  task TEXT NOT NULL,
  created_by VARCHAR(50) NOT NULL,
  updated_by VARCHAR(50),
  deleted_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE user_tokens (
  token_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_valid BOOLEAN DEFAULT TRUE
);
```


4. Configure the environment variables:

Create a .env file in the root directory with the following content:
```
envCopyJWT_SECRET=your_jwt_secret_key_here
TOKEN_EXPIRY=24h
PG_USER=your_postgres_username
PG_PASSWORD=your_postgres_password
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=auth_system
```


5. Start the server:
```
bashCopynpm start
```

6. Open the application in your browser:
```
Login/Register: http://localhost:5000/public/index.html
Dashboard: http://localhost:5000/public/dashboard.html
```


**API Endpoints**
- **Authentication**

POST /api/register: Register a new user.
POST /api/login: Log in and receive a token.
POST /api/logout: Log out by invalidating the token.

- **Task Management**

POST /api/task/create: Create a new task.
GET /api/task/list: Get a list of all tasks.
PUT /api/task/update: Update a task.
DELETE /api/task/delete: Soft delete a task.


- **Frontend Pages**

Login and Registration: Handles user authentication.
Dashboard: Allows task management (Create, Update, Delete).

- **Technologies Used**

Backend: Node.js, Express.js, PostgreSQL
Frontend: HTML, CSS, JavaScript
Authentication: JWT, bcrypt

- **Future Enhancements**

Role-based access control for administrative tasks.
Integration with third-party services (e.g., email verification).
Enhanced frontend design using modern frameworks like React or Vue.js.

- **License**
This project is licensed under the MIT License.
Contributions
Contributions are welcome! Feel free to fork the repository and submit pull requests.
