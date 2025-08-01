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

### Register Farming Reward

```
POST /api/game/farming-reward
```

Register farming rewards for internal currency.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
	"offerData": [
		{
			"resource": "stardust",
			"amount": 100
		},
		{
			"resource": "darkMatter",
			"amount": 50
		}
	]
}
```

**Response:**

```json
{
	"success": true,
	"message": "Farming rewards registered successfully",
	"data": {
		"rewards": [
			{
				"resource": "stardust",
				"amount": 100
			},
			{
				"resource": "darkMatter",
				"amount": 50
			}
		]
	}
}
```

### Create Galaxy with Offer

```
POST /api/game/galaxy-with-offer
```

Create a galaxy with an offer.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
	"galaxyData": {
		"seed": "galaxy_seed_123",
		"name": "My Galaxy",
		"description": "A beautiful galaxy"
	},
	"offer": {
		"buyerId": 123,
		"price": 1000,
		"currency": "tonToken"
	}
}
```

**Response:**

```json
{
	"success": true,
	"data": {
		"galaxy": {
			"id": 1,
			"seed": "galaxy_seed_123",
			"name": "My Galaxy"
		},
		"offer": {
			"id": 1,
			"price": 1000,
			"currency": "tonToken"
		}
	}
}
```

### Create Galaxy for Sale

```
POST /api/game/galaxy-for-sale
```

Create a galaxy for sale.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
	"galaxyData": {
		"seed": "galaxy_seed_456",
		"name": "Galaxy for Sale",
		"description": "A galaxy available for purchase"
	},
	"offer": {
		"buyerId": 123,
		"price": 2000,
		"currency": "tonToken"
	}
}
```

**Response:**

```json
{
	"success": true,
	"data": {
		"galaxy": {
			"id": 2,
			"seed": "galaxy_seed_456",
			"name": "Galaxy for Sale"
		},
		"offer": {
			"id": 2,
			"price": 2000,
			"currency": "tonToken"
		}
	}
}
```

### Register Transfer Stardust to Galaxy

```
POST /api/game/register-transfer-stardust-to-galaxy
```

Register transfer of stardust to galaxy - create offer for galaxy purchase.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
	"userId": 123,
	"galaxy": {
		"seed": "galaxy_seed_789"
	},
	"reward": {
		"currency": "tonToken",
		"price": 500,
		"resource": "stardust",
		"amount": 100
	}
}
```

**Response:**

```json
{
	"success": true,
	"message": "Galaxy purchase offer registered successfully",
	"data": {
		"offer": {
			"id": 3,
			"price": 500,
			"currency": "tonToken"
		},
		"galaxy": {
			"id": 3,
			"seed": "galaxy_seed_789"
		}
	}
}
```

### Claim Daily Reward

```
POST /api/game/daily-reward
```

Claim daily reward for the user. Rewards are based on consecutive days (streak):

-   Days 3, 5, 7: Only darkmatter is awarded
-   Other days: Both stardust and darkmatter are awarded
-   Amounts increase with streak length

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{}
```

**Response:**

```json
{
	"success": true,
	"message": "Daily reward claimed successfully",
	"data": {
		"currentStreak": 3,
		"maxStreak": 5,
		"rewards": [
			{
				"resource": "darkMatter",
				"amount": 150,
				"transactionId": 123
			}
		],
		"userState": {
			"stardust": 1000,
			"darkMatter": 250,
			"stars": 50
		}
	}
}
```

**Error Response (if already claimed today):**

```json
{
	"success": false,
	"message": "Daily reward already claimed today",
	"errorCode": "GAM_001"
}
```

## Task Template API

### Get All Task Templates

```
GET /api/task-templates
```

Get all task templates with JSONB fields formatted for web forms.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
[
	{
		"id": 23,
		"slug": "daily_login_stardust",
		"title": {
			"en": "Daily login reward",
			"ru": "Ежедневный логин"
		},
		"description": {
			"en": "Login daily to receive rewards",
			"ru": "Входите ежедневно для получения наград"
		},
		"reward": {
			"type": "stardust",
			"amount": 2500,
			"multiplier": 1.25
		},
		"condition": {
			"type": "daily_login_stardust",
			"days": [1, 2, 3, 4, 5, 6, 7],
			"amount": 0,
			"operator": ">=",
			"resource": "",
			"resetTime": "00:00"
		},
		"icon": "📆",
		"active": true,
		"sortOrder": 20,
		"createdAt": "2025-08-01T10:00:00.000Z",
		"updatedAt": "2025-08-01T10:00:00.000Z"
	}
]
```

