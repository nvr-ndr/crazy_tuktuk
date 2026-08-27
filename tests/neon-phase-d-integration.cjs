const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { Client } = require('pg');
const transition = require('../api/agent/transition');
const observeFares = require('../api/agent/fares');
const { projectTrip } = require('../api/_lib/trip');
const resolveEvent = require('../api/agent/event');
const pitCall = require('../api/agent/pit-call');
const zones = require('../api/agent/zones');

const databaseUrl = process.env.DATABASE_URL;
const run = databaseUrl
  ? (name, fn) => test(name, { concurrency: false }, fn)
  : (name, fn) => test.skip(name, { concurrency: false }, fn);


function responseCapture() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
}

async function fixture(client, endsExpression, status = 'ACTIVE', gas = 1000) {
  const ids = { agent: crypto.randomUUID(), shift: crypto.randomUUID(), fare: crypto.randomUUID(), session: crypto.randomUUID(), state: crypto.randomUUID() };
  const token = `phase-d-${crypto.randomBytes(24).toString('base64url')}`;
  await client.query(`INSERT INTO daily_shifts (id,shift_key,status,starts_at,ends_at) VALUES ($1,DATE '2099-01-01'+floor(random()*10000)::int,$2,now()-interval '2 hours',${endsExpression})`, [ids.shift, status]);
  await client.query(`INSERT INTO agents (id,owner_wallet,name,persona,dflow_wallet_name,wallet_public_key) VALUES ($1,$2,$3,'test',$4,$5)`, [ids.agent, `phase-d-${ids.agent}`, 'Phase D Final Test', `phase-d-${ids.agent}`, `phase-d-key-${ids.agent}`]);
  await client.query(`INSERT INTO agent_shift_states (id,shift_id,agent_id,status,gas_remaining,gas_allocated) VALUES ($1,$2,$3,$4,$5,$5)`, [ids.state, ids.shift, ids.agent, status === 'ACTIVE' ? 'ACTIVE' : 'FARE_ACCEPTED', gas]);
  await client.query(`INSERT INTO agent_sessions (id,agent_id,token_hash,expires_at) VALUES ($1,$2,$3,now()+interval '1 hour')`, [ids.session, ids.agent, crypto.createHash('sha256').update(token).digest('hex')]);
  await client.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at) VALUES ($1,$2,'final-test','old_khao_san','old_lost_backpack',10,now()+interval '1 hour')`, [ids.fare, ids.shift]);
  return { ids, token };
}

async function cleanup(client, ids) {
  await client.query('ROLLBACK').catch(() => {}); await client.query('BEGIN');
  await client.query('DELETE FROM trip_events WHERE shift_id=$1', [ids.shift]);
  await client.query('DELETE FROM agent_commands WHERE shift_id=$1', [ids.shift]);
  await client.query('DELETE FROM zone_states WHERE shift_id=$1', [ids.shift]);
  await client.query('DELETE FROM daily_shift_events WHERE shift_id=$1', [ids.shift]);
  await client.query('DELETE FROM agent_trips WHERE shift_id=$1', [ids.shift]);
  await client.query('DELETE FROM daily_fares WHERE shift_id=$1', [ids.shift]);
  await client.query('DELETE FROM agent_shift_states WHERE shift_id=$1', [ids.shift]);
  await client.query('DELETE FROM agent_sessions WHERE agent_id=$1', [ids.agent]);
  await client.query('DELETE FROM daily_shifts WHERE id=$1', [ids.shift]);
  await client.query('DELETE FROM agents WHERE id=$1', [ids.agent]); await client.query('COMMIT');
}

run('Neon Phase D claim/start/advance is persisted and idempotent', async () => {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  const ids = { agent: crypto.randomUUID(), shift: crypto.randomUUID(), fare: crypto.randomUUID(), session: crypto.randomUUID() };
  const token = `phase-d-${crypto.randomBytes(24).toString('base64url')}`;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO agents (id,owner_wallet,name,persona,dflow_wallet_name,wallet_public_key) VALUES ($1,$2,$3,$4,$5,$6)`, [ids.agent, `phase-d-${ids.agent}`, 'Phase D Test', 'test', `phase-d-${ids.agent}`, `phase-d-key-${ids.agent}`]);
    await client.query(`INSERT INTO daily_shifts (id,shift_key,status,starts_at,ends_at) VALUES ($1,$2,'ACTIVE',now()-interval '1 hour',now()+interval '1 hour')`, [ids.shift, '2099-01-01']);
    await client.query(`INSERT INTO agent_shift_states (id,shift_id,agent_id,status,gas_remaining,gas_allocated) VALUES ($1,$2,$3,'ACTIVE',1000,1000)`, [crypto.randomUUID(), ids.shift, ids.agent]);
    await client.query(`INSERT INTO agent_sessions (id,agent_id,token_hash,expires_at) VALUES ($1,$2,$3,now()+interval '1 hour')`, [ids.session, ids.agent, hash]);
    await client.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at) VALUES ($1,$2,'test-passenger','old_khao_san','old_lost_backpack',10,now()+interval '1 hour')`, [ids.fare, ids.shift]);
    await client.query('COMMIT');

    const req = (body) => ({ method: 'POST', headers: { authorization: `Bearer ${token}` }, body });
    let res = responseCapture();
    await transition(req({ action: 'claim_fare', fareId: ids.fare, idempotencyKey: 'phase-d-claim-1' }), res);
    assert.equal(res.statusCode, 200);
    res = responseCapture();
    await transition(req({ action: 'claim_fare', fareId: ids.fare, idempotencyKey: 'phase-d-claim-1' }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.duplicate, true);
    res = responseCapture();
    await transition(req({ action: 'start_trip', idempotencyKey: 'phase-d-start-1' }), res);
    assert.equal(res.statusCode, 200);
    const tripId = res.body.snapshot.trip_id;
    assert.ok(tripId);
    const shiftSnapshot = require('../api/agent/shift');
    const snapshotResponse = responseCapture();
    await shiftSnapshot({ method: 'GET', headers: { authorization: `Bearer ${token}` } }, snapshotResponse);
    assert.equal(snapshotResponse.statusCode, 200);
    assert.equal(snapshotResponse.body.state.active_trip_id, tripId);
    await client.query('UPDATE agent_trips SET trip_started_at=now()-interval \'2 hours\' WHERE id=$1', [tripId]);
    res = responseCapture();
    await transition(req({ action: 'advance_trip', idempotencyKey: 'phase-d-advance-1' }), res);
    assert.equal(res.statusCode, 200);
    const persisted = await client.query('SELECT status, progress FROM agent_trips WHERE id=$1', [tripId]);
    assert.equal(persisted.rows[0].status, 'COMPLETED');
    assert.equal(Number(persisted.rows[0].progress), 1);
  } finally {
    try {
      await client.query('ROLLBACK');
      await client.query('BEGIN');
      await client.query('DELETE FROM daily_shift_events WHERE shift_id=$1', [ids.shift]);
      await client.query('DELETE FROM agent_trips WHERE shift_id=$1', [ids.shift]);
      await client.query('DELETE FROM daily_fares WHERE shift_id=$1', [ids.shift]);
      await client.query('DELETE FROM agent_shift_states WHERE shift_id=$1', [ids.shift]);
      await client.query('DELETE FROM agent_sessions WHERE agent_id=$1', [ids.agent]);
      await client.query('DELETE FROM daily_shifts WHERE id=$1', [ids.shift]);
      await client.query('DELETE FROM agents WHERE id=$1', [ids.agent]);
      await client.query('COMMIT');
    } finally {
      await client.end();
    }
  }
});

run('Neon Phase D concurrent claims allow one owner only', async () => {
  const client = new Client({ connectionString: databaseUrl }); await client.connect();
  const shift = crypto.randomUUID(); const fare = crypto.randomUUID();
  const agents = [crypto.randomUUID(), crypto.randomUUID()]; const sessions = agents.map(() => crypto.randomUUID());
  const tokens = agents.map(() => `phase-d-${crypto.randomBytes(24).toString('base64url')}`);
  try {
    await client.query('BEGIN');
    await client.query(`INSERT INTO daily_shifts (id,shift_key,status,starts_at,ends_at) VALUES ($1,'2099-01-02','ACTIVE',now()-interval '1 hour',now()+interval '1 hour')`, [shift]);
    for (let i = 0; i < agents.length; i++) {
      await client.query(`INSERT INTO agents (id,owner_wallet,name,persona,dflow_wallet_name,wallet_public_key) VALUES ($1,$2,$3,'test',$4,$5)`, [agents[i], `phase-d-${agents[i]}`, `Phase D Race ${i}`, `phase-d-${agents[i]}`, `phase-d-key-${agents[i]}`]);
      await client.query(`INSERT INTO agent_shift_states (id,shift_id,agent_id,status,gas_remaining,gas_allocated) VALUES ($1,$2,$3,'ACTIVE',1000,1000)`, [crypto.randomUUID(), shift, agents[i]]);
      await client.query(`INSERT INTO agent_sessions (id,agent_id,token_hash,expires_at) VALUES ($1,$2,$3,now()+interval '1 hour')`, [sessions[i], agents[i], crypto.createHash('sha256').update(tokens[i]).digest('hex')]);
    }
    await client.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at) VALUES ($1,$2,'race','old_khao_san','old_lost_backpack',10,now()+interval '1 hour')`, [fare, shift]);
    await client.query('COMMIT');
    const makeReq = (i) => ({ method: 'POST', headers: { authorization: `Bearer ${tokens[i]}` }, body: { action: 'claim_fare', fareId: fare, idempotencyKey: `phase-d-race-${i}` } });
    const results = await Promise.all([0, 1].map(async i => { const response = responseCapture(); await transition(makeReq(i), response); return response; }));
    assert.equal(results.filter(r => r.statusCode === 200).length, 1);
    assert.equal(results.filter(r => r.statusCode === 409 && r.body.error === 'fare_unavailable').length, 1);
  } finally {
    try { await client.query('ROLLBACK'); await client.query('BEGIN'); await client.query('DELETE FROM daily_shift_events WHERE shift_id=$1',[shift]); await client.query('DELETE FROM daily_fares WHERE shift_id=$1',[shift]); await client.query('DELETE FROM agent_shift_states WHERE shift_id=$1',[shift]); await client.query('DELETE FROM agent_sessions WHERE agent_id=ANY($1::uuid[])',[agents]); await client.query('DELETE FROM daily_shifts WHERE id=$1',[shift]); await client.query('DELETE FROM agents WHERE id=ANY($1::uuid[])',[agents]); await client.query('COMMIT'); } finally { await client.end(); }
  }
});

