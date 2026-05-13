
const TZ = 'America/Mexico_City';


const getMxOffsetMinutes = (utcDate: Date): number => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(utcDate);
  const get = (t: string) => parts.find(p => p.type === t)!.value;
  const asUtcMs = Date.UTC(
    Number(get('year')),
    Number(get('month')) - 1,
    Number(get('day')),
    Number(get('hour')) === 24 ? 0 : Number(get('hour')),
    Number(get('minute')),
    Number(get('second')),
  );
  return Math.round((asUtcMs - utcDate.getTime()) / 60000);
};


export const mxLocalToUtc = (dateStr: string, hh: number, mm: number): Date => {

  const [y, mo, d] = dateStr.split('-').map(Number);
  const naiveUtc = new Date(Date.UTC(y, mo - 1, d, hh, mm, 0));
  const offset = getMxOffsetMinutes(naiveUtc);
  return new Date(naiveUtc.getTime() - offset * 60000);
};

export const mxDayOfWeek = (dateStr: string): number => {
  const d = mxLocalToUtc(dateStr, 12, 0);

  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' });
  const w = dtf.format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[w];
};


export const nowInMx = (): Date => {
  const now = new Date();
  const offset = getMxOffsetMinutes(now);
  return new Date(now.getTime() + offset * 60000);
};