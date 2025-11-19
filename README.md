# Sprint User Management

A Node.js backend API for managing users in a sprint-based system. This application uses Express.js for the server, SQLite for data storage, and includes features for creating, retrieving, updating, and deleting users under assigned managers.

## Features

- User management with CRUD operations
- Manager assignment and validation
- Mobile number and PAN number validation
- SQLite database for persistent storage
- RESTful API endpoints
- CORS support for cross-origin requests

## Installation

1. Ensure you have Node.js installed (version 14 or higher).
2. Clone or download the project to your local machine.
3. Navigate to the project root directory.
4. Install dependencies:

   ```
   npm install
   ```

## Usage

### Development Server

To start the server in development mode with auto-restart:

```
npm run server
```

### Production Server

To start the server in production mode:

```
npm start
```

The server will run on `http://localhost:3000`.

## API Endpoints

### GET /

Returns the server status.

- **Method:** GET
- **URL:** `http://localhost:3000/`
- **Response:**
  ```json
  {
    "status": "ok",
    "message": "Server is running fine",
    "time": "2023-10-01T12:00:00.000Z"
  }
  ```

### POST /create_user

Creates a new user.

- **Method:** POST
- **URL:** `http://localhost:3000/create_user`
- **Request Body:**
  ```json
  {
    "full_name": "John Doe",
    "mob_num": "9876543210",
    "pan_num": "ABCDE1234F",
    "manager_id": "uuid-of-manager"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User created successfully",
    "user_id": "generated-uuid"
  }
  ```

### POST /get_users

Retrieves users based on filters.

- **Method:** POST
- **URL:** `http://localhost:3000/get_users`
- **Request Body (optional filters):**
  ```json
  {
    "user_id": "uuid",
    "mob_num": "9876543210",
    "manager_id": "uuid"
  }
  ```
- **Response:**
  ```json
  {
    "users": [
      {
        "user_id": "uuid",
        "full_name": "John Doe",
        "mob_num": "9876543210",
        "pan_num": "ABCDE1234F",
        "manager_id": "uuid",
        "created_at": "2023-10-01T12:00:00.000Z",
        "updated_at": "2023-10-01T12:00:00.000Z",
        "is_active": 1
      }
    ]
  }
  ```

### POST /update_user

Updates existing users.

- **Method:** POST
- **URL:** `http://localhost:3000/update_user`
- **Request Body:**
  ```json
  {
    "user_ids": ["uuid1", "uuid2"],
    "update_data": {
      "full_name": "Updated Name",
      "mob_num": "9876543210",
      "pan_num": "ABCDE1234F",
      "manager_id": "new-manager-uuid"
    }
  }
  ```
- **Response:**
  ```json
  {
    "message": "Update completed"
  }
  ```

### POST /delete_user

Deletes a user.

- **Method:** POST
- **URL:** `http://localhost:3000/delete_user`
- **Request Body:**
  ```json
  {
    "user_id": "uuid",
    "mob_num": "9876543210"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User deleted successfully"
  }
  ```

## Database Schema

### Managers Table

- `manager_id` (TEXT, PRIMARY KEY): Unique identifier for the manager.
- `is_active` (INTEGER): 1 if active, 0 if inactive.

### Users Table

- `user_id` (TEXT, PRIMARY KEY): Unique identifier for the user.
- `full_name` (TEXT): Full name of the user.
- `mob_num` (TEXT): Mobile number (10 digits, cleaned).
- `pan_num` (TEXT): PAN number (uppercase, validated format).
- `manager_id` (TEXT): Associated manager ID.
- `created_at` (TEXT): Creation timestamp.
- `updated_at` (TEXT): Last update timestamp.
- `is_active` (INTEGER): 1 if active, 0 if inactive.

## Validation

- **Mobile Number:** Must be 10 digits, removes leading +91 or 0.
- **PAN Number:** Must match the format AAAAA9999A (5 letters, 4 digits, 1 letter).
- **Manager:** Must be active to assign users.

## Dependencies

- express: Web framework
- better-sqlite3: SQLite database driver
- cors: Cross-origin resource sharing
- uuid: Unique identifier generation
- nodemon: Development auto-restart (dev dependency)

## Author

Venkateswara Reddy Challa

## License

ISC
