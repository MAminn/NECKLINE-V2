# API Contract: Authentication

**Base Path**: `/api/v1/auth`
**Authentication**: Cookies (`access_token`, `refresh_token`) — httpOnly, secure, sameSite strict

---

## POST /api/v1/auth/register

Register a new account and sign in.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass1"
}
```

**Validation**:
- `name`: required, string, trimmed, max 100 chars
- `email`: required, valid email format, max 255 chars
- `password`: required, min 8 chars, at least 1 uppercase, 1 lowercase, 1 number

**Success 201**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```
- Sets `access_token` cookie (15 min)
- Sets `refresh_token` cookie (7 days)
- Merges guest cart if present

**Error 400**: Validation failure (password too weak, invalid email)
**Error 409**: Generic "Registration failed" (email already exists — enumeration prevention)
**Error 429**: Rate limit exceeded

---

## POST /api/v1/auth/login

Authenticate with email and password.

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass1"
}
```

**Success 200**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```
- Sets `access_token` cookie (15 min)
- Sets `refresh_token` cookie (7 days)
- Merges guest cart if present

**Error 401**: Generic "Invalid credentials" (enumeration prevention)
**Error 429**: Rate limit exceeded

---

## POST /api/v1/auth/logout

Revoke the current session.

**Auth Required**: Yes (valid access token)

**Success 200**:
```json
{
  "success": true
}
```
- Revokes the refresh token used for this session
- Clears `access_token` and `refresh_token` cookies
- Other sessions for this user remain active

**Error 401**: No valid token

---

## POST /api/v1/auth/refresh

Exchange a valid refresh token for a new access token (and new refresh token).

**Auth Required**: Refresh token cookie

**Success 200**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```
- Sets new `access_token` cookie
- Sets new `refresh_token` cookie (rotates — old refresh token revoked)

**Error 401**: Invalid, expired, or revoked refresh token

---

## GET /api/v1/auth/me

Get current authenticated user.

**Auth Required**: Yes (valid access token)

**Success 200**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "emailVerified": false
    }
  }
}
```

**Error 401**: No valid token

---

## PATCH /api/v1/auth/me

Update current user's profile (name and/or password).

**Auth Required**: Yes (valid access token)

**Request Body**:
```json
{
  "name": "John Updated"
}
```
or
```json
{
  "currentPassword": "SecurePass1",
  "newPassword": "NewSecurePass2"
}
```

**Validation**:
- `name`: optional, string, trimmed, max 100
- `currentPassword`: required if `newPassword` provided
- `newPassword`: required if `currentPassword` provided, must meet password policy

**Success 200**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "John Updated",
      "email": "john@example.com",
      "role": "customer"
    }
  }
}
```
- If password changed: all refresh tokens for this user are revoked ("log out everywhere")

**Error 400**: Validation failure
**Error 401**: Current password incorrect (when changing password)

---

## POST /api/v1/auth/forgot-password

Request a password reset token.

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Success 200** (even if email does not exist — enumeration prevention):
```json
{
  "success": true,
  "message": "If an account exists, a reset link has been sent."
}
```
- In development: token logged to console and available at debug endpoint

**Error 429**: Rate limit exceeded

---

## POST /api/v1/auth/reset-password

Confirm password reset with token.

**Request Body**:
```json
{
  "token": "raw-token-from-email-or-debug",
  "newPassword": "NewSecurePass2"
}
```

**Validation**:
- `token`: required, string
- `newPassword`: required, must meet password policy

**Success 200**:
```json
{
  "success": true,
  "message": "Password updated successfully."
}
```
- All refresh tokens for this user are revoked

**Error 400**: Invalid or expired token
**Error 429**: Rate limit exceeded
