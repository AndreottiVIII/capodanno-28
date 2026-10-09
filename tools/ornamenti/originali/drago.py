import math, sys
out = sys.argv[1]
def cub(p0,c1,c2,p1,t):
    u=1-t
    return (u**3*p0[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t**3*p1[0], u**3*p0[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t**3*p1[1])
segs=[((70,90),(120,30),(190,40),(200,100)),((200,100),(210,160),(260,200),(320,170)),((320,170),(380,140),(380,90),(350,60))]
pts=[]
for s in segs:
    for i in range(60):
        pts.append(cub(*s,i/60))
pts.append(segs[-1][3])
# arc-length resample
L=[0]
for i in range(1,len(pts)): L.append(L[-1]+math.dist(pts[i],pts[i-1]))
tot=L[-1]; N=180
res=[]; j=0
for k in range(N+1):
    d=tot*k/N
    while L[j+1]<d and j<len(L)-2: j+=1
    f=(d-L[j])/max(1e-9,L[j+1]-L[j]); res.append((pts[j][0]+f*(pts[j+1][0]-pts[j][0]), pts[j][1]+f*(pts[j+1][1]-pts[j][1])))
pts=res
def norm(i):
    a=pts[max(0,i-1)]; b=pts[min(len(pts)-1,i+1)]
    dx,dy=b[0]-a[0],b[1]-a[1]; l=math.hypot(dx,dy) or 1
    return (dy/l, -dx/l)
def w(i): t=i/N; return 15*(1-t)**0.8+2.5
P=lambda p:f"{p[0]:.1f} {p[1]:.1f}"
L1=[];L2=[];B=[]
for i,p in enumerate(pts):
    n=norm(i); ww=w(i)
    L1.append((p[0]+n[0]*ww,p[1]+n[1]*ww)); L2.append((p[0]-n[0]*ww,p[1]-n[1]*ww)); B.append((p[0]-n[0]*ww*0.15,p[1]-n[1]*ww*0.15))
body="M"+" L".join(P(q) for q in L1+L2[::-1])+" Z"
belly="M"+" L".join(P(q) for q in B+L2[::-1])+" Z"
g=[]
# dorsal fins on L1 side
fins=[]
for i in range(6,N-12,7):
    n=norm(i); p=L1[i]; a=pts[i-3]; b=pts[i+3]
    ww=w(i)*0.9+3
    tip=(p[0]+n[0]*ww,p[1]+n[1]*ww)
    da=(a[0]+norm(i-3)[0]*w(i-3),a[1]+norm(i-3)[1]*w(i-3)); db=(b[0]+norm(i+3)[0]*w(i+3),b[1]+norm(i+3)[1]*w(i+3))
    fins.append(f"M{P(da)} Q{P(tip)} {P(tip)} L{P(db)} Z")
# scales: small arcs
scales=[]
for i in range(4,N-6,3):
    for off in (0.55,):
        n=norm(i); ww=w(i)*off; p=pts[i]
        c=(p[0]+n[0]*ww,p[1]+n[1]*ww); a=pts[i-2]; r=w(i)*0.32
        scales.append(f"M{c[0]-r*n[1]:.1f} {c[1]+r*n[0]:.1f} A{r:.1f} {r:.1f} 0 0 1 {c[0]+r*n[1]:.1f} {c[1]-r*n[0]:.1f}")
plates=[]
for i in range(3,N-4,4):
    plates.append(f"M{P(B[i])} L{P(L2[i])}")
# legs
legs=[]
for i in (28,70,108,140):
    n=norm(i); p=L2[i]; ww=w(i)
    knee=(p[0]-n[0]*22+ (pts[i+5][0]-pts[i][0])*1.2, p[1]-n[1]*22+(pts[i+5][1]-pts[i][1])*1.2)
    foot=(knee[0]-n[0]*14-(pts[i+5][0]-pts[i][0])*0.8, knee[1]-n[1]*14-(pts[i+5][1]-pts[i][1])*0.8)
    lw=max(4,ww*0.55)
    legs.append(f'<path d="M{P(p)} Q{P(knee)} {P(foot)}" stroke="#7A4E1C" stroke-width="{lw+2.4:.1f}" fill="none" stroke-linecap="round"/>')
    legs.append(f'<path d="M{P(p)} Q{P(knee)} {P(foot)}" stroke="#E2B05C" stroke-width="{lw:.1f}" fill="none" stroke-linecap="round"/>')
    # claws
    ang=math.atan2(foot[1]-knee[1],foot[0]-knee[0])
    for da in (-0.8,0,0.8):
        a=ang+da; e=(foot[0]+math.cos(a)*9,foot[1]+math.sin(a)*9); c=(foot[0]+math.cos(a+0.5)*11,foot[1]+math.sin(a+0.5)*11)
        legs.append(f'<path d="M{P(foot)} Q{P(e)} {P(c)}" stroke="#F4EEE2" stroke-width="2" fill="none" stroke-linecap="round"/>')
    # elbow flame
    fl=(knee[0]+n[0]*2+ (pts[i][0]-pts[i+5][0])*1.6, knee[1]+n[1]*2+(pts[i][1]-pts[i+5][1])*1.6)
    legs.append(f'<path d="M{P(knee)} Q{fl[0]+4:.1f} {fl[1]-6:.1f} {P(fl)} Q{fl[0]-2:.1f} {fl[1]+6:.1f} {knee[0]+3:.1f} {knee[1]+3:.1f} Z" fill="#C8402A"/>')
# tail flame at end
e=pts[-1]
tail=f'<path d="M{e[0]:.1f} {e[1]:.1f} C {e[0]-10:.1f} {e[1]-24:.1f}, {e[0]+14:.1f} {e[1]-34:.1f}, {e[0]+6:.1f} {e[1]-52:.1f} C {e[0]+22:.1f} {e[1]-36:.1f}, {e[0]+20:.1f} {e[1]-14:.1f}, {e[0]+30:.1f} {e[1]-20:.1f} C {e[0]+26:.1f} {e[1]-4:.1f}, {e[0]+10:.1f} {e[1]+4:.1f}, {e[0]:.1f} {e[1]:.1f} Z" fill="#C8402A" stroke="#7A2418" stroke-width="1"/>'
cloud='''<g id="nube"><path d="M0 0 C -7 -16, 13 -24, 19 -9 C 22 -27, 48 -26, 46 -6 C 60 -13, 70 4, 56 12 L 2 12 C -10 12, -12 1, 0 0 Z" fill="#86BBA2" stroke="#2F5E4F" stroke-width="1.4"/><path d="M8 4 C 8 -4, 18 -4, 18 3 M28 2 C 28 -9, 42 -9, 42 1" fill="none" stroke="#2F5E4F" stroke-width="1.3"/></g>'''
head='''
<g transform="translate(70 90)">
  <path d="M8 -20 C 22 -40, 36 -34, 30 -22 C 46 -34, 54 -20, 40 -12 C 56 -10, 54 6, 38 4 C 50 16, 34 26, 26 14 Z" fill="#C8402A" stroke="#7A2418" stroke-width="1"/>
  <path d="M6 -16 C 14 -34, 30 -46, 48 -50 M24 -36 C 30 -40, 34 -46, 34 -54" fill="none" stroke="#F4EEE2" stroke-width="4" stroke-linecap="round"/>
  <path d="M14 -10 C 4 -26, -24 -26, -38 -14 L -56 -12 C -64 -11, -64 -1, -56 0 L -36 2 C -26 12, 2 14, 14 6 Z" fill="#E2B05C" stroke="#7A4E1C" stroke-width="1.6"/>
  <path d="M-36 2 L -58 14 C -46 22, -24 18, -12 10 Z" fill="#E2B05C" stroke="#7A4E1C" stroke-width="1.6"/>
  <path d="M-36 2 L -56 10 L -40 8 L -50 14 L -30 8 Z" fill="#8E2A45"/>
  <path d="M-52 -1 L -48 4 L -44 0 M-44 7 L -40 12 L -37 6" fill="none" stroke="#F4EEE2" stroke-width="1.4"/>
  <path d="M-30 -20 C -22 -28, -12 -26, -6 -20" fill="none" stroke="#7A4E1C" stroke-width="2.2"/>
  <circle cx="-18" cy="-14" r="5.2" fill="#F4EEE2" stroke="#7A4E1C" stroke-width="1"/><circle cx="-19" cy="-14" r="2.6" fill="#1A1410"/>
  <path d="M-58 -10 C -74 -22, -92 -10, -86 4 C -82 14, -96 22, -104 16" fill="none" stroke="#E2B05C" stroke-width="1.6"/>
  <path d="M-52 12 C -62 28, -82 30, -84 44 C -86 54, -100 56, -106 50" fill="none" stroke="#E2B05C" stroke-width="1.6"/>
  <circle cx="-56" cy="-8" r="1.6" fill="#7A4E1C"/>
</g>'''
pearl='''
<g transform="translate(-22 118)">
  <path d="M0 -26 C 6 -14, 14 -18, 12 -30 C 22 -18, 22 -8, 18 -2 C 28 -6, 30 4, 26 12 C 34 14, 30 26, 20 24 C 22 34, 10 36, 4 28 C -2 38, -16 34, -14 24 C -26 28, -30 16, -22 10 C -32 4, -26 -8, -16 -6 C -22 -18, -10 -24, -4 -14 Z" fill="#E9733F" stroke="#7A2418" stroke-width="1"/>
  <circle r="12" fill="#F4EEE2" stroke="#C99A5B" stroke-width="1.4"/>
  <path d="M0 0 C 0 -5, 6 -5, 6 0 C 6 6, -4 7, -6 0 C -7 -8, 4 -11, 9 -4" fill="none" stroke="#C99A5B" stroke-width="1.3"/>
</g>'''
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 460 330" width="460" height="330">
<defs>{cloud}</defs>
<use xlink:href="#nube" transform="translate(300 250) scale(1.4)"/>
<use xlink:href="#nube" transform="translate(150 60) scale(1.1)"/>
<use xlink:href="#nube" transform="translate(390 40) scale(.9)"/>
<use xlink:href="#nube" transform="translate(30 250) scale(1.2)"/>
<g transform="translate(60 30)">
{''.join(legs[i] for i in range(len(legs)))}
<path d="{''.join(fins)}" fill="#C8402A" stroke="#7A2418" stroke-width=".8"/>
{tail}
<path d="{body}" fill="#E2B05C" stroke="#7A4E1C" stroke-width="1.6"/>
<path d="{belly}" fill="#F3D79A"/>
<path d="{' '.join(plates)}" stroke="#C99A5B" stroke-width="1" fill="none"/>
<path d="{' '.join(scales)}" stroke="#9A6A26" stroke-width="1" fill="none"/>
<path d="{body}" fill="none" stroke="#7A4E1C" stroke-width="1.6"/>
{head}
{pearl}
</g>
<use xlink:href="#nube" transform="translate(205 205) scale(1)"/>
</svg>'''
open(out,'w').write(svg)
