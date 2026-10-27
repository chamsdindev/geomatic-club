"use client";

import { useSyncExternalStore } from "react";
import { copy } from "@/lib/copy";
import { frMetres, frOne } from "@/lib/point";
import { setSoundEnabled, soundEnabled, subscribeSound } from "@/lib/sound";
import { MARK, RASTER_CELLS, RIGHT_RASTER } from "@/components/brand/paths";
import { DotMatrix } from "./DotMatrix";
import { GROUPS, LEVELS, SATS, SKY, satPosition, satShape } from "./sky";

const L0 = LEVELS[0];

function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, soundEnabled, () => true);
  return (
    <button type="button" className="sound" aria-pressed={on} aria-label={copy.lcd.soundToggle} title={on ? copy.lcd.soundOn : copy.lcd.soundOff} onClick={() => setSoundEnabled(!on)}>
      <svg viewBox="0 0 20 16" width="20" height="16" aria-hidden="true">
        <path d="M2 5.5h3.5L10 2v12l-4.5-3.5H2z" fill="currentColor" />
        {on ? <path d="M13 5c1.2 1.6 1.2 4.4 0 6M15.5 3c2.2 2.8 2.2 7.2 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" /> : <path d="M13 5.5l5 5M18 5.5l-5 5" stroke="currentColor" strokeWidth="1.5" />}
      </svg>
    </button>
  );
}

function SkyPlot() {
  const { c, r } = SKY;
  const first = new Set<number>(GROUPS[0]);
  return (
    <svg className="sky" viewBox="-16 -16 252 252" data-sky aria-hidden="true">
      {[0, 30, 60].map((e) => <circle key={e} className="ring" data-ring cx={c} cy={c} r={(r * (90 - e)) / 90} strokeDasharray={e ? "2 3" : undefined} />)}
      <path className="axis" data-axis d={`M${c} ${c - r}V${c + r}`} />
      <path className="axis" data-axis d={`M${c - r} ${c}H${c + r}`} />
      <text x={c} y={c - r - 5} textAnchor="middle">N</text>
      <text x={c + r + 9} y={c + 3} textAnchor="middle">E</text>
      <text x={c} y={c + r + 13} textAnchor="middle">S</text>
      <text x={c - r - 9} y={c + 3} textAnchor="middle">O</text>
      {SATS.map(([id, az, el], i) => {
        const p = satPosition(az, el);
        const on = first.has(i);
        return (
          <g key={id} data-sat={i} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`} className={on ? "sat on" : "sat"}>
            <path d={satShape(id)} />
            <text x={8} y={-6}>{id}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** The receiver's screen. Its readouts are written by the motion layer, never by React after the first render. */
export function Lcd() {
  return (
    <section className="bezel" aria-label="Écran du récepteur" translate="no">
      <div className="lcd" data-lcd>
        <div className="statusbar">
          <span title={copy.lcd.satellites}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 11 11 3M5 5l4 4M2 7l5 5M7 2l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
            <b data-satn>{GROUPS[0].length}</b>
          </span>
          <span><svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true"><path d="M1 11h2V8H1zM5 11h2V6H5zM9 11h2V3H9zM13 11h2V0h-2z" fill="currentColor" /></svg>RTK</span>
          <span data-clock>--:--</span>
          <SoundToggle />
        </div>

        <div className="boot" data-boot aria-hidden="true">
          <svg viewBox="0 0 256 256" width="120" height="120">
            <g data-boot-cells>{RASTER_CELLS.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width={16} height={16} />)}</g>
            {RIGHT_RASTER.map((d, i) => <path key={i} data-boot-right={i} d={d} />)}
            <path data-boot-vec="top" d={MARK.top} />
            <path data-boot-vec="bottom" d={MARK.bottom} />
            <path data-boot-vec="bar" d={MARK.bar} />
            <path data-boot-vec="point" d={MARK.point} />
          </svg>
        </div>

        <div className="lcd-body" data-body>
          <div className="state-row">
            <span className="state-wrap">
              <span className="state" data-state>{L0.label}</span>
              <span className="fix" data-fix><DotMatrix text="FIX" dot={8} /></span>
            </span>
            <span data-pdop>PDOP {frOne(L0.pdop)}</span>
          </div>
          <ol className="ladder" data-ladder aria-label="Qualité de la position">
            {copy.lcd.states.map((s, k) => <li key={s} aria-current={k === 0 ? "step" : undefined}><b data-step={k} className={k === 0 ? "on" : undefined} /><span>{s}</span></li>)}
          </ol>
          <div className="mid">
            <SkyPlot />
            <div className="side">
              <div className="vial" aria-hidden="true"><div className="bubble" data-bubble /></div>
              <p className="prec" data-prec>H {frMetres(L0.h)}<br />V {frMetres(L0.v)}</p>
            </div>
          </div>
          <div className="foot">
            <span data-msg role="status">{copy.lcd.searching}</span>
            <span data-epoch>{copy.lcd.epoch} --:--</span>
          </div>
        </div>
      </div>
    </section>
  );
}
