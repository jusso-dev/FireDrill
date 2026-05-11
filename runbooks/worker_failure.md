# Runbook: Worker Failure

**Scenario id:** `worker_failure`
**Affected services:** worker

## Symptoms
- Failed-job counter climbing
- Retries exhausted, DLQ growing

## How to detect
- `firedrill_jobs_failed_total`
- BullMQ "failed" job count
- Worker logs

## Immediate mitigation
1. Disable **Worker Failure** in `/scenarios`.
2. Redrive failed jobs from DLQ.
3. Roll back recent worker deploy.

## Long-term fix
- Add poison-pill detection.
- Improve idempotency.
- Add SLO on job success rate.

## Useful commands
```bash
docker compose logs worker --tail=200
```
