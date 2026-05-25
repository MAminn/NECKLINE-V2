# NECKLINE — Privacy Registry

**Jurisdiction**: Egypt + GCC markets  
**Last Updated**: 2026-05-25  
**Status**: Phase 0 template — populate as features ship.

## Purpose

This document records all Personally Identifiable Information (PII) collected by NECKLINE per Constitution §9.1. New PII fields require documentation and a `/clarify` gate review.

## PII Registry

| Field | Purpose | Legal Basis | Retention Period |
|-------|---------|-------------|-----------------|
| email | Order communication, account login | Contract / Consent | 7 years (tax records) |
| phone | Shipping coordination | Contract | 7 years |
| fullName | Order fulfillment, delivery | Contract | 7 years |
| shippingAddress | Product delivery | Contract | 7 years |
| ipAddress | Fraud prevention, abuse detection | Legitimate Interest | 90 days |
| userAgent | Security auditing | Legitimate Interest | 90 days |
| cookieId | Session management | Consent (essential) | Session + 30 days |

## User Rights (§9.2)

Before public launch, the system must support:

- **Data Export**: Provide a machine-readable export of user data.
- **Account Deletion**: Honor deletion requests within 30 days, respecting legal retention rules.
- **Rectification**: Allow users to correct inaccurate data.

All deletion workflows must be audit-logged (§8.3).

## Cookies & Consent (§9.3)

| Cookie | Type | Purpose | Duration |
|--------|------|---------|----------|
| session | Essential | Authentication | Session |
| refresh | Essential | Token rotation | 7 days |
| consent | Essential | Consent preferences | 1 year |
| _analytics | Non-essential | Usage analytics | 90 days |

Non-essential cookies require explicit consent before activation.

## Contact

Privacy inquiries: privacy@neckline.com
