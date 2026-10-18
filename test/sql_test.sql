set role anon;
\set ON_ERROR_STOP 0
select fm_create_room('duel',30) as r \gset
select (:'r'::json->>'code') as code, (:'r'::json->>'token') as tok \gset
\echo room :code
-- 30 joins ok, 31st full
do $$ begin end $$;
select count(*) filter (where (fm_join(:'code','Eleve '||g,null)->>'ok')::bool) as joined from generate_series(1,31) g;
select fm_join(:'code','Eleve 31',null);
select fm_join(:'code','eleve 3',null) as dup_case;
select fm_join(:'code','<b>X</b>',null) as cleaned;
select fm_join('ZZZZ','abc',null) as notfound;
-- direct table access must fail
select count(*) from fm_players;
select fm_purge();
select fm_create_room('boss') as r2 \gset
select (:'r2'::json->>'code') as code2, (:'r2'::json->>'token') as tok2 \gset
select fm_join(:'code2','Lou',null) as j \gset
select (:'j'::json->>'id') as pid \gset
select fm_join(:'code2','Lou2',:'pid'::uuid) as rejoin_rename;
select fm_host_ping(:'code2',:'tok2'::uuid,'playing',null);
select fm_host_ping(:'code2',gen_random_uuid(),'playing',null) as badtoken;
select fm_kick(:'code2',:'tok2'::uuid,:'pid'::uuid);
select fm_player_ping(:'pid'::uuid) as after_kick;
select fm_save_result(:'code2',:'tok2'::uuid,'abcdefghijklmnopqrstuvwx','boss','Test','{"n":3,"nq":5,"rate":0.6}'::jsonb);
select fm_list_results('abcdefghijklmnopqrstuvwx');
select fm_list_results('autreclefautreclefautre') as other;
select fm_close_room(:'code2',:'tok2'::uuid);
select fm_ping();
