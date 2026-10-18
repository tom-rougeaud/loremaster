#!/bin/bash
# (re)démarre Postgres de test + serveur local
HERE="$(cd "$(dirname "$0")/.." && pwd)"
if [ ! -d /tmp/pgdata ]; then mkdir -p /tmp/pgdata && chown postgres /tmp/pgdata && su postgres -c "/usr/lib/postgresql/16/bin/initdb -D /tmp/pgdata -A trust -U postgres >/dev/null"; NEW=1; fi
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgdata -o '-p 5433 -k /tmp' -l /tmp/pg.log start" >/dev/null 2>&1; sleep 2
if [ -n "$NEW" ]; then psql -h /tmp -p 5433 -U postgres -q -c "create role anon nologin; create role authenticated nologin; grant usage on schema public to anon, authenticated;"; fi
psql -h /tmp -p 5433 -U postgres -q -v ON_ERROR_STOP=1 -f "$HERE/src/lore_master.sql" 2>&1 | grep -v NOTICE | tail -2
pkill -f "test/server.py" 2>/dev/null; sleep .5
cd "$HERE" && (nohup python3 test/server.py 8770 > /tmp/lm_srv.log 2>&1 &); sleep 1.2
curl -s -X POST http://127.0.0.1:8770/rest/v1/rpc/lm_ping -H 'Content-Type: application/json' -d '{}'; echo
