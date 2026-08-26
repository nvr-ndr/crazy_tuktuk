import assert from 'node:assert/strict';
import test from 'node:test';
import { CRAZY_EVENTS } from '../data/events.js';
import { getEligibleEvents, weightedPick, resolveEvent, scheduleEventsForRide, chooseAgentChoice, getPassengerReaction, getAgentPersonality, getPassengerRating } from '../js/events.js';

test('MVP catalog contains 37 unique events with artwork', () => {
  assert.equal(CRAZY_EVENTS.length, 37);
  assert.equal(new Set(CRAZY_EVENTS.map((event) => event.id)).size, 37);
  assert.ok(CRAZY_EVENTS.every((event) => event.art.asset.endsWith('.webp') || event.art.asset.endsWith('.png')));
});
test('weighted pick is deterministic at boundaries', () => {
  const items = [{ id: 'a', weight: 1 }, { id: 'b', weight: 3 }];
  assert.equal(weightedPick(items, () => 0).id, 'a');
  assert.equal(weightedPick(items, () => .99).id, 'b');
});
test('events respect schedule and resolve once per ride', () => {
  const trip = scheduleEventsForRide({ leg: 'RIDE', progress: 0 });
  trip.progress = trip.eventSchedule.nextProgress;
  const eligible = getEligibleEvents(trip);
  assert.ok(eligible.length > 0);
  const player = { fuel: 10, points: 0, activeTrip: trip };
  const outcome = resolveEvent(player, eligible[0]);
  assert.ok(outcome);
  assert.equal(player.activeTrip.eventResolved, true);
  assert.equal(getEligibleEvents(player.activeTrip).length, 0);
});
test('agent personality chooses the option matching its bias', () => {
  const event = { choices: [
    { id: 'safe', agentBias: { patience: 1 } },
    { id: 'risk', agentBias: { riskTolerance: 1 } }
  ] };
  assert.equal(chooseAgentChoice(event, { patience: 1, riskTolerance: 0 }, () => 0).id, 'safe');
  assert.equal(getAgentPersonality('degen-dao', 'AGGRESSIVE').aggression, 1);
});
test('passenger reactions use personality and reaction tag', () => {
  assert.equal(getPassengerReaction({ personality: 'TOURIST' }, 'DANGER', 0), 'I do not like this.');
  assert.ok(getPassengerReaction({ personality: 'CHAOTIC' }, 'RISK_WIN', 0));
});
test('stall effects create a temporary event stall', () => {
  const player = { fuel: 10, activeTrip: { progress: .5 } };
  resolveEvent(player, { id: 'stall', outcomes: [{ weight: 100, effects: { stallSeconds: 3 } }] });
  assert.ok(player.activeTrip.eventStallUntil > Date.now());
});
test('passenger events never trigger before pickup', () => {
  const pickup = { leg: 'PICKUP', progress: .5 };
  const eligible = getEligibleEvents(pickup);
  assert.ok(eligible.every((event) => event.type !== 'PASSENGER' && !event.tags.includes('passenger')));
});
test('time effects change fuel budget and passenger mood', () => {
  const player = { fuel: 10, activeTrip: { progress: .5, fuelCost: 10, totalFuelCost: 10, passengerMood: 55 } };
  resolveEvent(player, { id: 'delay', outcomes: [{ weight: 100, effects: { timeSeconds: 30 } }] });
  assert.equal(player.activeTrip.fuelCost, 12.5);
  assert.equal(player.activeTrip.passengerMood, 40);
  assert.equal(player.activeTrip.passengerMoodLabel, 'UNCERTAIN');
});
test('passenger rating reflects final mood', () => {
  assert.equal(getPassengerRating(90), 5);
  assert.equal(getPassengerRating(72), 4);
  assert.equal(getPassengerRating(52), 3);
  assert.equal(getPassengerRating(34), 2);
  assert.equal(getPassengerRating(10), 1);
});
