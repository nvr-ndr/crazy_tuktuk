const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

function bangkokDateKey(value = new Date()) {
  const date = new Date(value);
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

function bangkokDayWindow(value = new Date()) {
  const key = bangkokDateKey(value);
  const start = new Date(`${key}T00:00:00+07:00`);
  return { key, start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

module.exports = { BANGKOK_OFFSET_MS, bangkokDateKey, bangkokDayWindow };
