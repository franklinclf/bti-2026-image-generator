#!/usr/bin/env python3
# Cutout por flood-fill a partir das bordas: remove o fundo (conectado) preservando interiores claros (camisa).
# PNG puro (zlib). Uso: cutout.py <in.png> <out.png> [tol]
import sys, zlib, struct
from collections import deque

def load_png(path):
    d=open(path,'rb').read(); assert d[:8]==b'\x89PNG\r\n\x1a\n'
    pos=8; W=H=bd=ct=None; idat=b''
    while pos<len(d):
        ln=struct.unpack('>I',d[pos:pos+4])[0]; typ=d[pos+4:pos+8]; body=d[pos+8:pos+8+ln]; pos+=12+ln
        if typ==b'IHDR': W,H,bd,ct,cm,fm,il=struct.unpack('>IIBBBBB',body); assert bd==8 and il==0
        elif typ==b'IDAT': idat+=body
        elif typ==b'IEND': break
    ch={2:3,6:4,0:1}[ct]; raw=zlib.decompress(idat); stride=W*ch
    def paeth(a,b,c):
        p=a+b-c;pa=abs(p-a);pb=abs(p-b);pc=abs(p-c)
        return a if(pa<=pb and pa<=pc)else(b if pb<=pc else c)
    prev=bytearray(stride); out=bytearray(); i=0
    for y in range(H):
        ft=raw[i]; i+=1; ln=bytearray(raw[i:i+stride]); i+=stride
        if ft==1:
            for x in range(ch,stride): ln[x]=(ln[x]+ln[x-ch])&255
        elif ft==2:
            for x in range(stride): ln[x]=(ln[x]+prev[x])&255
        elif ft==3:
            for x in range(stride):
                a=ln[x-ch] if x>=ch else 0; ln[x]=(ln[x]+((a+prev[x])>>1))&255
        elif ft==4:
            for x in range(stride):
                a=ln[x-ch] if x>=ch else 0; c=prev[x-ch] if x>=ch else 0; ln[x]=(ln[x]+paeth(a,prev[x],c))&255
        out+=ln; prev=ln
    # normaliza para RGB (3ch)
    if ch==4:
        rgb=bytearray(W*H*3)
        for p in range(W*H): rgb[p*3]=out[p*4];rgb[p*3+1]=out[p*4+1];rgb[p*3+2]=out[p*4+2]
        out=rgb
    return W,H,out  # RGB

def save_rgba(path,W,H,rgb,alpha):
    raw=bytearray()
    for y in range(H):
        raw.append(0); base=y*W
        for x in range(W):
            p=base+x; o=p*3
            raw+=bytes((rgb[o],rgb[o+1],rgb[o+2],alpha[p]))
    comp=zlib.compress(bytes(raw),6)
    def ch(t,dd): return struct.pack('>I',len(dd))+t+dd+struct.pack('>I',zlib.crc32(t+dd)&0xffffffff)
    open(path,'wb').write(b'\x89PNG\r\n\x1a\n'+ch(b'IHDR',struct.pack('>IIBBBBB',W,H,8,6,0,0,0))+ch(b'IDAT',comp)+ch(b'IEND',b''))

def main():
    inp=sys.argv[1]; outp=sys.argv[2]; TOL=float(sys.argv[3]) if len(sys.argv)>3 else 52.0
    W,H,rgb=load_png(inp); N=W*H
    def avg(cx,cy,r=14):
        sr=sg=sb=n=0
        for y in range(max(0,cy-r),min(H,cy+r)):
            for x in range(max(0,cx-r),min(W,cx+r)):
                o=(y*W+x)*3; sr+=rgb[o];sg+=rgb[o+1];sb+=rgb[o+2];n+=1
        return (sr/n,sg/n,sb/n)
    refs=[avg(16,16),avg(W-16,16),avg(16,H-16),avg(W-16,H-16),avg(W//2,10)]
    tol2=TOL*TOL
    def is_bg(p):
        o=p*3; r=rgb[o];g=rgb[o+1];b=rgb[o+2]
        for (R,G,B) in refs:
            dr=r-R;dg=g-G;db=b-B
            if dr*dr+dg*dg+db*db<tol2: return True
        return False
    alpha=bytearray(b'\xff')*N
    seen=bytearray(N)
    dq=deque()
    for x in range(W):
        for p in (x, (H-1)*W+x):
            if not seen[p] and is_bg(p): seen[p]=1; alpha[p]=0; dq.append(p)
    for y in range(H):
        for p in (y*W, y*W+W-1):
            if not seen[p] and is_bg(p): seen[p]=1; alpha[p]=0; dq.append(p)
    while dq:
        p=dq.popleft(); x=p%W; y=p//W
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=nx<W and 0<=ny<H:
                q=ny*W+nx
                if not seen[q]:
                    seen[q]=1
                    if is_bg(q): alpha[q]=0; dq.append(q)
    bg_ct=sum(1 for p in range(N) if alpha[p]==0)
    # feather 3x3 (uma passada) para suavizar borda
    fa=bytearray(alpha)
    for y in range(1,H-1):
        for x in range(1,W-1):
            p=y*W+x; s=0
            s=alpha[p-1]+alpha[p+1]+alpha[p-W]+alpha[p+W]+alpha[p-W-1]+alpha[p-W+1]+alpha[p+W-1]+alpha[p+W+1]+alpha[p]
            fa[p]=s//9
    alpha=fa
    # crop bbox opaco
    minx=W;miny=H;maxx=0;maxy=0
    for y in range(H):
        row=y*W
        for x in range(W):
            if alpha[row+x]>40:
                if x<minx:minx=x
                if x>maxx:maxx=x
                if y<miny:miny=y
                if y>maxy:maxy=y
    pad=10; minx=max(0,minx-pad);miny=max(0,miny-pad);maxx=min(W-1,maxx+pad);maxy=min(H-1,maxy+pad)
    cw=maxx-minx+1; chh=maxy-miny+1
    crgb=bytearray(cw*chh*3); ca=bytearray(cw*chh)
    for y in range(chh):
        for x in range(cw):
            sp=(miny+y)*W+(minx+x); dp=y*cw+x
            crgb[dp*3]=rgb[sp*3];crgb[dp*3+1]=rgb[sp*3+1];crgb[dp*3+2]=rgb[sp*3+2];ca[dp]=alpha[sp]
    save_rgba(outp,cw,chh,crgb,ca)
    print(f'in {W}x{H}  refs={[tuple(int(v) for v in r) for r in refs]}  tol={TOL}')
    print(f'fundo removido: {bg_ct} px ({100*bg_ct/N:.1f}%)  ->  cutout {cw}x{chh}  {outp}')
    # ASCII preview
    cols=80; rows=max(1,int(cols*chh/cw/2)); sx=cw/cols; sy=chh/rows; ramp=' .:-=+*#%@'; lines=[]
    for ry in range(rows):
        ln=''
        for rx in range(cols):
            xx=int(rx*sx);yy=int(ry*sy);a=ca[yy*cw+xx]/255.0
            ln+=ramp[min(9,int(a*9))]
        lines.append(ln)
    print('\n'.join(lines))

main()
