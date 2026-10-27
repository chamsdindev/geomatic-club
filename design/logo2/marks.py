import math
c=128
f=lambda v: f"{v:.2f}".rstrip('0').rstrip('.')
def P(a,r): t=math.radians(a); return (c+r*math.cos(t), c+r*math.sin(t))
def poly(pts): return "M"+"L".join(f"{f(x)} {f(y)}" for x,y in pts)+"Z"
def circ(x,y,r,rev=False):
    s=0 if not rev else 1
    return f"M{f(x-r)} {f(y)}A{r} {r} 0 1 {s} {f(x+r)} {f(y)}A{r} {r} 0 1 {s} {f(x-r)} {f(y)}Z"
def svg(name, paths): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><title>Geomatic Club, {name}</title>'+"".join(f'<path d="{d}"{(" "+a) if a else ""}/>' for d,a in paths)+'</svg>\n'

# A. Vectorisation: left half raster cells, right half vector, on one ring (R 102, r 72, 30 thick)
R,r,u=102,72,10
cells=[]
for j in range(-11,11):
    for i in range(-11,0):
        cx,cy=c+(i+.5)*u, c+(j+.5)*u
        d=math.hypot(cx-c,cy-c)
        if r+1<=d<=R-1: cells.append((c+i*u,c+j*u))
raster="".join(f"M{f(x)} {f(y)}h{u}v{u}h-{u}Z" for x,y in cells)
o1,o2,i2,i1=P(-90,R),P(-36,R),P(-36,r),P(-90,r)
top=f"M{f(o1[0])} {f(o1[1])}A{R} {R} 0 0 1 {f(o2[0])} {f(o2[1])}L{f(i2[0])} {f(i2[1])}A{r} {r} 0 0 0 {f(i1[0])} {f(i1[1])}Z"
b1,b2,bi2,bi1=P(90,R),P(4,R),P(4,r),P(90,r)
bot=f"M{f(b1[0])} {f(b1[1])}A{R} {R} 0 0 0 {f(b2[0])} {f(b2[1])}L{f(bi2[0])} {f(bi2[1])}A{r} {r} 0 0 1 {f(bi1[0])} {f(bi1[1])}Z"
bar=f"M{c+14} {c-6}H{c+R}V{c+24}H{c+14}Z"
open("final/a-vectorisation.svg","w").write(svg("Vectorisation",[(raster,""),(top,""),(bot,""),(bar,"")]))

# B. Cheminement: an open traverse that closes on a known point (the bar's end)
Rb=100; angs=[-22.5,-67.5,-112.5,-157.5,157.5,112.5,67.5,22.5]
st=[P(a,Rb) for a in angs]
st.append((st[-1][0],c))      # up to the bar's level: a vertical leg
st.append((c+20,c))           # then west to the known point: a horizontal leg
w=8
legs=[]
for (ax,ay),(bx,by) in zip(st,st[1:]):
    dx,dy=bx-ax,by-ay; L=math.hypot(dx,dy); nx,ny=-dy/L*w,dx/L*w
    legs.append(poly([(ax+nx,ay+ny),(bx+nx,by+ny),(bx-nx,by-ny),(ax-nx,ay-ny)]))
paths=[(l,"") for l in legs]+[(circ(x,y,15.5),"") for x,y in st[:-1]]
kx,ky=st[-1]
paths.append((circ(kx,ky,22)+circ(kx,ky,13,True),""))  # the known point: a ring...
paths.append((circ(kx,ky,6.5),""))                     # ...and its centre
open("final/b-cheminement.svg","w").write(svg("Cheminement",paths))

# C. Hachures: Swiss rock hachures, thin where the north-west light falls, thick in shadow
Rin,Rout=68,110
ps=[]
a=-38.0
while a>-340:
    light=0.5-0.5*math.cos(math.radians(a-(-135)))   # 0 facing the light (NW), 1 in shadow (SE)
    wo=2.2+light*7.2; wi=wo*0.42
    t=math.radians(a); tx,ty=-math.sin(t),math.cos(t)
    x0,y0=P(a,Rin); x1,y1=P(a,Rout)
    ps.append(poly([(x0+tx*wi/2,y0+ty*wi/2),(x1+tx*wo/2,y1+ty*wo/2),(x1-tx*wo/2,y1-ty*wo/2),(x0-tx*wi/2,y0-ty*wi/2)]))
    a-=7.4
x=c+24
while x<=c+Rout-4:
    wo=7.4; wi=wo*.42
    ps.append(poly([(x-wi/2,c-2),(x+wi/2,c-2),(x+wo/2,c+30),(x-wo/2,c+30)]))
    x+=12
open("final/c-hachures.svg","w").write(svg("Hachures",[("".join(ps),"")]))
print("ok")
