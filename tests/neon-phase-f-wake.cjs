const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { Client } = require('pg');
const { processWake, claimDue } = require('../api/_lib/wake');
const snapshot = require('../api/agent/shift');

const url = process.env.DATABASE_URL;
const run = url ? (name, fn) => test(name, { concurrency: false }, fn) : (name, fn) => test.skip(name, { concurrency: false }, fn);

async function fixture(client, count = 1) {
  const ids = { agents: [], shift: crypto.randomUUID() };
  const token = `phase-f-${crypto.randomBytes(24).toString('base64url')}`;
  await client.query(`INSERT INTO daily_shifts (id,shift_key,status,starts_at,ends_at) SELECT $1,d,'ACTIVE',now()-interval '1 hour',now()+interval '1 day' FROM (SELECT min(d) d FROM generate_series(DATE '2090-01-01',DATE '2099-12-31',interval '1 day') d WHERE NOT EXISTS (SELECT 1 FROM daily_shifts WHERE shift_key=d)) available`, [ids.shift]);
  for (let i=0;i<count;i++) {
    const agent=crypto.randomUUID(), state=crypto.randomUUID(); ids.agents.push(agent);
    await client.query(`INSERT INTO agents (id,owner_wallet,name,persona,dflow_wallet_name,wallet_public_key) VALUES ($1,$2,$3,'test',$4,$5)`, [agent,`phase-f-${agent}`,`Phase F ${i}`,`phase-f-wallet-${agent}`,`phase-f-key-${agent}`]);
    await client.query(`INSERT INTO agent_shift_states (id,shift_id,agent_id,status,gas_remaining,gas_allocated,next_action_at) VALUES ($1,$2,$3,'ACTIVE',1000,1000,now()-interval '1 second')`, [state,ids.shift,agent]);
    if (i === 0) await client.query(`INSERT INTO agent_sessions (id,agent_id,token_hash,expires_at) VALUES ($1,$2,$3,now()+interval '1 hour')`, [crypto.randomUUID(),agent,crypto.createHash('sha256').update(token).digest('hex')]);
  }
  ids.token = token;
  return ids;
}
async function cleanup(client, ids) {
  const step=async(name,sql,args)=>{await client.query(sql,args);};
  await step('trip_events','DELETE FROM trip_events WHERE shift_id=$1',[ids.shift]); await step('daily_shift_events','DELETE FROM daily_shift_events WHERE shift_id=$1',[ids.shift]);
  await step('agent_trips','DELETE FROM agent_trips WHERE shift_id=$1',[ids.shift]); await step('agent_commands','DELETE FROM agent_commands WHERE shift_id=$1',[ids.shift]); await step('agent_sessions','DELETE FROM agent_sessions WHERE agent_id=ANY($1::uuid[])',[ids.agents]); await step('agent_shift_states','DELETE FROM agent_shift_states WHERE shift_id=$1',[ids.shift]); await step('daily_fares','DELETE FROM daily_fares WHERE shift_id=$1',[ids.shift]);
  await step('daily_shifts','DELETE FROM daily_shifts WHERE id=$1',[ids.shift]); for (const id of ids.agents) await step(`agent ${id}`,'DELETE FROM agents WHERE id=$1',[id]);
}

