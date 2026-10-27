/** The club's place: Tunis. Members' points are drawn around it. */
export const CLUB = { lat: 36.8065, lon: 10.1815 } as const;

/** Tunisia keeps UTC+1 all year. */
export const TIME_ZONE = "Africa/Tunis";
export const UTC_OFFSET = "+01:00";

/** Browser storage keys (per device, never needed for the site to work). */
export const STORAGE = { sound: "gc:sound", boot: "gc:boot" } as const;

/** The registration API: at most this many sends per IP in the window (a whole class can share one public IP). */
export const RATE_LIMIT = { max: 40, windowMs: 10 * 60 * 1000 } as const;

/** The same Prénom + Nom + date + heure sent again within this window gets the first answer back, no second email. */
export const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
