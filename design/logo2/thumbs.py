import math
c=128
def P(a,r,cx=c,cy=c): t=math.radians(a); return (cx+r*math.cos(t), cy+r*math.sin(t))
f=lambda v: f"{v:.1f}"
def arc(r,a0,a1,sw=1):  # SVG arc from angle a0 to a1 going counter-clockwise visually (decreasing angle)
    x0,y0=P(a0,r); x1,y1=P(a1,r); large=1 if (a0-a1)%360>180 else 0
    return f"M{f(x0)} {f(y0)}A{r} {r} 0 {large} 0 {f(x1)} {f(y1)}"
S=lambda d,w=14,extra="": f'<path d="{d}" fill="none" stroke="#000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="miter" {extra}/>'
F=lambda d,extra="": f'<path d="{d}" {extra}/>'
dot=lambda x,y,r: f'<circle cx="{f(x)}" cy="{f(y)}" r="{r}"/>'
T={}
# 1 Contour G: three nested G contours, the summit a dot
g=""
for r,w in [(104,12),(74,12),(44,12)]:
    g+=S(arc(r,-42,8)+f"M{f(P(8,r)[0])} {f(P(8,r)[1])}H{c+r*0.35}",w)
T["01 Courbes en G"]=g+dot(c+10,c+4,9)
# 2 Raster -> vector G: left half pixel steps, right half clean curve
u=24; cells=[(-2,-4),(-1,-4),(0,-4),(-3,-3),(-4,-2),(-4,-1),(-4,0),(-4,1),(-3,2),(-2,3),(-1,3),(0,3)]
g="".join(f'<rect x="{c+x*u}" y="{c+y*u}" width="{u}" height="{u}"/>' for x,y in cells)
g+=S(f"M{c+12} {c-84}A84 84 0 0 1 {c+84} {c-18}",24)+S(f"M{c+12} {c+84}A84 84 0 0 0 {c+84} {c+12}V{c}H{c+20}",24)
T["02 Raster puis vecteur"]=g
# 3 Traverse G: a closed survey traverse, stations as points
pts=[(196,74),(150,40),(82,52),(44,112),(60,180),(118,214),(186,190),(204,132),(142,132)]
d="M"+"L".join(f"{x} {y}" for x,y in pts)
T["03 Cheminement en G"]=S(d,12)+"".join(dot(x,y,12) for x,y in pts)
# 4 Hachure G: Swiss-style hachures along the bowl
g=""
for a in range(-40,-352,-9):
    x0,y0=P(a,74); x1,y1=P(a,108); g+=f'<path d="M{f(x0)} {f(y0)}L{f(x1)} {f(y1)}" stroke="#000" stroke-width="6"/>'
for x in range(150,234,9): g+=f'<path d="M{x} {c}V{c+30}" stroke="#000" stroke-width="6"/>'
T["04 Hachures en G"]=g
# 5 Meridian G: the G's spur is a north arrow
T["05 G méridien"]=S(arc(96,-50,0)+f"M{c+96} {c}H{c+20}",22)+F(f"M{c+56} {c-96} l20 -34 l20 34z",'transform="rotate(-38 '+str(c+76)+' '+str(c-110)+')"')
# 6 GC on a graticule: the letters drawn by parallels and meridians
g=S(arc(70,-40,40,1).replace("M","M",1),16,'transform="translate(-40 0)"')+S(arc(70,-40,40),16,'transform="translate(56 0)"')
g+="".join(S(f"M20 {y}Q128 {y-18} 236 {y}",2) for y in (70,128,186))+"".join(S(f"M{x} 20Q{x+(x-128)*0.1} 128 {x} 236",2) for x in (70,128,186))
T["06 GC sur graticule"]=g
# 7 Benchmark disk, simplified: disk, datum notch, centre point
T["07 Repère simplifié"]=F(f"M{c} 20A108 108 0 1 1 {c-0.1} 20Z M{c-58} {c}H{c+58}V{c+12}H{c-58}Z M{c-12} {c+60}A12 12 0 1 0 {c+12} {c+60}A12 12 0 1 0 {c-12} {c+60}Z",'fill-rule="evenodd"')
# 8 Pixel G with one vector point
G5=[".####","#....","#.###","#...#",".###."]; u=34; g=""
for j,row in enumerate(G5):
    for i,ch in enumerate(row):
        if ch=="#": g+=(dot(c-85+i*u+17,c-85+j*u+17,17) if (i,j)==(4,3) else f'<rect x="{c-85+i*u}" y="{c-85+j*u}" width="{u}" height="{u}"/>')
