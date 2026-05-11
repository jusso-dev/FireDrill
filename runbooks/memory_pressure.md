# Runbook: Memory Pressure

**Scenario id:** `memory_pressure`
**Affected services:** api

## Safety
This simulation is **capped at 256 MB** of resident allocation, and is freed on disable. It will not OOM the host.

## Symptoms
- Process RSS climbing
- GC pauses
- Possible OOM risk in a real incident

## How to detect
- `process_resident_memory_bytes`
- Container memory stat in Grafana
- Heap snapshots

## Immediate mitigation
1. Disable **Memory Pressure** in `/scenarios` (frees buffers immediately).
2. Restart container.
3. Reduce in-memory caches.

## Long-term fix
- LRU + TTL on caches.
- Memory-leak regression tests.
- Set container memory limits.

## Useful commands
```bash
docker stats firedrill-api-1
```