### Get Task Template by Slug

```
GET /api/task-templates/:slug
```

Get a specific task template by slug.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
	"id": 23,
	"slug": "daily_login_stardust",
	"title": {
		"en": "Daily login reward",
		"ru": "Ежедневный логин"
	},
	"description": {
		"en": "Login daily to receive rewards",
		"ru": "Входите ежедневно для получения наград"
	},
	"reward": {
		"type": "stardust",
		"amount": 2500,
		"multiplier": 1.25
	},
	"condition": {
		"type": "daily_login_stardust",
		"days": [1, 2, 3, 4, 5, 6, 7],
		"amount": 0,
		"operator": ">=",
		"resource": "",
		"resetTime": "00:00"
	},
	"icon": "📆",
	"active": true,
	"sortOrder": 20,
	"createdAt": "2025-08-01T10:00:00.000Z",
	"updatedAt": "2025-08-01T10:00:00.000Z"
}
```

### Update Task Template

```
PUT /api/task-templates
```

Update a task template. JSONB fields should be sent as structured objects.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
	"id": 23,
	"slug": "daily_login_stardust",
	"title": {
		"en": "Daily login reward",
		"ru": "Ежедневный логин"
	},
	"description": {
		"en": "Login daily to receive rewards",
		"ru": "Входите ежедневно для получения наград"
	},
	"reward": {
		"type": "stardust",
		"amount": 2500,
		"multiplier": 1.25
	},
	"condition": {
		"type": "daily_login_stardust",
		"days": [1, 2, 3, 4, 5, 6, 7],
		"amount": 0,
		"operator": ">=",
		"resource": "",
		"resetTime": "00:00"
	},
	"icon": "📆",
	"active": true,
	"sortOrder": 20
}
```

**Response:**

```json
{
	"id": 23,
	"slug": "daily_login_stardust",
	"title": {
		"en": "Daily login reward",
		"ru": "Ежедневный логин"
	},
	"description": {
		"en": "Login daily to receive rewards",
		"ru": "Входите ежедневно для получения наград"
	},
	"reward": {
		"type": "stardust",
		"amount": 2500,
		"multiplier": 1.25
	},
	"condition": {
		"type": "daily_login_stardust",
		"days": [1, 2, 3, 4, 5, 6, 7],
		"amount": 0,
		"operator": ">=",
		"resource": "",
		"resetTime": "00:00"
	},
	"icon": "📆",
	"active": true,
	"sortOrder": 20,
	"createdAt": "2025-08-01T10:00:00.000Z",
	"updatedAt": "2025-08-01T10:00:00.000Z"
}
```

**Error Response (validation errors):**

```json
{
	"success": false,
	"message": "Validation errors",
	"errors": {
		"title": "Title must contain both \"en\" and \"ru\" fields",
		"reward": "Reward must contain \"type\" and \"amount\" fields"
	}
}
```

### Create Task Templates

```
POST /api/task-templates
```

Create new task templates. JSONB fields should be sent as structured objects.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
[
	{
		"slug": "new_task",
		"title": {
			"en": "New Task",
			"ru": "Новая задача"
		},
		"description": {
			"en": "Complete this task",
			"ru": "Выполните эту задачу"
		},
		"reward": {
			"type": "stardust",
			"amount": 1000,
			"multiplier": 1.0
		},
		"condition": {
			"type": "resource_threshold",
			"amount": 100,
			"operator": ">=",
			"resource": "stars",
			"days": [],
			"resetTime": "00:00"
		},
		"icon": "⭐",
		"active": true,
		"sortOrder": 25
	}
]
```

### Toggle Task Template Status

```
PATCH /api/task-templates/:slug/toggle
```

Toggle the active status of a task template.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
	"success": true,
	"message": "Task template status toggled successfully",
	"data": {
		"slug": "daily_login_stardust",
		"active": false
	}
}
```

### Delete Task Template

```
DELETE /api/task-templates/:slug
```

Delete a task template.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
	"success": true,
	"message": "Task template deleted successfully",
	"data": {
		"slug": "daily_login_stardust"
	}
}
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
