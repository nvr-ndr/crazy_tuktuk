const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const agentSource = fs.readFileSync(path.join(__dirname, '..', 'api', '_handlers', 'leaderboard.js'), 'utf8');
const standardSource = fs.readFileSync(path.join(__dirname, '..', 'api', '_handlers', 'standard.js'), 'utf8');
const uiSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

for (const [source, pool] of [[agentSource, 'AGENT'], [standardSource, 'STANDARD']]) {
  assert.match(source, new RegExp(`rewardPool: '${pool}'`));
  assert.match(source, /epochLeaderboard/);
  assert.match(source, /WHERE p\.pool=/);
  assert.match(source, /reward_epochs/);
}

assert.doesNotMatch(agentSource, /ORDER BY p\.pool/);
assert.match(uiSource, /payload\?\.rewardPool === poolName/);
assert.match(uiSource, /poolPayload\.epochLeaderboard/);
assert.match(uiSource, /DRIVE REWARD EPOCH/);
assert.match(uiSource, /AGENT REWARD EPOCH/);

console.log('reward epoch leaderboard isolation tests passed');
