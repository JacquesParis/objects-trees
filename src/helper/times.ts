export function dhm(ms: number): string {
  const days: number = Math.floor(ms / (24 * 60 * 60 * 1000));
  const daysMs: number = ms % (24 * 60 * 60 * 1000);
  const hours: number = Math.floor(daysMs / (60 * 60 * 1000));
  const hoursMs: number = ms % (60 * 60 * 1000);
  const minutes: number = Math.floor(hoursMs / (60 * 1000));
  const minutesMs: number = ms % (60 * 1000);
  const sec: number = Math.floor(minutesMs / 1000);
  const secMs: number = ms % 1000;
  return days + ':' + hours + ':' + minutes + ':' + sec + ':' + secMs;
}

export function diffDate(from: Date, to: Date): number {
  return to.getTime() - from.getTime();
}

export function dhmDiffDate(from: Date, to: Date): string {
  return dhm(diffDate(from, to));
}
