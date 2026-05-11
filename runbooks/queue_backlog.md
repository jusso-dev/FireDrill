# Runbook: Queue Backlog

**Scenario id:** `queue_backlog`
**Affected services:** worker, redis

## Symptoms
- Queue depth growing unbounded
- Job latency rising
- Worker CPU pinned

## How to detect
- `firedrill_queue_depth`
- BullMQ "waiting" count
- Grafana "Queue depth" panel

## Immediate mitigation
1. Disable **Queue Backlog** in `/scenarios`.
2. Scale workers horizontally.
3. Pause non-essential producers.

## Long-term fix
- Autoscale on queue depth.
- Partition queues by priority.
- Tune job concurrency.

## Useful commands
```bash
docker compose exec redis redis-cli LLEN bull:emails:wait
```