run('Neon Phase D gas exhaustion is terminal and idempotent', async () => {
  const client = new Client({ connectionString: databaseUrl }); await client.connect(); let f;
  try {
    await client.query('BEGIN'); f = await fixture(client, "now()+interval '1 hour'"); await client.query('COMMIT');
    const req = body => ({ method: 'POST', headers: { authorization: `Bearer ${f.token}` }, body });
    let res = responseCapture(); await transition(req({ action: 'claim_fare', fareId: f.ids.fare, idempotencyKey: 'phase-d-gas-claim' }), res); assert.equal(res.statusCode, 200);
    res = responseCapture(); await transition(req({ action: 'start_trip', idempotencyKey: 'phase-d-gas-start' }), res); assert.equal(res.statusCode, 200);
    const tripId = res.body.snapshot.trip_id;
    await client.query(`UPDATE agent_shift_states SET gas_remaining=0 WHERE agent_id=$1`, [f.ids.agent]);
    await client.query(`UPDATE agent_trips SET trip_started_at=now()-interval '2 hours' WHERE id=$1`, [tripId]);
    res = responseCapture(); await transition(req({ action: 'advance_trip', idempotencyKey: 'phase-d-gas-advance', gas: 999999 }), res); assert.equal(res.statusCode, 200);
    const state = await client.query('SELECT status,gas_remaining,active_trip_id FROM agent_shift_states WHERE agent_id=$1', [f.ids.agent]);
    const trip = await client.query('SELECT status,gas_consumed FROM agent_trips WHERE id=$1', [tripId]);
    const events = await client.query("SELECT type FROM daily_shift_events WHERE shift_id=$1 AND type='FARE_STALLED'", [f.ids.shift]);
    assert.equal(state.rows[0].status, 'STALLED'); assert.equal(Number(state.rows[0].gas_remaining), 0); assert.equal(trip.rows[0].status, 'STALLED'); assert.equal(events.rowCount, 1);
    res = responseCapture(); await transition(req({ action: 'advance_trip', idempotencyKey: 'phase-d-gas-advance', gas: 0 }), res); assert.equal(res.statusCode, 200); assert.equal(res.body.duplicate, true);
    assert.equal((await client.query("SELECT count(*)::int AS n FROM daily_shift_events WHERE shift_id=$1 AND type='FARE_STALLED'", [f.ids.shift])).rows[0].n, 1);
    res = responseCapture(); await transition(req({ action: 'advance_trip', idempotencyKey: 'phase-d-gas-stale' }), res); assert.equal(res.statusCode, 409); assert.equal(res.body.error, 'no_active_trip');
  } finally { await cleanup(client, f.ids); await client.end(); }
});

