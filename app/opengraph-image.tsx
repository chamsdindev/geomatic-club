import { ImageResponse } from "next/og";
import { copy } from "@/lib/copy";
import { cardFonts, fixUri, INK, markUri, SCREEN, wordmarkRatio, wordmarkUri, YELLOW } from "@/lib/card";

export const alt = "Geomatic Club : réserve ta place, ton point est fixé sur la carte.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const wr = wordmarkRatio();
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: YELLOW, color: INK, fontFamily: "B612", padding: 64, gap: 56, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src={markUri()} width={96} height={96} alt="" />
            <img src={wordmarkUri()} height={58} width={58 * wr} alt="" />
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, lineHeight: 1.15, letterSpacing: -1 }}>{copy.lead}</div>
          <div style={{ display: "flex", fontSize: 28 }}>{copy.receiver}</div>
        </div>
        <div style={{ display: "flex", background: INK, borderRadius: 36, padding: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 420, background: INK, border: `4px solid ${SCREEN}`, borderRadius: 24, padding: 28, color: SCREEN, gap: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, borderBottom: `3px solid ${SCREEN}`, paddingBottom: 10 }}><span>14 satellites</span><span>RTK</span></div>
            <img src={fixUri()} width={300} height={124} alt="" />
            <div style={{ display: "flex", gap: 8 }}>
              {copy.lcd.states.map((s) => <div key={s} style={{ display: "flex", flex: 1, height: 36, background: SCREEN }} />)}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await cardFonts() },
  );
}
