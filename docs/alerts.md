# Alert Thresholds

**Status**: Stub — thresholds defined here will be wired to monitoring in Phase 7.

## API Latency

| Metric | Warning | Critical |
|--------|---------|----------|
| p95 response time | > 200ms | > 500ms |
| p99 response time | > 500ms | > 1000ms |

## Error Rates

| Metric | Warning | Critical |
|--------|---------|----------|
| 5xx rate | > 0.1% | > 1% |
| 4xx rate (auth) | > 5% | > 10% |

## Business Metrics

| Metric | Warning | Critical |
|--------|---------|----------|
| Checkout failure rate | > 2% | > 5% |
| Payment webhook failures | > 1% | > 3% |
| Stock inconsistency events | > 0 | Any (Severity-1) |

## Infrastructure

| Metric | Warning | Critical |
|--------|---------|----------|
| DB connection pool usage | > 70% | > 90% |
| Memory usage | > 70% | > 90% |
| Disk usage | > 70% | > 85% |

## On-Call

- Phase 7 will configure PagerDuty/Opsgenie escalation.
- Severity-1 incidents require immediate escalation (§XIX).