run('Neon Phase D cutoff rejects claims/starts and parks incomplete trips', async () => {
  const client = new Client({ connectionString: databaseUrl }); await client.connect(); let f;
  try {
    await client.query('BEGIN'); f = await fixture(client, "now()-interval '1 minute'"); await client.query('COMMIT');
    const req = body => ({ method: 'POST', headers: { authorization: `Bearer ${f.token}` }, body });
    let res = responseCapture(); await transition(req({ action: 'claim_fare', fareId: f.ids.fare, idempotencyKey: 'phase-d-cut-claim', clientTimestamp: '2099-01-01T00:00:00Z' }), res); assert.equal(res.statusCode, 409); assert.equal(res.body.error, 'shift_cutoff');
    await client.query(`UPDATE daily_fares SET status='CLAIMED',claimed_by=$1,claimed_at=now() WHERE id=$2`, [f.ids.agent, f.ids.fare]);
    await client.query(`UPDATE agent_shift_states SET status='FARE_ACCEPTED' WHERE agent_id=$1`, [f.ids.agent]);
    res = responseCapture(); await transition(req({ action: 'start_trip', idempotencyKey: 'phase-d-cut-start', clientTimestamp: '1900-01-01T00:00:00Z' }), res); assert.equal(res.statusCode, 409); assert.equal(res.body.error, 'shift_cutoff');
    const tripId = crypto.randomUUID(); await client.query(`INSERT INTO agent_trips (id,shift_id,agent_id,fare_id,origin_location_id,destination_location_id,route_variant,route_version,route_distance_meters,base_duration_seconds,trip_started_at,progress,status,next_action_at) VALUES ($1,$2,$3,$4,'old_khao_san','old_lost_backpack','primary','test',1000,600,now()-interval '1 minute',0,'ON_TRIP',now())`, [tripId,f.ids.shift,f.ids.agent,f.ids.fare]);
    await client.query(`UPDATE agent_shift_states SET status='ON_TRIP',active_trip_id=$1 WHERE agent_id=$2`, [tripId,f.ids.agent]);
    res = responseCapture(); await transition(req({ action: 'advance_trip', idempotencyKey: 'phase-d-cut-advance', clientTimestamp: '1900-01-01T00:00:00Z' }), res); assert.equal(res.statusCode, 200);
    assert.equal((await client.query('SELECT status FROM agent_trips WHERE id=$1',[tripId])).rows[0].status, 'PARKED');
    assert.equal((await client.query('SELECT status FROM agent_shift_states WHERE agent_id=$1',[f.ids.agent])).rows[0].status, 'PARKED');
    assert.equal((await client.query("SELECT count(*)::int AS n FROM daily_shift_events WHERE shift_id=$1 AND type='AGENT_PARKED'",[f.ids.shift])).rows[0].n, 1);
    res = responseCapture(); await transition(req({ action: 'advance_trip', idempotencyKey: 'phase-d-cut-advance' }), res); assert.equal(res.body.duplicate, true);
  } finally { await cleanup(client, f.ids); await client.end(); }
});

