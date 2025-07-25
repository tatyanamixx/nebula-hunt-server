# Nebulahunt Server API Documentation

## Overview

Nebulahunt Server provides a RESTful API for the Nebulahunt game. The API supports both user authentication through Telegram WebApp and admin authentication with Google 2FA.

## Authentication

### User Authentication (Telegram WebApp)

Users authenticate through Telegram WebApp initData, which is validated on the server side.

### Admin Authentication (Google 2FA)

Administrators and supervisors use email + Google 2FA for authentication.

## Base URL

```
http://localhost:5000
```

## Health Check

### Get Server Health

```
GET /health
```

Returns server health status.

## Admin API

### Admin Login

```
POST /admin/login
```

Login with email (first step of 2FA authentication).

**Request Body:**

```json
{
	"email": "admin@example.com"
}
```

**Response:**

```json
{
	"message": "Admin login successful",
	"email": "admin@example.com",
	"id": 123,
	"role": "ADMIN",
	"accessToken": "jwt_token",
	"refreshToken": "refresh_token"
}
```

### Admin 2FA Verification

```
POST /admin/2fa/verify
```

Verify Google 2FA code (second step of authentication).

**Request Body:**

```json
{
	"email": "admin@example.com",
	"otp": "123456"
}
```

**Response:**

```json
{
	"message": "2FA verification successful",
	"email": "admin@example.com",
	"id": 123,
	"role": "ADMIN",
	"accessToken": "jwt_token",
	"refreshToken": "refresh_token"
}
```

### Initialize Admin

```
POST /admin/init
```

Initialize a new admin account with Google 2FA.

**Request Body:**

```json
{
	"email": "newadmin@example.com",
	"secretKey": "your_admin_init_secret"
}
```

**Response:**

```json
{
	"message": "Admin initialized",
	"email": "newadmin@example.com",
	"id": 124,
	"google2faSecret": "JBSWY3DPEHPK3PXP",
	"otpAuthUrl": "otpauth://totp/Nebulahunt%20Admin%20(newadmin@example.com)?secret=JBSWY3DPEHPK3PXP&issuer=Nebulahunt"
}
```

### Initialize Supervisor

```
POST /admin/supervisor/init
```

Initialize supervisor account using email from environment variable.

**Response:**

```json
{
	"message": "Supervisor initialized",
	"email": "supervisor@nebulahunt.com",
	"id": 125,
	"google2faSecret": "JBSWY3DPEHPK3PXP",
	"otpAuthUrl": "otpauth://totp/Nebulahunt%20Supervisor%20(supervisor@nebulahunt.com)?secret=JBSWY3DPEHPK3PXP&issuer=Nebulahunt"
}
```

### Admin Logout

```
POST /admin/logout
```

Logout admin and invalidate tokens.

**Request Body:**

```json
{
	"refreshToken": "refresh_token"
}
```

**Response:**

```json
{
	"message": "Admin logged out successfully"
}
```

## User API

### User Registration

```
POST /auth/registration
```

Register a new user through Telegram WebApp.

**Headers:**

```
Authorization: Bearer <telegram_init_data>
```

**Request Body:**

```json
{
	"referral": "123456789",
	"galaxy": {
		"name": "My Galaxy",
		"description": "A beautiful galaxy"
	}
}
```

### User Login

```
POST /auth/login
```

Login user through Telegram WebApp.

**Headers:**

```
Authorization: Bearer <telegram_init_data>
```

### User Logout

```
POST /auth/logout
```

Logout user and invalidate tokens.

### Refresh Token

```
GET /auth/refresh
```

Refresh access token using refresh token from cookies.

## Game API

### Get User State

```
GET /user-state
```

Get current user state and game data.

**Headers:**

```
Authorization: Bearer <access_token>
```

### Get Galaxies

```
GET /galaxies
```

Get user's galaxies.

**Headers:**

```
Authorization: Bearer <access_token>
```

### Get Tasks

```
GET /tasks
```

Get user's tasks.

**Headers:**

```
Authorization: Bearer <access_token>
```

### Complete Task

```
POST /tasks/:slug/complete
```

Complete a specific task.

**Headers:**

```
Authorization: Bearer <access_token>
```

## Error Responses

All endpoints return errors in the following format:

```json
{
	"error": {
		"message": "Error description",
		"status": 400,
		"code": "ERROR_CODE"
	}
}
```

## Rate Limiting

-   User endpoints: 60 requests per minute
-   Admin endpoints: 10 requests per minute
-   Supervisor initialization: 1 request per hour

## Security

-   All admin endpoints require Google 2FA
-   User endpoints use Telegram WebApp authentication
-   JWT tokens are used for session management
-   Rate limiting is applied to prevent abuse

```

```
