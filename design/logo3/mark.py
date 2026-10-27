"""Vectorisation G, round 3: a rounded-square G (instrument logic, like B612), raster on the left, vector on the
right, the bar ending on a survey point. 256 grid, pixel cell 16, stroke 32 (two cells)."""
import math
X0, Y0, X1, Y1 = 24, 24, 232, 232      # outer box
T = 32                                   # stroke
RO, RI = 80, 48                          # outer and inner corner radii (RI = RO - T)
U = 16                                   # pixel cell
SEAM = 120                               # raster to the left of this line, vector to the right
f = lambda v: f"{v:g}"

def inside_rr(px, py, x0, y0, x1, y1, r):
    dx = max(x0 + r - px, 0, px - (x1 - r)); dy = max(y0 + r - py, 0, py - (y1 - r))
    if px < x0 or px > x1 or py < y0 or py > y1: return False
    return dx * dx + dy * dy <= r * r if dx > 0 and dy > 0 else True

cells = []
for j in range((Y1 - Y0) // U):
    for i in range((SEAM - X0) // U):
        cx, cy = X0 + (i + .5) * U, Y0 + (j + .5) * U
        if inside_rr(cx, cy, X0, Y0, X1, Y1, RO) and not inside_rr(cx, cy, X0 + T, Y0 + T, X1 - T, Y1 - T, RI):
            cells.append((X0 + i * U, Y0 + j * U))
# trace the raster cells as one outline (no hairline seams between rows): walk the boundary edges of the cell set
cellset = {((x - X0) // U, (y - Y0) // U) for x, y in cells}
edges = {}
for (i, j) in cellset:
    for (di, dj, a, b) in ((0, -1, (i, j), (i + 1, j)), (1, 0, (i + 1, j), (i + 1, j + 1)),
                           (0, 1, (i + 1, j + 1), (i, j + 1)), (-1, 0, (i, j + 1), (i, j))):
        if (i + di, j + dj) not in cellset: edges[a] = b          # clockwise around filled cells
raster = ""
while edges:
    start, nxt = next(iter(edges.items())); loop = [start]; cur = start
    while True:
        nxt = edges.pop(cur); 
        if nxt == start: break
        loop.append(nxt); cur = nxt
    # drop collinear points
    pts = [p for k, p in enumerate(loop) if not ((loop[k - 1][0] == p[0] == loop[(k + 1) % len(loop)][0]) or (loop[k - 1][1] == p[1] == loop[(k + 1) % len(loop)][1]))]
    raster += "M" + "L".join(f"{X0 + x * U} {Y0 + y * U}" for x, y in pts) + "Z"
top = f"M{SEAM - 2} {Y0}H184V{Y0 + T}H{SEAM - 2}Z"                    # top stroke, flat terminal at x = 184
c = X1 - RO
bottom = (f"M{SEAM - 2} {Y1}H{c}A{RO} {RO} 0 0 0 {X1} {c}V124H{X1 - T}V{c}"
          f"A{RI} {RI} 0 0 1 {c} {Y1 - T}H{SEAM - 2}Z")            # bottom stroke, corner, right side up to the bar
bar = f"M152 124H{X1}V156H152Z"
px, py, pr = 148, 140, 26                                       # the survey point at the end of the bar
point = f"M{px - pr} {py}A{pr} {pr} 0 1 0 {px + pr} {py}A{pr} {pr} 0 1 0 {px - pr} {py}Z"
parts = {"raster": raster, "top": top, "bottom": bottom, "bar": bar, "point": point}
svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Geomatic Club</title>'
       + "".join(f'<path data-part="{k}" d="{d}"/>' for k, d in parts.items()) + "</svg>\n")
open("mark.svg", "w").write(svg)
stepped = sum(1 for _ in cells)
print("cells", stepped)