run('Neon Phase D fare observation is read-only and filters authoritative fares', async () => {
  const client = new Client({ connectionString: databaseUrl }); await client.connect(); let f;
  try {
    await client.query('BEGIN'); f = await fixture(client, "now()+interval '1 hour'");
    const expired = crypto.randomUUID(), ineligible = crypto.randomUUID();
    await client.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at) VALUES ($1,$2,'expired','old_khao_san','old_lost_backpack',10,now()-interval '1 minute')`, [expired, f.ids.shift]);
    await client.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at,eligibility) VALUES ($1,$2,'ineligible','old_khao_san','old_lost_backpack',10,now()+interval '1 hour',$3)`, [ineligible, f.ids.shift, JSON.stringify({ agentIds: [crypto.randomUUID()] })]);
    await client.query('COMMIT');
    const res = responseCapture(); await observeFares({ method: 'GET', headers: { authorization: `Bearer ${f.token}` } }, res);
    assert.equal(res.statusCode, 200); assert.deepEqual(res.body.fares.map(x => x.id), [f.ids.fare]);
    const unchanged = await client.query('SELECT claimed_by,status FROM daily_fares WHERE id=$1', [f.ids.fare]);
    const unchangedAgent = await client.query('SELECT status FROM agent_shift_states WHERE agent_id=$1', [f.ids.agent]);
    assert.equal(unchanged.rows[0].claimed_by, null); assert.equal(unchanged.rows[0].status, 'AVAILABLE'); assert.equal(unchangedAgent.rows[0].status, 'ACTIVE');
    const unauthorized = responseCapture(); await observeFares({ method: 'GET', headers: {} }, unauthorized); assert.equal(unauthorized.statusCode, 401);
  } finally { await cleanup(client, f.ids); await client.end(); }
});

