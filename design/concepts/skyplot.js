// A GNSS sky plot: rings at 0/30/60° elevation, satellites by constellation (G GPS, E Galileo, R GLONASS, C BeiDou).
function skyplot(svg, n, opts = {}) {
  const sats = [["G05",40,62],["E11",120,40],["G13",200,25],["R03",300,55],["C21",250,70],["G24",20,15],["E04",160,78],["R17",330,22],["G29",80,30],["C08",210,48],["E30",280,12],["G02",140,10],["R10",50,50],["E19",350,40]];
  const R = 100, cx = 110, cy = 110; let s = `<g fill="none" stroke="#20231C" stroke-width="1">`;
  for (const e of [0, 30, 60]) s += `<circle cx="${cx}" cy="${cy}" r="${R * (90 - e) / 90}" ${e ? 'stroke-dasharray="2 3"' : ''}/>`;
  s += `<path d="M${cx} ${cy - R}V${cy + R}M${cx - R} ${cy}H${cx + R}" stroke-opacity=".5"/></g>`;
  s += `<g font-family="Chivo Mono" font-size="11" fill="#20231C" text-anchor="middle"><text x="${cx}" y="${cy - R - 4}">N</text><text x="${cx + R + 8}" y="${cy + 4}">E</text><text x="${cx}" y="${cy + R + 13}">S</text><text x="${cx - R - 8}" y="${cy + 4}">O</text></g>`;
  sats.forEach(([id, az, el], i) => {
    const r = R * (90 - el) / 90, a = az * Math.PI / 180, x = cx + r * Math.sin(a), y = cy - r * Math.cos(a); const on = i < n;
    const shape = id[0] === "G" ? `<rect x="${x - 5}" y="${y - 5}" width="10" height="10"` : id[0] === "E" ? `<circle cx="${x}" cy="${y}" r="5.5"` : id[0] === "R" ? `<path d="M${x} ${y - 6.5}L${x + 6} ${y + 4.5}H${x - 6}Z"` : `<path d="M${x} ${y - 6}L${x + 6} ${y}L${x} ${y + 6}L${x - 6} ${y}Z"`;
    s += `${shape} fill="${on ? "#20231C" : "none"}" stroke="#20231C" stroke-width="1.2" ${on ? "" : 'stroke-dasharray="2 2" opacity=".55"'}/>`;
    s += `<text x="${x + 8}" y="${y - 6}" font-family="Chivo Mono" font-size="9.5" fill="#20231C" opacity="${on ? 1 : .5}">${id}</text>`;
  });
  svg.setAttribute("viewBox", "-14 -16 248 252"); svg.innerHTML = s;
}
