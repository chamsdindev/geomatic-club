/** Opening hours for a slot: first and last time, and the step between them. */
export const SLOT = { start: "08:00", end: "18:00", stepMinutes: 30 } as const;

/** The club's place: Tunis. Members' points are drawn around it. */
export const CLUB = { lat: 36.8065, lon: 10.1815 } as const;

/** Tunisia keeps UTC+1 all year. */
export const TIME_ZONE = "Africa/Tunis";
export const UTC_OFFSET = "+01:00";

/** Browser storage keys (per device, never needed for the site to work). */
export const STORAGE = { sound: "gc:sound", boot: "gc:boot" } as const;

/** The registration API: at most this many sends per IP in the window. */
export const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 } as const;