run('Neon Phase D dynamic duration survives fresh context and preserves elapsed progress', async () => {
  const client = new Client({ connectionString: databaseUrl }); await client.connect(); let f;
  try {
    await client.query('BEGIN'); f = await fixture(client, "now()+interval '2 hours'");
    await client.query(`UPDATE daily_fares SET status='CLAIMED',claimed_by=$1 WHERE id=$2`, [f.ids.agent, f.ids.fare]);
    const trip = crypto.randomUUID();
    await client.query(`INSERT INTO agent_trips (id,shift_id,agent_id,fare_id,origin_location_id,destination_location_id,route_variant,route_version,route_distance_meters,base_duration_seconds,trip_started_at,progress,time_modifier_seconds,status,next_action_at) VALUES ($1,$2,$3,$4,'old_khao_san','old_lost_backpack','primary','test',1000,600,now()-interval '300 seconds',0,0,'ON_TRIP',now())`, [trip,f.ids.shift,f.ids.agent,f.ids.fare]);
    await client.query('UPDATE agent_shift_states SET status=\'ON_TRIP\',active_trip_id=$1 WHERE agent_id=$2', [trip,f.ids.agent]);
    await client.query('UPDATE agent_trips SET time_modifier_seconds=120 WHERE id=$1', [trip]); await client.query('COMMIT'); await client.end();
    const fresh = new Client({ connectionString: databaseUrl }); await fresh.connect();
    const positive = (await fresh.query('SELECT * FROM agent_trips WHERE id=$1', [trip])).rows[0];
    const p = projectTrip({ baseDurationSeconds: positive.base_duration_seconds, timeModifierSeconds: positive.time_modifier_seconds, tripStartedAt: positive.trip_started_at, now: new Date() });
    assert.equal(Number(positive.base_duration_seconds), 600); assert.equal(Number(positive.time_modifier_seconds), 120); assert.ok(p.remainingSeconds >= 415 && p.remainingSeconds <= 425);
    await fresh.query('UPDATE agent_trips SET time_modifier_seconds=-120 WHERE id=$1', [trip]); await fresh.end();
    const resumed = new Client({ connectionString: databaseUrl }); await resumed.connect(); const negative = (await resumed.query('SELECT * FROM agent_trips WHERE id=$1', [trip])).rows[0];
    const n = projectTrip({ baseDurationSeconds: negative.base_duration_seconds, timeModifierSeconds: negative.time_modifier_seconds, tripStartedAt: negative.trip_started_at, now: new Date() });
    assert.ok(n.remainingSeconds >= 175 && n.remainingSeconds <= 185); await resumed.query('UPDATE agent_trips SET time_modifier_seconds=-400 WHERE id=$1', [trip]); await resumed.end();
    const boundary = new Client({ connectionString: databaseUrl }); await boundary.connect(); const bRow = (await boundary.query('SELECT * FROM agent_trips WHERE id=$1',[trip])).rows[0]; const b = projectTrip({ baseDurationSeconds:bRow.base_duration_seconds,timeModifierSeconds:bRow.time_modifier_seconds,tripStartedAt:bRow.trip_started_at,now:new Date() }); assert.equal(b.completed,true); assert.equal(b.remainingSeconds,0); await boundary.end();
  } finally { const cleanupClient = new Client({ connectionString: databaseUrl }); await cleanupClient.connect(); await cleanup(cleanupClient, f.ids); await cleanupClient.end(); if (client._connected) await client.end().catch(()=>{}); }
});

