import math, sys
out=sys.argv[1]
cx=130; top=222
prof=[(0,24),(6,20),(26,13),(44,26),(62,42),(80,46),(100,38),(116,28),(122,28)]
def interp(y):
    for (y0,w0),(y1,w1) in zip(prof,prof[1:]):
        if y0<=y<=y1:
            t=(y-y0)/(y1-y0); t=t*t*(3-2*t); return w0+(w1-w0)*t
    return prof[-1][1]
R=[(cx+interp(y),top+y) for y in range(0,123,2)]
Lf=[(cx-interp(y),top+y) for y in range(122,-1,-2)]
vase="M"+" L".join(f"{x:.1f} {y:.1f}" for x,y in R+Lf)+" Z"
def band(y,h):
    pts=[(cx+interp(yy),top+yy) for yy in range(y,y+h+1)]+[(cx-interp(yy),top+yy) for yy in range(y+h,y-1,-1)]
    return "M"+" L".join(f"{a:.1f} {b:.1f}" for a,b in pts)+" Z"
def chrys(x,y,s):
    g=[f'<g transform="translate({x} {y}) scale({s})">']
    for k in range(22):
        g.append(f'<ellipse cx="0" cy="-15" rx="2.8" ry="12" transform="rotate({k*360/22:.1f})" fill="#E2B05C" stroke="#9A6A26" stroke-width=".6"/>')
    for k in range(16):
        g.append(f'<ellipse cx="0" cy="-9" rx="2.4" ry="8" transform="rotate({k*360/16+11:.1f})" fill="#F3D79A" stroke="#B8862F" stroke-width=".5"/>')
    g.append('<circle r="5" fill="#B8862F"/></g>')
    return ''.join(g)
def leaf(x,y,a,s,col="#4E8F78"):
    return f'<path d="M0 0 C 8 -5, 30 -6, 46 0 C 30 6, 8 5, 0 0 Z" transform="translate({x} {y}) rotate({a}) scale({s})" fill="{col}" stroke="#24493E" stroke-width="1"/>'
def stalk(x0,y0,x1,y1,w):
    segs=[];n=5
    for i in range(n):
        ax=x0+(x1-x0)*i/n; ay=y0+(y1-y0)*i/n; bx=x0+(x1-x0)*(i+1)/n; by=y0+(y1-y0)*(i+1)/n
        segs.append(f'<path d="M{ax:.1f} {ay:.1f} L{bx:.1f} {by:.1f}" stroke="#4E8F78" stroke-width="{w}" stroke-linecap="butt"/>')
        segs.append(f'<path d="M{bx-w/2-1:.1f} {by:.1f} L{bx+w/2+1:.1f} {by:.1f}" stroke="#24493E" stroke-width="2"/>')
    return ''.join(segs)
pr='<g id="pr"><g fill="#F7E6CC" stroke="#C99A5B" stroke-width=".8"><circle cx="0" cy="-5.5" r="5"/><circle cx="5.2" cy="-1.7" r="5"/><circle cx="3.2" cy="4.5" r="5"/><circle cx="-3.2" cy="4.5" r="5"/><circle cx="-5.2" cy="-1.7" r="5"/></g><circle r="2.6" fill="#E2A15C"/></g>'
parts=[]
parts.append(stalk(120,226,96,40,7)); parts.append(stalk(140,226,170,70,6))
for (x,y,a,s) in [(96,60,-150,1.1),(98,70,-120,1),(104,110,-30,1.1),(165,90,-40,1.1),(168,96,-10,1),(160,140,-160,1),(110,150,-170,1)]:
    parts.append(leaf(x,y,a,s))
parts.append('<path d="M130 226 C 120 180, 60 160, 40 120 M130 226 C 150 180, 210 170, 226 132 M128 226 C 128 190, 136 160, 132 120" fill="none" stroke="#4A2E26" stroke-width="3" stroke-linecap="round"/>')
for (x,y,a,s,c) in [(60,150,-140,1,"#86BBA2"),(205,160,-30,1,"#86BBA2"),(130,170,-80,.9,"#4E8F78"),(40,124,-100,.8,"#4E8F78"),(222,138,-70,.8,"#4E8F78")]:
    parts.append(leaf(x,y,a,s,c))
parts.append(chrys(40,118,1.15)); parts.append(chrys(226,130,1)); parts.append(chrys(132,116,1.3))
for (x,y,s) in [(80,140,.8),(190,150,.8),(150,150,.7),(108,190,.7)]:
    parts.append(f'<use xlink:href="#pr" transform="translate({x} {y}) scale({s})"/>')
v=[]
v.append(f'<path d="{vase}" fill="#F4EEE2" stroke="#2D4F8E" stroke-width="1.6"/>')
v.append(f'<path d="{band(0,6)}" fill="#2D4F8E"/>')
v.append(f'<path d="{band(40,6)}" fill="#2D4F8E"/>')
v.append(f'<path d="{band(108,14)}" fill="#2D4F8E"/>')
v.append(f'<circle cx="{cx}" cy="{top+78}" r="17" fill="none" stroke="#2D4F8E" stroke-width="2"/>')
v.append(f'<g transform="translate({cx} {top+78})"><g fill="#2D4F8E">'+''.join(f'<ellipse cx="0" cy="-8" rx="4" ry="7" transform="rotate({k*60})"/>' for k in range(6))+'</g><circle r="3" fill="#F4EEE2"/></g>')
v.append(f'<path d="M{cx-38} {top+62} C {cx-30} {top+56}, {cx-22} {top+66}, {cx-14} {top+60} M{cx+14} {top+60} C {cx+22} {top+66}, {cx+30} {top+56}, {cx+38} {top+62}" fill="none" stroke="#2D4F8E" stroke-width="1.6"/>')
v.append(f'<path d="M{cx-34} {top+124} L{cx+34} {top+124} L{cx+40} {top+136} L{cx-40} {top+136} Z" fill="#4A2E26"/>')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 260 362" width="260" height="362"><defs>{pr}</defs>{''.join(parts)}{''.join(v)}</svg>'''
open(out,'w').write(svg)