run('Phase F live wake resolves an unattended Crazy Event once and reschedules the trip', async () => {
  const c=new Client({connectionString:url}); await c.connect(); let ids;
  try { ids=await fixture(c,1); const fare=crypto.randomUUID(), trip=crypto.randomUUID();
    await c.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at,status,claimed_by,claimed_at) VALUES ($1,$2,'event-passenger','old_khao_san','old_lost_backpack',10,now()+interval '1 day','CLAIMED',$3,now())`,[fare,ids.shift,ids.agents[0]]);
    await c.query(`INSERT INTO agent_trips (id,shift_id,agent_id,fare_id,origin_location_id,destination_location_id,route_variant,route_version,route_distance_meters,base_duration_seconds,trip_started_at,progress,status,next_action_at) VALUES ($1,$2,$3,$4,'old_khao_san','old_lost_backpack','primary','test',1000,1000,now()-interval '500 seconds',0.5,'ON_TRIP',now()-interval '1 second')`,[trip,ids.shift,ids.agents[0],fare]);
    await c.query("UPDATE agent_shift_states SET status='ON_TRIP',active_trip_id=$1,next_action_at=now()-interval '1 hour' WHERE agent_id=$2",[trip,ids.agents[0]]);
    const before=await c.query('SELECT projected_arrival,time_modifier_seconds FROM agent_trips WHERE id=$1',[trip]); const result=await processWake(); assert.ok(result.claimed>=1);
    const after=await c.query('SELECT projected_arrival,time_modifier_seconds,next_action_at FROM agent_trips WHERE id=$1',[trip]); const events=await c.query('SELECT count(*)::int AS n FROM trip_events WHERE trip_id=$1',[trip]);
    assert.equal(Number(events.rows[0].n),1); assert.notEqual(after.rows[0].projected_arrival,before.rows[0].projected_arrival); assert.ok(after.rows[0].next_action_at); assert.ok(result.results.some(r=>r.action==='resolve_crazy_event'));
    // A lost response is retried at the committed boundary; the persisted next
    // action is not due, so the fresh worker must not apply another effect.
    await processWake(); const count=await c.query('SELECT count(*)::int AS n FROM trip_events WHERE trip_id=$1',[trip]); assert.equal(Number(count.rows[0].n),1);
  } finally { if(ids) await cleanup(c,ids); await c.end(); }
});

run('Phase F live wake claims due work, excludes future and terminal states, and respects batch size', async () => {
  const c=new Client({connectionString:url}); await c.connect(); let ids;
  try { ids=await fixture(c,12); await c.query("UPDATE agent_shift_states SET next_action_at=now()+interval '1 hour' WHERE agent_id=$1",[ids.agents[11]]); await c.query("UPDATE agent_shift_states SET status='PARKED',next_action_at=now()-interval '1 hour' WHERE agent_id=$1",[ids.agents[10]]);
    const first=await processWake(); assert.ok(first.claimed<=5); const second=await processWake(); assert.ok(second.claimed<=5); const third=await processWake(); assert.ok(third.claimed<=5);
    const future=await c.query('SELECT status,lease_token,state_version FROM agent_shift_states WHERE agent_id=$1',[ids.agents[11]]); assert.equal(future.rows[0].status,'ACTIVE'); assert.equal(future.rows[0].lease_token,null); assert.equal(Number(future.rows[0].state_version),0);
    const parked=await c.query('SELECT status,lease_token FROM agent_shift_states WHERE agent_id=$1',[ids.agents[10]]); assert.equal(parked.rows[0].status,'PARKED'); assert.equal(parked.rows[0].lease_token,null);
  } finally { if(ids) await cleanup(c,ids); await c.end(); }
});

run('Phase F live overlapping wakes distribute due Agents without duplicate leases', async () => {
  const c=new Client({connectionString:url}); await c.connect(); let ids;
  try { ids=await fixture(c,10); const [a,b]=await Promise.all([processWake(),processWake()]); assert.ok(a.claimed<=5); assert.ok(b.claimed<=5); const states=await c.query('SELECT count(*)::int AS n,count(*) FILTER (WHERE lease_token IS NOT NULL)::int AS leased FROM agent_shift_states WHERE shift_id=$1',[ids.shift]); assert.equal(states.rows[0].leased,0); assert.equal(Number(states.rows[0].n),10); }
  finally { if(ids) await cleanup(c,ids); await c.end(); }
});

run('Phase F live expired leases recover after invocation disappearance', async () => {
  const c=new Client({connectionString:url}); const workerB=new Client({connectionString:url}); await c.connect(); await workerB.connect(); let ids;
  try { ids=await fixture(c,1); const tokenA=crypto.randomUUID(); await c.query('BEGIN'); const claimed=await claimDue(c,1,tokenA,ids.agents); await c.query('COMMIT'); assert.equal(claimed.length,1);
    const tokenB=crypto.randomUUID(); await workerB.query('BEGIN'); const other=await claimDue(workerB,1,tokenB,ids.agents); assert.equal(other.length,0); await workerB.query('ROLLBACK');
    await c.query("UPDATE agent_shift_states SET lease_until=now()-interval '1 second' WHERE agent_id=$1",[ids.agents[0]]);
    const recovered=await processWake({eligibleAgentIds:ids.agents}); assert.equal(recovered.claimed,1); const stale=await c.query("UPDATE agent_shift_states SET lease_token=NULL WHERE agent_id=$1 AND lease_token=$2",[ids.agents[0],tokenA]); assert.equal(stale.rowCount,0);
    const state=await c.query('SELECT lease_token FROM agent_shift_states WHERE agent_id=$1',[ids.agents[0]]); assert.equal(state.rows[0].lease_token,null);
  } finally { if(ids) await cleanup(c,ids); await workerB.end(); await c.end(); }
});

run('Phase F live independent wakes complete a trip, decide from current Neon, and reconstruct a snapshot', async () => {
  const c=new Client({connectionString:url}); await c.connect(); let ids;
  try { ids=await fixture(c,1); const token=ids.token; const fareX=crypto.randomUUID(), trip=crypto.randomUUID(), fareY=crypto.randomUUID();
    await c.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at,status,claimed_by,claimed_at) VALUES ($1,$2,'wake-x','old_khao_san','old_lost_backpack',10,now()+interval '1 day','CLAIMED',$3,now())`,[fareX,ids.shift,ids.agents[0]]);
    await c.query(`INSERT INTO agent_trips (id,shift_id,agent_id,fare_id,origin_location_id,destination_location_id,route_variant,route_version,route_distance_meters,base_duration_seconds,trip_started_at,progress,status,next_action_at) VALUES ($1,$2,$3,$4,'old_khao_san','old_lost_backpack','primary','test',1000,1000,now()-interval '500 seconds',0.5,'ON_TRIP',now()-interval '1 second')`,[trip,ids.shift,ids.agents[0],fareX]);
    await c.query("UPDATE agent_shift_states SET status='ON_TRIP',active_trip_id=$1,next_action_at=now()-interval '1 second' WHERE agent_id=$2",[trip,ids.agents[0]]);
    const previousBatch=process.env.AGENT_WAKE_BATCH_SIZE; process.env.AGENT_WAKE_BATCH_SIZE='50'; const wake1=await processWake(); if(previousBatch===undefined) delete process.env.AGENT_WAKE_BATCH_SIZE; else process.env.AGENT_WAKE_BATCH_SIZE=previousBatch; assert.ok(wake1.results.some(r=>r.agentId===ids.agents[0]&&r.action==='resolve_crazy_event'));
    await c.query("UPDATE agent_trips SET progress=1,trip_started_at=now()-interval '2 hours',next_action_at=now()-interval '1 second' WHERE id=$1",[trip]); await c.query("UPDATE agent_shift_states SET next_action_at=now()-interval '1 second' WHERE agent_id=$1",[ids.agents[0]]);
    const wake2=await processWake(); const completed=await c.query('SELECT status FROM agent_trips WHERE id=$1',[trip]); assert.equal(completed.rows[0].status,'COMPLETED');
    const afterCompletion=await c.query('SELECT status,fares_completed FROM agent_shift_states WHERE agent_id=$1',[ids.agents[0]]); assert.equal(afterCompletion.rows[0].status,'ACTIVE'); assert.equal(Number(afterCompletion.rows[0].fares_completed),1);
    await c.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at,status) VALUES ($1,$2,'wake-y','old_khao_san','old_lost_backpack',99,now()+interval '1 day','AVAILABLE')`,[fareY,ids.shift]); await c.query("UPDATE agent_shift_states SET next_action_at=now()-interval '1 second' WHERE agent_id=$1",[ids.agents[0]]);
    const wake3=await processWake(); assert.ok(wake3.results.some(r=>r.agentId===ids.agents[0]&&r.action==='observe_and_accept_fare')); const selected=await c.query('SELECT status,claimed_by FROM daily_fares WHERE id=$1',[fareY]); assert.equal(selected.rows[0].status,'CLAIMED'); assert.equal(selected.rows[0].claimed_by,ids.agents[0]);
    const res={statusCode:200,body:null,status(n){this.statusCode=n;return this;},json(v){this.body=v;}}; await snapshot({method:'GET',headers:{authorization:`Bearer ${token}`}},res); assert.equal(res.statusCode,200); assert.equal(res.body.state.status,'FARE_ACCEPTED'); assert.equal(res.body.state.shift_id,ids.shift);
  } finally { if(ids) await cleanup(c,ids); await c.end(); }
});

run('Phase F live wake parks an incomplete trip after shift cutoff without resurrection', async () => {
  const c=new Client({connectionString:url}); await c.connect(); let ids;
  try { ids=await fixture(c,1); const fare=crypto.randomUUID(),trip=crypto.randomUUID();
    await c.query(`INSERT INTO daily_fares (id,shift_id,passenger_id,pickup_location_id,destination_location_id,point_value,expires_at,status,claimed_by,claimed_at) VALUES ($1,$2,'cutoff','old_khao_san','old_lost_backpack',10,now()+interval '1 day','CLAIMED',$3,now())`,[fare,ids.shift,ids.agents[0]]);
    await c.query(`INSERT INTO agent_trips (id,shift_id,agent_id,fare_id,origin_location_id,destination_location_id,route_variant,route_version,route_distance_meters,base_duration_seconds,trip_started_at,progress,status,next_action_at) VALUES ($1,$2,$3,$4,'old_khao_san','old_lost_backpack','primary','test',1000,1000,now(),0.1,'ON_TRIP',now()-interval '1 second')`,[trip,ids.shift,ids.agents[0],fare]);
    await c.query("UPDATE daily_shifts SET ends_at=now()-interval '1 second' WHERE id=$1",[ids.shift]); await c.query("UPDATE agent_shift_states SET status='ON_TRIP',active_trip_id=$1,next_action_at=now()-interval '1 second' WHERE agent_id=$2",[trip,ids.agents[0]]);
    const first=await processWake(); const state=await c.query('SELECT status,fares_completed FROM agent_shift_states WHERE agent_id=$1',[ids.agents[0]]); assert.ok(first.results.some(r=>r.agentId===ids.agents[0]&&r.state==='PARKED')); assert.equal(state.rows[0].status,'PARKED'); assert.equal(Number(state.rows[0].fares_completed),0);
    await processWake(); const again=await c.query('SELECT status,fares_completed FROM agent_shift_states WHERE agent_id=$1',[ids.agents[0]]); assert.equal(again.rows[0].status,'PARKED'); assert.equal(Number(again.rows[0].fares_completed),0);
  } finally { if(ids) await cleanup(c,ids); await c.end(); }
});