run('Neon Phase E event effects persist once across fresh contexts', async () => {
  const client = new Client({ connectionString: databaseUrl }); await client.connect(); let f;
  try {
    await client.query('BEGIN'); f = await fixture(client, "now()+interval '2 hours'"); await client.query('COMMIT');
    const req = body => ({ method:'POST', headers:{authorization:`Bearer ${f.token}`}, body });
    const prefix=`phase-e-event-${f.ids.agent}`; let res=responseCapture(); await transition(req({action:'claim_fare',fareId:f.ids.fare,idempotencyKey:`${prefix}-claim`}),res); assert.equal(res.statusCode,200);
    res=responseCapture(); await transition(req({action:'start_trip',idempotencyKey:`${prefix}-start`}),res); assert.equal(res.statusCode,200);
    const tripId=res.body.snapshot.trip_id; await client.query(`UPDATE agent_trips SET progress=.3,trip_started_at=now()-interval '300 seconds' WHERE id=$1`,[tripId]); const eventKey=`phase-e-event-${f.ids.agent}`;
    res=responseCapture(); await resolveEvent(req({id:'client-forged',roll:.999,effects:{timeSeconds:-999, fuel:999, crazy:999},idempotencyKey:eventKey}),res); assert.equal(res.statusCode,200); assert.equal(res.body.duplicate,false);
    const persisted=(await client.query('SELECT event_id,outcome_id,random_roll,time_effect,gas_effect,score_effect FROM trip_events WHERE trip_id=$1',[tripId])).rows[0]; assert.ok(persisted.event_id); assert.notEqual(Number(persisted.random_roll),.999);
    const once=(await client.query('SELECT time_modifier_seconds,gas_modifier,score_modifier FROM agent_trips WHERE id=$1',[tripId])).rows[0];
    res=responseCapture(); await resolveEvent(req({id:'another-forged',roll:0,effects:{timeSeconds:999},idempotencyKey:eventKey}),res); assert.equal(res.statusCode,200); assert.equal(res.body.duplicate,true);
    const twice=(await client.query('SELECT time_modifier_seconds,gas_modifier,score_modifier FROM agent_trips WHERE id=$1',[tripId])).rows[0]; assert.deepEqual(twice,once); assert.equal((await client.query('SELECT count(*)::int AS n FROM trip_events WHERE trip_id=$1',[tripId])).rows[0].n,1);
  } finally { await cleanup(client,f.ids); await client.end(); }
});

