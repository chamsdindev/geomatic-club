import { FIX, PX_PER_KM } from "./config";

const KM_PER_DEG_LAT = 110.574;
const kmPerDegLon = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180);

/** Screen position → latitude/longitude, around the fix point, at a zoom. */
export function toLatLon(x: number, y: number, fix: { x: number; y: number }, zoom: number) {
  const pxPerKm = PX_PER_KM * zoom;
  const lat = FIX.lat - (y - fix.y) / pxPerKm / KM_PER_DEG_LAT;
  const lon = FIX.lon + (x - fix.x) / pxPerKm / kmPerDegLon(FIX.lat);
  return { lat, lon };
}

/** Pixels between two graticule lines (at zoom 1). */
export function degreeToPx(deg: number) {
  return {
    lat: deg * KM_PER_DEG_LAT * PX_PER_KM,
    lon: deg * kmPerDegLon(FIX.lat) * PX_PER_KM,
  };
}

export const formatLat = (lat: number) => `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
export const formatLon = (lon: number) => `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "O"}`;

/** The scale bar's label for its 64 px at a zoom: « 500 m », « 210 m », « 1,2 km ». */
export function scaleLabel(zoom: number) {
  const metres = 500 / zoom;
  if (metres >= 1000) return `${(metres / 1000).toFixed(1).replace(".", ",")} km`;
  return `${Math.round(metres / 10) * 10} m`;
}
