const { randomUUID } = require('node:crypto');
const { requireSession } = require('../_lib/auth');
const { withDatabaseTransaction, trustedNow } = require('../_lib/db');

function respond(response, status, body) { return response.status(status).json(body); }
function fail(code, status=409) { const e=new Error(code); e.publicStatus=status; return e; }

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return respond(response,405,{error:'method_not_allowed'});
  try {
    const session=await requireSession(request); if(!session) return respond(response,401,{error:'agent_session_required'});
    const key=request.body?.idempotencyKey; if(typeof key!=='string'||!/^[A-Za-z0-9._:-]{8,200}$/.test(key)) throw fail('valid_idempotency_key_required',400);
    const result=await withDatabaseTransaction(async client=>{
      const duplicate=await client.query('SELECT id,fare_id,payload FROM daily_shift_events WHERE idempotency_key=$1',[key]); if(duplicate.rowCount) return {duplicate:true,decision:duplicate.rows[0]};
      const now=await trustedNow(client); const state=await client.query(`SELECT a.*,s.status AS shift_status,s.ends_at FROM agent_shift_states a JOIN daily_shifts s ON s.id=a.shift_id WHERE a.agent_id=$1 FOR UPDATE`,[session.agent_id]);
      if(!state.rowCount||state.rows[0].shift_status!=='ACTIVE'||new Date(now)>=new Date(state.rows[0].ends_at)) throw fail('decision_unavailable');
      const agent=state.rows[0]; if(agent.status!=='ACTIVE') throw fail('decision_invalid_state');
      const fares=await client.query(`SELECT id,point_value,surge_multiplier,expires_at,eligibility FROM daily_fares WHERE shift_id=$1 AND status='AVAILABLE' AND claimed_by IS NULL AND expires_at>$2 ORDER BY (point_value * LEAST(1.25, GREATEST(1, surge_multiplier))) DESC,expires_at ASC,created_at ASC`,[agent.shift_id,now]);
      const eligible=fares.rows.filter(f=>{const ids=f.eligibility?.agentIds||f.eligibility?.agent_ids;return !(Array.isArray(ids)&&ids.length&&!ids.includes(agent.agent_id))&&(!f.eligibility?.minGas||Number(agent.gas_remaining)>=Number(f.eligibility.minGas));});
      if(!eligible.length) throw fail('no_current_fare',422);
      const fare=eligible[0]; await client.query(`UPDATE daily_fares SET status='CLAIMED',claimed_by=$1,claimed_at=$2,locked_surge_multiplier=surge_multiplier WHERE id=$3 AND status='AVAILABLE'`,[agent.agent_id,now,fare.id]);
      await client.query(`UPDATE agent_shift_states SET status='FARE_ACCEPTED',state_version=state_version+1,updated_at=$1 WHERE id=$2`,[now,agent.id]);
      await client.query(`INSERT INTO daily_shift_events (id,shift_id,agent_id,idempotency_key,type,fare_id,payload) VALUES ($1,$2,$3,$4,'FARE_ACCEPTED',$5,$6::jsonb)`,[randomUUID(),agent.shift_id,agent.agent_id,key,fare.id,JSON.stringify({decision:'current_world',strategy:agent.strategy||{}})]);
      return {duplicate:false,decision:{fareId:fare.id,surgeMultiplier:fare.surge_multiplier,source:'current_neon_state'}};
    }); return respond(response,200,result);
  } catch(e){if(e.code==='DATABASE_URL_MISSING')return respond(response,503,{error:'database_unconfigured'});if(e.publicStatus)return respond(response,e.publicStatus,{error:e.message});console.error('agent decision failed',e);return respond(response,500,{error:'agent_decision_failed'});}
};
