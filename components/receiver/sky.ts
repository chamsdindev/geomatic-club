/** The sky plot's satellites: id (constellation letter + PRN), azimuth, elevation. */
export const SATS = [
  ["G05", 40, 62], ["E11", 120, 40], ["R03", 300, 55], ["C21", 250, 70],
  ["G13", 200, 25], ["E04", 160, 78], ["G29", 80, 30],
  ["R17", 330, 22], ["C08", 210, 48], ["E19", 350, 40],
  ["G24", 20, 15], ["E30", 280, 12],
  ["G02", 140, 10], ["R10", 100, 52],
] as const;

/** Group 0 is acquired at boot (4 satellites: the minimum for a position); then one group per valid field. */
export const GROUPS = [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11], [12, 13]] as const;

/** What the receiver reads at each number of valid fields (0 to 4). */
export const LEVELS = [
  { state: 0, label: "Autonome", pdop: 6.8, h: 4.82, v: 7.1 },
  { state: 1, label: "DGNSS", pdop: 3.1, h: 0.62, v: 0.95 },
  { state: 2, label: "Flottant", pdop: 1.9, h: 0.081, v: 0.12 },
  { state: 2, label: "Flottant", pdop: 1.3, h: 0.031, v: 0.048 },
  { state: 2, label: "Prêt à fixer", pdop: 0.9, h: 0.014, v: 0.021 },
] as const;

export const SKY = { r: 100, c: 110 } as const;

export function satPosition(az: number, el: number) {
  const r = (SKY.r * (90 - el)) / 90;
  const a = (az * Math.PI) / 180;
  return { x: SKY.c + r * Math.sin(a), y: SKY.c - r * Math.cos(a) };
}

/** GPS square, Galileo circle, GLONASS triangle, BeiDou diamond (centred on 0,0). */
export function satShape(id: string) {
  switch (id[0]) {
    case "G": return "M-5-5h10v10h-10z";
    case "E": return "M-5.5 0a5.5 5.5 0 1 0 11 0a5.5 5.5 0 1 0-11 0";
    case "R": return "M0-6.5 6 4.5H-6z";
    default: return "M0-6 6 0 0 6-6 0z";
  }
}
