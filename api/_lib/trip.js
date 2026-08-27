function projectTrip({ tripStartedAt, now = Date.now(), baseDurationSeconds, timeModifierSeconds = 0, progress = 0, elapsedSeconds }) {
  const base = Math.max(0, Number(baseDurationSeconds) || 0);
  const duration = Math.max(0, base + (Number(timeModifierSeconds) || 0));
  const elapsed = Math.max(0, elapsedSeconds == null ? (new Date(now).getTime() - new Date(tripStartedAt).getTime()) / 1000 : Number(elapsedSeconds));
  const priorDuration = Math.max(0, base - Math.max(0, Number(timeModifierSeconds) || 0));
  const completed = Math.max(Math.max(0, Number(progress) || 0) * priorDuration, elapsed);
  const derivedProgress = duration ? Math.min(1, completed / duration) : 1;
  const remainingSeconds = Math.max(0, duration - completed);
  return { durationSeconds: duration, progress: derivedProgress, remainingSeconds, completed: remainingSeconds === 0, projectedArrival: new Date(new Date(now).getTime() + remainingSeconds * 1000).toISOString() };
}
module.exports = { projectTrip };