run('Neon Phase E Pit Calls enforce allowance, persist, and consume at boundary', async () => {
  const client=new Client({connectionString:databaseUrl}); await client.connect(); let f;
  try {
    await client.query('BEGIN'); f=await fixture(client,"now()+interval '2 hours'"); await client.query('COMMIT'); const req=body=>({method:'POST',headers:{authorization:`Bearer ${f.token}`},body});
    const pitPrefix=`phase-e-pit-${f.ids.agent}`; for(let i=1;i<=3;i++){const res=responseCapture();await pitCall(req({commandType:'SET_STRATEGY',target:'NEXT_DECISION',payload:{priority:'BALANCED',risk:i,activity:i},idempotencyKey:`${pitPrefix}-${i}`}),res);assert.equal(res.statusCode,200);}
    let res=responseCapture();await pitCall(req({commandType:'SET_STRATEGY',target:'NEXT_DECISION',payload:{priority:'BALANCED',risk:4,activity:4},idempotencyKey:`${pitPrefix}-4`}),res);assert.equal(res.statusCode,409);assert.equal(res.body.error,'pit_calls_exhausted');
    res=responseCapture();await pitCall(req({commandType:'SET_STRATEGY',target:'NEXT_DECISION',payload:{priority:'BALANCED',risk:1,activity:1},idempotencyKey:`${pitPrefix}-1`}),res);assert.equal(res.body.duplicate,true);
    const pending=(await client.query("SELECT count(*)::int AS n FROM agent_commands WHERE agent_id=$1 AND status='PENDING'",[f.ids.agent])).rows[0].n; assert.equal(pending,3);
  } finally { await cleanup(client,f.ids); await client.end(); }
});

run('Neon Phase E zone update derives population from persisted Agents', async () => {
  const client=new Client({connectionString:databaseUrl}); await client.connect(); let f;
  try { await client.query('BEGIN'); f=await fixture(client,"now()+interval '2 hours'"); await client.query(`UPDATE agent_shift_states SET current_route='{"zoneId":"silom"}'::jsonb WHERE agent_id=$1`,[f.ids.agent]); await client.query('COMMIT'); const res=responseCapture(); await zones({method:'POST',headers:{authorization:`Bearer ${f.token}`}},res); assert.equal(res.statusCode,200); const zone=res.body.zones.find(x=>x.zone_id==='silom'); assert.equal(zone.agent_count,1); assert.equal(zone.supply_score,1); } finally { await cleanup(client,f.ids); await client.end(); }
});

