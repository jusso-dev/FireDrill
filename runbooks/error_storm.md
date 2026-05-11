# Runbook: Error Storm

**Scenario id:** `error_storm`
**Affected services:** api

## Symptoms
- 5xx rate above 5%
- Error log flood
- User-facing failures

## How to detect
- Grafana "Error rate" panel
- `firedrill_http_requests_total{status=~"5.."}`
- Tail `docker compose logs api | grep -i error`

## Immediate mitigation
1. Disable **Error Storm** in `/scenarios`.
2. Roll back recent deploy if real.
3. Engage circuit breaker / fallback path.

## Long-term fix
- Better input validation
- Chaos test in CI
- Add error budget burn-down alerting

## Useful commands
```bash
curl -s http://localhost:4000/metrics | grep http_requests_total
```
