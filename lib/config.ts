/** Opening hours for a slot: first and last time, and the step between them. */
export const SLOT = { start: "08:00", end: "18:00", stepMinutes: 30 } as const;

/** The club's fix point: Tunis. */
export const FIX = { lat: 36.8065, lon: 10.1815 } as const;

export const TIME_ZONE = "Africa/Tunis";

/** Map scale at zoom 1: the scale bar's 64 px are 500 m. */
export const PX_PER_KM = 128;

/** Graticule spacing, in degrees. */
export const GRATICULE_STEP = 0.01;

/** sessionStorage key: the intro has played in this tab. */
export const INTRO_KEY = "gc:intro";
