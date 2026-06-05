# Admin Promo Code API

All endpoints require authentication and `admin:access` permission (`requirePermission('admin:access')`).

---

## GET /api/v1/admin/promo-codes

List all promo codes with pagination.

**Query parameters**:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `active` (optional filter: true/false)
- `type` (optional filter: percentage/fixed/free_shipping)
- `isAutomatic` (optional filter: true/false)

**Response (200)**:

```json
{
  "promoCodes": [
    {
      "id": "...",
      "code": "SUMMER25",
      "type": "percentage",
      "value": 25,
      "minOrderAmount": 0,
      "maxDiscountAmount": null,
      "usageLimit": 100,
      "usageCount": 47,
      "startDate": "2026-06-01T00:00:00.000Z",
      "endDate": "2026-06-30T23:59:59.000Z",
      "active": true,
      "isAutomatic": false,
      "description": "Summer sale 2026",
      "createdAt": "2026-05-20T10:00:00.000Z",
      "updatedAt": "2026-05-25T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## POST /api/v1/admin/promo-codes

Create a new promo code or automatic offer.

**Request body**:

```json
{
  "code": "SUMMER25",
  "type": "percentage",
  "value": 25,
  "minOrderAmount": 0,
  "maxDiscountAmount": null,
  "usageLimit": 100,
  "startDate": "2026-06-01T00:00:00.000Z",
  "endDate": "2026-06-30T23:59:59.000Z",
  "active": true,
  "isAutomatic": false,
  "description": "Summer sale 2026"
}
```

Validation rules:
- `code` is required unless `isAutomatic: true`
- `code` must be unique (case-insensitive)
- `type` must be one of `percentage`, `fixed`, `free_shipping`
- `value` is required except when `type: 'free_shipping'`
- `value` must be 0–100 when `type: 'percentage'`
- `endDate` must be after `startDate` if both provided

**Response (201)**:

```json
{
  "id": "...",
  "code": "SUMMER25",
  "type": "percentage",
  "value": 25,
  ...
}
```

---

## GET /api/v1/admin/promo-codes/:id

Get a single promo code by ID.

**Response (200)**: Same shape as list item above.

---

## PATCH /api/v1/admin/promo-codes/:id

Update a promo code. Partial updates supported.

**Request body**: Any subset of create fields.

**Restrictions**:
- `usageCount` cannot be modified via this endpoint
- `code` cannot be changed if the code has already been used in orders (to prevent historical confusion)

**Response (200)**: Updated promo code object.

---

## DELETE /api/v1/admin/promo-codes/:id

Soft-delete a promo code by setting `active: false`.

**Response (204)**: No content.

**Note**: Hard deletion is prohibited to preserve historical reference integrity. To "delete" a code, deactivate it.
