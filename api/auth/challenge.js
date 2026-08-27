const { randomBytes, randomUUID } = require('node:crypto');
const { withDatabase } = require('../_lib/db');

function validAddress(value) { return typeof value === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value); }
module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'method_not_allowed' });
  const wallet = request.body?.wallet;
  if (!validAddress(wallet)) return response.status(400).json({ error: 'solana_wallet_required' });
  const id=randomUUID(), nonce=randomBytes(24).toString('base64url'), expiresAt=new Date(Date.now()+5*60*1000).toISOString();
  const message=`Crazy Tuk Agent Runner\nWallet: ${wallet}\nNonce: ${nonce}\nExpires: ${expiresAt}`;
  try { await withDatabase(client=>client.query('INSERT INTO auth_challenges (id,wallet_address,message,expires_at) VALUES ($1,$2,$3,$4)',[id,wallet,message,expiresAt])); return response.status(201).json({challengeId:id,message,expiresAt}); }
  catch (error) { console.error('auth challenge failed',error); return response.status(503).json({error:'challenge_unavailable'}); }
};
