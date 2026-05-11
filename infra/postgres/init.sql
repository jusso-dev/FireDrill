-- FireDrill schema is created by the API service at startup (see apps/api/src/db.ts).
-- This file exists so the postgres container has an init hook to mount.
SELECT 'FireDrill postgres ready' AS bootstrap;
