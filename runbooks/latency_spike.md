# Runbook: Latency Spike

**Scenario id:** `latency_spike`
**Affected services:** api

## Symptoms
- p95 latency above SLO (>500ms)
- Slow page loads in dashboard
- Upstream timeouts

## How to detect
- Grafana panel "p95 latency"
- `firedrill_http_request_duration_seconds_bucket` histogram
- Compare against baseline window

## Immediate mitigation
1. Open `/scenarios`, disable **Latency Spike**.
2. In a real incident: scale API replicas, shed load, enable cache.

## Long-term fix
- Add caching for hot endpoints.
- Profile with flamegraph.
- Tune connection pool sizes.

## Useful commands
```bash
curl -s http://localhost:4000/metrics | grep http_request_duration
docker compose logs api --tail=200
```
