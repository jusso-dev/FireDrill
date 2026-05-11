# Runbook: Database Slowdown

**Scenario id:** `db_slowdown`
**Affected services:** api, postgres

## Symptoms
- DB query times rising
- `/health` reports degraded
- Data endpoints slow

## How to detect
- `firedrill_db_query_duration_seconds`
- `firedrill_database_healthy` gauge
- `pg_stat_activity`

## Immediate mitigation
1. Disable **Database Slowdown** in `/scenarios`.
2. Kill long-running queries.
3. Route reads to replica.

## Long-term fix
- Add proper indexes.
- Query budgets + statement timeout.
- Tune connection pool.

## Useful commands
```bash
docker compose exec postgres psql -U firedrill -c 'select pid, state, query from pg_stat_activity;'
```
