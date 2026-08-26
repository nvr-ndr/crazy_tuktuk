import { CRAZY_EVENTS } from '../data/events.js';
const REACTION_PROFILES = { CALM:{DELAY_MINOR:['We have time.','No problem.'],DELAY_MAJOR:['That is quite a delay.'],DANGER:['Please be careful.'],RISK_WIN:['That was impressive.'],RISK_FAIL:['I knew this was risky.'],WEIRD:['Bangkok is full of surprises.'],SAFE_CHOICE:['Good choice.']}, IMPATIENT:{DELAY_MINOR:['Can we go now?'],DELAY_MAJOR:['I am going to be late!'],DANGER:['Do something!'],RISK_WIN:['Faster!'],RISK_FAIL:['This is exactly what I feared.'],WEIRD:['What is happening?!'],SAFE_CHOICE:['Fine, but hurry.']}, NERVOUS:{DELAY_MINOR:['Are we going to be okay?'],DELAY_MAJOR:['Maybe we should turn around.'],DANGER:['I do not like this.'],RISK_WIN:['Oh! We made it.'],RISK_FAIL:['I knew we should not do that.'],WEIRD:['Is that normal here?'],SAFE_CHOICE:['Thank you for being careful.']}, THRILL_SEEKER:{DELAY_MINOR:['Part of the adventure!'],DELAY_MAJOR:['What a story!'],DANGER:['Now this is exciting!'],RISK_WIN:['Again!'],RISK_FAIL:['Worth it. Probably.'],WEIRD:['Incredible!'],SAFE_CHOICE:['A sensible adventure.']}, GRUMPY:{DELAY_MINOR:['Typical.'],DELAY_MAJOR:['Unbelievable.'],DANGER:['I paid for a ride, not a stunt.'],RISK_WIN:['At least that worked.'],RISK_FAIL:['Of course.'],WEIRD:['I am not commenting.'],SAFE_CHOICE:['Finally, a decent decision.']}, CHAOTIC:{DELAY_MINOR:['More chaos!'],DELAY_MAJOR:['This is going wonderfully!'],DANGER:['Do the dangerous thing!'],RISK_WIN:['LEGENDARY!'],RISK_FAIL:['Even better!'],WEIRD:['I love this city!'],SAFE_CHOICE:['Boring, but effective.']}, RESERVED:{DELAY_MINOR:['Understood.'],DELAY_MAJOR:['That is unfortunate.'],DANGER:['Please proceed carefully.'],RISK_WIN:['Well done.'],RISK_FAIL:['That was unwise.'],WEIRD:['Remarkable.'],SAFE_CHOICE:['Thank you.']} };
const PROFILE_BY_PERSONALITY = { AUNTIE:'CALM', TOURIST:'NERVOUS', OFFICE_WORKER:'IMPATIENT', DEGEN:'CHAOTIC', UNCLE:'CALM', BUILDER:'RESERVED', FOODIE:'CALM', FITNESS:'IMPATIENT', INFLUENCER:'CHAOTIC', STUDENT:'THRILL_SEEKER' };
export const AGENT_PERSONALITIES = { 'degen-dao': { aggression:.9, patience:.15, greed:.8, riskTolerance:.9, passengerFocus:.25, chaos:.8 }, 'uncle-lek': { aggression:.35, patience:.8, greed:.45, riskTolerance:.3, passengerFocus:.85, chaos:.2 }, 'speedy-somchai': { aggression:.75, patience:.35, greed:.6, riskTolerance:.65, passengerFocus:.55, chaos:.45 } };
export function getStartingPassengerMood(npc) { const personality=String(npc?.personality||'').toUpperCase(); if (personality.includes('THRILL') || personality.includes('DEGEN') || personality.includes('DJ')) return 68; if (personality.includes('GRUMP') || personality.includes('OFFICE')) return 44; return 55; }
export function getPassengerMoodLabel(mood) { const value=Number(mood ?? 50); return value >= 75 ? 'DELIGHTED' : value >= 55 ? 'HAPPY' : value >= 35 ? 'UNCERTAIN' : 'UPSET'; }
export function getPassengerRating(mood) { const value=Number(mood ?? 50); return value >= 85 ? 5 : value >= 70 ? 4 : value >= 50 ? 3 : value >= 30 ? 2 : 1; }
export function getAgentPersonality(driverId, strategy = '') { const base = AGENT_PERSONALITIES[driverId] || AGENT_PERSONALITIES['uncle-lek']; const modifier = String(strategy).toUpperCase() === 'AGGRESSIVE' ? { aggression:.15, riskTolerance:.15, patience:-.1 } : String(strategy).toUpperCase() === 'CONSERVATIVE' ? { aggression:-.15, riskTolerance:-.15, patience:.15 } : {}; return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, Math.max(-1, Math.min(1, value + (modifier[key] || 0)))])); }
export function getPassengerReaction(npc, tag='WEIRD', seed=0, mood=50) { let profile=PROFILE_BY_PERSONALITY[String(npc?.personality||'').split(' / ')[0]]||'CALM'; if (mood < 25) profile='GRUMPY'; else if (mood > 80 && tag === 'RISK_WIN') profile='THRILL_SEEKER'; const lines=REACTION_PROFILES[profile][tag]||REACTION_PROFILES[profile].WEIRD; return lines[Math.abs(Number(seed)||0)%lines.length]; }
const EVENT_EMOJIS = { flooded_soi:'💧', flash_flood:'🌊', monsoon_burst:'🌧️', monitor_lizard:'🦎', pigeon_apocalypse:'🐦', cat_in_road:'🐈', chicken_escape:'🐔', pig_escape:'🐖', elephant_traffic:'🐘', traffic_gridlock:'🚗', motorbike_swarm:'🏍️', engine_sputter:'💨', running_on_fumes:'⛽', rival_tuktuk:'🏁', street_food_stop:'🍜', songkran_ambush:'💦', ghost_passenger:'👻', lucky_shrine:'✨', movie_set_blockade:'🎬' };
export function getEventEmoji(eventId) { return EVENT_EMOJIS[eventId] || '💥'; }

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function weightedPick(items, random = Math.random) {
  const valid = items.filter((item) => Number(item.weight) > 0);
  const total = valid.reduce((sum, item) => sum + Number(item.weight), 0);
  let cursor = random() * total;
  return valid.find((item) => (cursor -= Number(item.weight)) <= 0) || valid[valid.length - 1];
}
export function getEligibleEvents(trip, events = CRAZY_EVENTS) {
  if (trip?.eventResolved) return [];
  const history = new Set((trip?.eventHistory || []).map((entry) => entry.eventId));
  return events.filter((item) => {
    const trigger = item.trigger || {};
    if (trip?.leg === 'PICKUP' && (item.type === 'PASSENGER' || item.tags?.includes('passenger'))) return false;
    const progress = Number(trip?.progress || 0);
    return !(trigger.oncePerRide && history.has(item.id)) && progress >= (trigger.minRideProgress ?? 0) && progress <= (trigger.maxRideProgress ?? 1) && Number(trip?.remainingSeconds ?? 999999) >= (trigger.minRemainingSeconds ?? 0);
  });
}
export function shouldTriggerEvent(trip, random = Math.random) {
  if (!trip || trip.eventResolved || trip.activeEvent || trip.eventSchedule?.nextProgress == null) return false;
  return trip.progress >= trip.eventSchedule.nextProgress;
}
export function scheduleEventsForRide(trip, random = Math.random) {
  const first = clamp(.22 + random() * .55, .2, .82);
  return { ...(trip || {}), eventSchedule: { leg: random() < .5 ? 'PICKUP' : 'RIDE', nextProgress: first } };
}
export function chooseOutcome(outcomes, random = Math.random) { return weightedPick(outcomes, random); }
export function chooseAgentChoice(event, personality = {}, random = Math.random) {
  const scored = (event.choices || []).map((item) => ({ item, score: Object.entries(item.agentBias || {}).reduce((sum, [key, value]) => sum + Number(value) * Number(personality[key] || 0), 0) + random() * .05 }));
  return scored.sort((a, b) => b.score - a.score)[0]?.item || event.choices?.[0];
}
export function applyEventEffects(player, effects = {}) {
  const trip = player.activeTrip;
  if (!trip) return player;
  const timeChange = Number(effects.timeSeconds || 0);
  trip.eventTimeOffset = Number(trip.eventTimeOffset || 0) + timeChange;
  trip.remainingSeconds = Math.max(0, Number(trip.remainingSeconds || 0) - Number(effects.timeSeconds || 0));
  // Longer/shorter events change the simulated route fuel budget too. The map
  // geometry remains unchanged; the active ride simply consumes fuel over the
  // adjusted duration.
  if (timeChange) {
    const fuelAdjustment = timeChange / 12;
    trip.fuelCost = Math.max(1, Number(trip.fuelCost || 1) + fuelAdjustment);
    trip.totalFuelCost = Math.max(1, Number(trip.totalFuelCost || trip.fuelCost) + fuelAdjustment);
  }
  if (Number(effects.stallSeconds || 0) > 0) trip.eventStallUntil = Date.now() + Number(effects.stallSeconds) * 1000;
  player.fuel = clamp(Number(player.fuel || 0) + Number(effects.fuel || 0), 0, 100);
  player.points = Math.max(0, Number(player.points || 0) + Number(effects.crazy || 0));
  trip.tip = Number(trip.tip || 0) + Number(effects.tip || 0);
  const moodDelta = Number(effects.timeSeconds || 0) > 0
    ? -Math.max(6, Math.min(24, Math.round(Number(effects.timeSeconds) / 2)))
    : Number(effects.timeSeconds || 0) < 0
      ? Math.min(18, Math.max(6, Math.round(Math.abs(Number(effects.timeSeconds)) / 2)))
      : Number(effects.crazy || 0) > 0 ? 10 : 0;
  trip.passengerMood = Math.max(0, Math.min(100, Number(trip.passengerMood ?? 50) + moodDelta));
  trip.passengerMoodLabel = getPassengerMoodLabel(trip.passengerMood);
  return player;
}
export function resolveEvent(player, event, choiceId, random = Math.random) {
  const selected = choiceId ? event.choices?.find((item) => item.id === choiceId) : null;
  const outcome = chooseOutcome(selected?.outcomes || event.outcomes || [], random);
  if (!outcome) return null;
  applyEventEffects(player, outcome.effects);
  const trip = player.activeTrip;
  trip.eventHistory = [...(trip.eventHistory || []), { eventId: event.id, triggeredAtProgress: trip.progress || 0, choiceId, outcomeId: outcome.id, effects: outcome.effects, timestamp: Date.now() }];
  trip.passengerEventEmoji = getEventEmoji(event.id);
  trip.eventResolved = true;
  return outcome;
}
