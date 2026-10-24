// US Eastern clock and cycle ids (AGENTS.md 5.1). A cycle starts at every even hour ET.
const TZ = 'America/New_York';
const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export const WORK_END = 25;
export const REVIEW_START = 30;
export const REVIEW_END = 45;

export function etParts(d) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: p.year, m: p.month, d: p.day, H: Number(p.hour) % 24, M: Number(p.minute) };
}

/** { id: 'YYYY-MM-DD-HH', minute: minutes since the cycle started (0–119) } */
export function cycleAt(d) {
  const p = etParts(d);
  const h = p.H - (p.H % 2);
  return { id: `${p.y}-${p.m}-${p.d}-${String(h).padStart(2, '0')}`, minute: (p.H - h) * 60 + p.M, index: Number(p.d) * 12 + h / 2 };
}

export function nextCycleId(d) {
  const cur = cycleAt(d).id;
  let t = d.getTime();
  while (cycleAt(new Date(t)).id === cur) t += 5 * 60000;
  return cycleAt(new Date(t)).id;
}

/** Stable small number per cycle id, used to rotate which bot goes first. */
export function cycleOrdinal(id) {
  const [y, m, d, h] = id.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000) * 12 + h / 2;
}
