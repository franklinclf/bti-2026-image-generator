#!/usr/bin/env python3
# Converte um logo (letras escuras sobre fundo branco) em PNG branco solido com fundo transparente.
# PNG puro via zlib (sem dependencias). Suporta color type 2 (RGB) e 6 (RGBA), 8-bit, nao-entrelacado.
import struct, zlib, sys

def load_png(path):
    d = open(path, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n', 'nao e PNG'
    pos = 8; W=H=bd=ct=None; idat=b''
    while pos < len(d):
        ln = struct.unpack('>I', d[pos:pos+4])[0]
        typ = d[pos+4:pos+8]; body = d[pos+8:pos+8+ln]; pos += 12+ln
        if typ==b'IHDR':
            W,H,bd,ct,cm,fm,il = struct.unpack('>IIBBBBB', body)
            assert bd==8 and il==0, f'bit={bd} interlace={il} nao suportado'
        elif typ==b'IDAT': idat += body
        elif typ==b'IEND': break
    ch = {2:3,6:4,0:1}.get(ct)
    assert ch, f'colortype {ct} nao suportado'
    raw = zlib.decompress(idat)
    stride = W*ch
    def paeth(a,b,c):
        p=a+b-c; pa=abs(p-a); pb=abs(p-b); pc=abs(p-c)
        return a if (pa<=pb and pa<=pc) else (b if pb<=pc else c)
    prev = bytearray(stride); out = bytearray(); i=0
    for y in range(H):
        ft = raw[i]; i+=1
        ln_ = bytearray(raw[i:i+stride]); i+=stride
        if ft==1:
            for x in range(ch,stride): ln_[x]=(ln_[x]+ln_[x-ch])&255
        elif ft==2:
            for x in range(stride): ln_[x]=(ln_[x]+prev[x])&255
        elif ft==3:
            for x in range(stride):
                a=ln_[x-ch] if x>=ch else 0
                ln_[x]=(ln_[x]+((a+prev[x])>>1))&255
        elif ft==4:
            for x in range(stride):
                a=ln_[x-ch] if x>=ch else 0
                c=prev[x-ch] if x>=ch else 0
                ln_[x]=(ln_[x]+paeth(a,prev[x],c))&255
        out+=ln_; prev=ln_
    return W,H,ch,out

def save_white(path, W, H, ch, px, thr=232):
    newraw = bytearray(); op=0; tr=0
    for y in range(H):
        newraw.append(0)
        base = y*W*ch
        for x in range(W):
            o = base + x*ch
            r,g,b = px[o],px[o+1],px[o+2]
            a = px[o+3] if ch==4 else 255
            lum = (r+g+b)/3.0
            if a==0 or lum>thr:
                newraw += b'\xff\xff\xff\x00'; tr+=1
            else:
                cov = int(255*(1-lum/thr)); cov=max(0,min(255,cov))
                if a<255: cov=int(cov*a/255)
                newraw += bytes((255,255,255,cov));
                op += 1 if cov>40 else 0
                tr += 1 if cov<=40 else 0
    comp = zlib.compress(bytes(newraw),9)
    def chunk(t,dd): return struct.pack('>I',len(dd))+t+dd+struct.pack('>I',zlib.crc32(t+dd)&0xffffffff)
    png = b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',W,H,8,6,0,0,0))+chunk(b'IDAT',comp)+chunk(b'IEND',b'')
    open(path,'wb').write(png)
    return op,tr

def ascii_preview(W,H,ch,px,cols=104,thr=232):
    rows = max(1,int(cols*H/W/2))
    sx=W/cols; sy=H/rows; lines=[]
    ramp=' .:-=+*#%@'
    for ry in range(rows):
        line=''
        for rx in range(cols):
            x=int(rx*sx); y=int(ry*sy); o=(y*W+x)*ch
            r,g,b=px[o],px[o+1],px[o+2]; a=px[o+3] if ch==4 else 255
            lum=(r+g+b)/3.0
            cov = 0 if (a==0 or lum>thr) else (1-lum/thr)
            line+=ramp[min(len(ramp)-1,int(cov*(len(ramp)-1)))]
        lines.append(line)
    return '\n'.join(lines)

src='brand-source/logotipo_flat.png'; dst='propostas/assets/ufrn-white.png'
W,H,ch,px = load_png(src)
print(f'origem {src}: {W}x{H} ch={ch}')
op,tr = save_white(dst,W,H,ch,px)
print(f'salvo {dst}: opacos(letra)~{op} transp(fundo)~{tr}  ({100*op/(op+tr):.1f}% tinta)')
print('--- preview ASCII (letra = tinta) ---')
print(ascii_preview(W,H,ch,px))
