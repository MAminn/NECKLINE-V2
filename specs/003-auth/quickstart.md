# Quickstart: Auth & Accounts

**Prerequisites**: API running on `localhost:4000`, Web running on `localhost:3000`, MongoDB connected.

## 1. Register a new account

```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass1"
  }'
```

Expected: `201` with user object. Cookies saved to `cookies.txt`.

## 2. Check current user

```bash
curl http://localhost:4000/api/v1/auth/me \
  -b cookies.txt
```

Expected: `200` with user object including `id`, `name`, `email`, `role`.

## 3. Add item to cart as authenticated user

```bash
curl -X POST http://localhost:4000/api/v1/cart/items \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "quantity": 2
  }'
```

## 4. Log out

```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -b cookies.txt
```

Expected: `200`. Cookies cleared.

## 5. Log back in (verify cart persistence)

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass1"
  }'
```

Then check cart:
```bash
curl http://localhost:4000/api/v1/cart \
  -b cookies.txt
```

Expected: Cart still contains the items from step 3.

## 6. Test cart merge (guest → authenticated)

```bash
# Clear cookies to simulate new guest
curl -X POST http://localhost:4000/api/v1/cart/items \
  -H "Content-Type: application/json" \
  -c guest_cookies.txt \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "quantity": 1
  }'

# Log in — cart merges automatically
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -b guest_cookies.txt \
  -c guest_cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass1"
  }'

# Check cart — should have combined quantities
curl http://localhost:4000/api/v1/cart \
  -b guest_cookies.txt
```

## 7. Test password reset (development)

```bash
# Request reset
curl -X POST http://localhost:4000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Get token from API console logs or debug endpoint
curl http://localhost:4000/api/v1/auth/debug/reset-tokens

# Reset password
curl -X POST http://localhost:4000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_FROM_DEBUG",
    "newPassword": "NewSecurePass2"
  }'
```

## 8. Verify rate limiting

Rapidly hit login with wrong password:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

Expected: After ~5 attempts, `429 Too Many Requests`.