run('Neon Phase E final live multi-context economy and current-world acceptance', async () => {
  const client=new Client({connectionString:databaseUrl}); await client.connect(); let f;
  try {
    // Context A: only identifiers/token cross the boundary; authoritative rows are reloaded below.
    await client.query('BEGIN'); f=await fixture(client,"now()+interval '3 hours'"); await client.query(`INSERT INTO zone_states (id,shift_id,zone_id,agent_count,demand_score,supply_score,state) VALUES ($1,$2,'silom',1,50,1,'NORMAL')`,[crypto.randomUUID(),f.ids.shift]); await client.query(`UPDATE daily_fares SET surge_multiplier=1.1 WHERE id=$1`,[f.ids.fare]); await client.query('COMMIT');
    const req=body=>({method:'POST',headers:{authorization:`Bearer ${f.token}`},body}); let res=responseCapture(); await transition(req({action:'claim_fare',fareId:f.ids.fare,idempotencyKey:`phase-e-final-claim-${f.ids.agent}`}),res); assert.equal(res.statusCode,200); res=responseCapture(); await transition(req({action:'start_trip',idempotencyKey:`phase-e-final-start-${f.ids.agent}`}),res); assert.equal(res.statusCode,200); await client.end();
    // Context B: reload the trip, resolve an event, and end the context.
    let fresh=new Client({connectionString:databaseUrl}); await fresh.connect(); const tripId=(await fresh.query('SELECT active_trip_id FROM agent_shift_states WHERE agent_id=$1',[f.ids.agent])).rows[0].active_trip_id; await fresh.query(`UPDATE agent_trips SET progress=.3,trip_started_at=now()-interval '300 seconds' WHERE id=$1`,[tripId]); await fresh.end(); res=responseCapture(); await resolveEvent(req({id:'forged',roll:.99,effects:{crazy:999},idempotencyKey:`phase-e-final-event-${f.ids.agent}`}),res); assert.equal(res.statusCode,200);
    fresh=new Client({connectionString:databaseUrl}); await fresh.connect(); const historical=(await fresh.query('SELECT locked_surge_multiplier FROM daily_fares WHERE id=$1',[f.ids.fare])).rows[0]; assert.equal(Number(historical.locked_surge_multiplier),1.1); await fresh.end();
    // Context C: submit the existing NEXT_DECISION intervention; it remains pending and selects nothing.
    res=responseCapture(); await pitCall(req({commandType:'SET_STRATEGY',target:'NEXT_DECISION',payload:{priority:'SCORE',risk:8,activity:7},idempotencyKey:`phase-e-final-pit-${f.ids.agent}`}),res); assert.equal(res.statusCode,200); fresh=new Client({connectionString:databaseUrl}); await fresh.connect(); assert.equal((await fresh.query("SELECT status FROM agent_commands WHERE agent_id=$1 ORDER BY created_at DESC LIMIT 1",[f.ids.agent])).rows[0].status,'PENDING'); await fresh.end();
    // Context D: change the current world and create two current opportunities; no future route is created.
    fresh=new Client({connectionString:databaseUrl}); await fresh.connect(); await fresh.query(`UPDATE zone_states SET demand_score=90,supply_score=1,state='SURGE' WHERE shift_id=$1 AND zone_id='silom'`,[f.ids.shift]); const fareA=crypto.randomUUID(),fareB=crypto.randomUUID(); await fresh.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at,surge_multiplier) VALUES ($1,$2,'t1-a','old_khao_san','old_lost_backpack',20,now()+interval '2 hours',1.2),($3,$2,'t1-b','old_khao_san','old_lost_backpack',80,now()+interval '2 hours',2.2)`,[fareA,f.ids.shift,fareB]); await fresh.end();
    // Context E: reload and complete; Pit Call consumption occurs once, without selecting the next fare.
    fresh=new Client({connectionString:databaseUrl}); await fresh.connect(); await fresh.query(`UPDATE agent_trips SET trip_started_at=now()-interval '2 hours' WHERE id=$1`,[tripId]); await fresh.end(); res=responseCapture(); await transition(req({action:'advance_trip',idempotencyKey:`phase-e-final-complete-${f.ids.agent}`}),res); assert.equal(res.statusCode,200); assert.equal(res.body.consumedCommand.payload.priority,'SCORE'); fresh=new Client({connectionString:databaseUrl}); await fresh.connect(); assert.equal((await fresh.query("SELECT count(*)::int AS n FROM daily_fares WHERE shift_id=$1 AND status='COMPLETED'",[f.ids.shift])).rows[0].n,1); assert.equal((await fresh.query("SELECT count(*)::int AS n FROM daily_fares WHERE shift_id=$1 AND status='CLAIMED'",[f.ids.shift])).rows[0].n,0); await fresh.end();
    // Context F: actual bounded decision path reads current fares and chooses T1's higher-value fare B.
    res=responseCapture(); await (require('../api/agent/decide'))({method:'POST',headers:{authorization:`Bearer ${f.token}`},body:{idempotencyKey:`phase-e-final-decide-${f.ids.agent}`}},res); assert.equal(res.statusCode,200); assert.equal(res.body.decision.fareId,fareB); assert.equal(res.body.decision.source,'current_neon_state');
    fresh=new Client({connectionString:databaseUrl}); await fresh.connect(); assert.equal(Number((await fresh.query('SELECT locked_surge_multiplier FROM daily_fares WHERE id=$1',[f.ids.fare])).rows[0].locked_surge_multiplier),1.1); assert.equal(Number((await fresh.query('SELECT surge_multiplier FROM daily_fares WHERE id=$1',[fareB])).rows[0].surge_multiplier),2.2); await fresh.end();
  } finally { const c=new Client({connectionString:databaseUrl}); await c.connect(); await cleanup(c,f.ids); await c.end(); if(client._connected) await client.end().catch(()=>{}); }
});