T["08 Pixels et un point"]=g
# 9 Nested GC rings
T["09 C qui enferme un G"]=S(arc(104,-40,40),18)+S(arc(62,-45,10)+f"M{f(P(10,62)[0])} {f(P(10,62)[1])}H{c+20}",18)
# 10 Scanline G: LiDAR rows, the G as their lengths
rows=[(40,150,200),(60,92,212),(80,64,124),(100,52,104),(120,48,100),(140,48,100),(160,52,104),(180,64,212),(200,92,212),(220,150,200)]
g="".join(f'<rect x="{a}" y="{y-6}" width="{b-a}" height="12"/>' for y,a,b in rows)
g+='<rect x="140" y="134" width="72" height="12"/><rect x="200" y="134" width="12" height="52"/>'
T["10 Lignes de balayage"]=g
# 11 Sky plot G: satellites along a G
g=S(f"M{c} 20A108 108 0 1 1 {c-0.1} 20",2)+S(f"M{c} 56A72 72 0 1 1 {c-0.1} 56",2,'stroke-dasharray="4 6"')
for a in range(-50,-330,-35): x,y=P(a,90); g+=f'<rect x="{f(x-11)}" y="{f(y-11)}" width="22" height="22"/>'
g+=f'<rect x="{c+50}" y="{c-11}" width="22" height="22"/><rect x="{c+14}" y="{c-11}" width="22" height="22"/>'
T["11 Ciel de satellites"]=g
# 12 Tripod with instrument
T["12 Trépied"]=S(f"M{c} 70L52 236M{c} 70L204 236M{c} 70V236",14)+F(f"M{c-36} 34h72v40h-72z")+dot(c,54,0)
# 13 Plumb bob over its point
T["13 Fil à plomb"]=S(f"M{c} 12V78",6)+F(f"M{c-36} 84h72l-36 112z")+S(f"M{c-50} 226H{c+50}M{c} 206V246",8)
# 14 Levelling staff E-graduation
g="".join(f'<path d="M96 {y}h64v12h-40v12h28v12h-28v12h40v12h-64z"/>' for y in (20,128))
g+='<rect x="96" y="20" width="12" height="216"/>'
T["14 Mire"]=g
# 15 Telescope over horizontal circle
T["15 Lunette"]=S(f"M{c} 40A88 40 0 1 1 {c-0.1} 40",12,'transform="translate(0 110)"')+F(f"M60 100h136v36H60z")+F(f"M{c-14} 136h28v54h-28z")
# 16 TIN G: triangles filling a G
tri=[]
ring=[P(a,r) for a in range(-40,-361,-40) for r in (70,108)]
g=""
for k in range(0,len(ring)-2,2):
    a,b,cc,d=ring[k],ring[k+1],ring[k+2],ring[k+3]
    g+=f'<path d="M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}L{f(d[0])} {f(d[1])}Z" stroke="#fff" stroke-width="3"/><path d="M{f(a[0])} {f(a[1])}L{f(d[0])} {f(d[1])}L{f(cc[0])} {f(cc[1])}Z" stroke="#fff" stroke-width="3"/>'
g+=f'<path d="M{c+20} {c}H{c+108}V{c+38}H{c+20}Z"/>'
T["16 TIN en G"]=g
# 17 Hill with an engraved G contour
T["17 Colline gravée"]=F(f"M16 220C60 120 100 44 {c} 44S196 120 240 220Z")+S(arc(46,-40,10,1).replace(f"M",f"M",1),9,f'stroke="#fff" transform="translate(0 40)"')
# 18 Coordinates monogram
T["18 36 N 10 E"]='<g font-family="Overpass" font-weight="800" font-size="104" letter-spacing="-4"><text x="18" y="118">36</text><text x="96" y="226">10</text></g><path d="M20 140H236" stroke="#000" stroke-width="6"/>'
# 19 Grid reference GC: two cells and a tick
T["19 Carroyage GC"]='<g fill="none" stroke="#000" stroke-width="6"><rect x="16" y="60" width="112" height="136"/><rect x="128" y="60" width="112" height="136"/></g><g font-family="Overpass" font-weight="800" font-size="104" text-anchor="middle"><text x="72" y="166">G</text><text x="184" y="166">C</text></g><path d="M128 40V216M108 128H148" stroke="#000" stroke-width="6"/>'
# 20 Corner-cube reflector (rejected on purpose: reads as a car badge)
T["20 Prisme"]=S(f"M{c} 20A108 108 0 1 1 {c-0.1} 20",14)+S(f"M{c} {c}V20M{c} {c}L{f(P(30,108)[0])} {f(P(30,108)[1])}M{c} {c}L{f(P(150,108)[0])} {f(P(150,108)[1])}",12)
for i,(name,body) in enumerate(T.items()):
    open(f"thumbs/{name[:2]}.svg","w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="#000"><title>{name[3:]}</title>{body}</svg>\n')
import json; json.dump(list(T.keys()),open("thumbs/names.json","w"),ensure_ascii=False)
print(len(T))
