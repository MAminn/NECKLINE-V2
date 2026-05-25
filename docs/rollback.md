# Deployment Rollback Runbook

## Frontend (Vercel)

1. Open the Vercel dashboard.
2. Navigate to the project → Deployments.
3. Find the last known good deployment.
4. Click the menu (⋯) → **Promote to Production**.
5. Rollback is immediate (< 1 minute).

## Backend (Render)

1. Open the Render dashboard.
2. Navigate to the `neckline-api` service.
3. Go to the **Events** tab.
4. Find the last known good deploy.
5. Click **Manual Deploy** → **Deploy latest commit** or select a specific commit.
6. Alternatively, use the Render CLI: `render deploys rollback <service-id>`.

## Database

- MongoDB Atlas point-in-time restore is available via the Atlas console.
- Restore target: < 30 minutes RPO.
- Tested restore procedure: Phase 7 Launch Hardening.

## Emergency Contacts

- On-call engineer: [TODO: configure PagerDuty/Opsgenie in Phase 7]
