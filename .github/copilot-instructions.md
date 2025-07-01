<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# WattMate Backend API - Copilot Instructions

This is a Node.js Express backend API for WattMate - Smart Electricity Monitoring System.

## Project Context

- **Technology Stack**: Node.js, Express.js, MySQL, JWT Authentication
- **Architecture**: RESTful API with middleware-based authentication
- **Database**: MySQL with connection pooling using mysql2
- **Authentication**: JWT tokens with refresh token mechanism
- **Validation**: Joi schema validation for all inputs
- **Security**: bcryptjs for password hashing, rate limiting, CORS, Helmet

## Code Style & Conventions

- Use ES6+ features and async/await
- Follow REST API conventions for endpoints
- Use descriptive variable and function names in Indonesian for user-facing messages
- Error messages should be in Indonesian
- Always include proper error handling and logging
- Use middleware for common functionality (auth, validation, rate limiting)

## File Structure

- Controllers handle business logic and return JSON responses
- Models handle database operations and data validation
- Middleware handles authentication, validation, and rate limiting
- Routes define API endpoints and apply appropriate middleware

## Database

- Use prepared statements for all SQL queries
- Handle database connection errors gracefully
- Use transactions for operations that modify multiple tables
- Follow the existing schema patterns for new tables

## Authentication

- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Always validate tokens and return appropriate error messages
- Use rate limiting for auth endpoints to prevent brute force attacks

## Response Format

Always use this consistent response format:

```javascript
// Success response
{
  "success": true,
  "message": "Success message in Indonesian",
  "data": { /* response data */ }
}

// Error response
{
  "success": false,
  "message": "Error message in Indonesian",
  "errors": "Optional detailed errors"
}
```

## Environment Variables

All sensitive configuration should use environment variables with sensible defaults.

## Testing

When adding new features, consider adding appropriate tests using the Jest framework.
