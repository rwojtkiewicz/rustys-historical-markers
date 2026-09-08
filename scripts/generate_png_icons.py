import zlib
import struct
import math
import os

def create_png(width, height, draw_func, filename):
    raw_data = bytearray()
    
    for y in range(height):
        raw_data.append(0) # filter byte (None)
        for x in range(width):
            r, g, b, a = draw_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    compressed = zlib.compress(raw_data, 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR chunk
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png.extend(struct.pack('>I', len(ihdr)))
    png.extend(b'IHDR')
    png.extend(ihdr)
    png.extend(struct.pack('>I', zlib.crc32(b'IHDR' + ihdr) & 0xffffffff))
    
    # IDAT chunk
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff))
    
    # IEND chunk
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff))
    
    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({width}x{height})")

def marker_icon_drawer(x, y, w, h):
    # Normalized coords [0, 1]
    nx = x / w
    ny = y / h
    
    # Corner radius check for app icon squircle
    cx = 0.5
    cy = 0.5
    dx = abs(nx - 0.5) * 2
    dy = abs(ny - 0.5) * 2
    
    # Squircle distance: (dx^4 + dy^4)^(1/4)
    dist_sq = (dx**4.5 + dy**4.5)**(1/4.5)
    if dist_sq > 0.96:
        return 0, 0, 0, 0 # Transparent outside rounded squircle
        
    # Background Dark Slate gradient with warm center glow
    rad_dist = math.hypot(nx - 0.5, ny - 0.45)
    bg_r = int(18 + max(0, 18 * (1 - rad_dist * 1.5)))
    bg_g = int(24 + max(0, 24 * (1 - rad_dist * 1.5)))
    bg_b = int(38 + max(0, 32 * (1 - rad_dist * 1.5)))
    
    # Plaque Bounds
    # X: 0.18 to 0.82
    # Y: 0.15 to 0.82
    px = (nx - 0.18) / (0.82 - 0.18)
    py = (ny - 0.15) / (0.82 - 0.15)
    
    in_plaque = False
    is_border = False
    is_inner_line = False
    is_monument = False
    
    if 0.0 <= px <= 1.0 and 0.0 <= py <= 1.0:
        # Plaque shape has arched top: py < 0.25 follows arch
        arch_top = 0.0
        if py < 0.28:
            arch_center_dist = abs(px - 0.5) * 2
            arch_top = (1 - (1 - arch_center_dist**2)**0.5) * 0.22 if arch_center_dist <= 1.0 else 1.0
            
        if py >= arch_top:
            in_plaque = True
            
            # Border detection (outer 5%)
            if px < 0.06 or px > 0.94 or py > 0.94 or (py - arch_top) < 0.06:
                is_border = True
            elif (0.09 <= px <= 0.11 or 0.89 <= px <= 0.91 or 0.89 <= py <= 0.91 or abs(py - arch_top - 0.09) < 0.015):
                is_inner_line = True
                
            # Classical Historical Monument in center (px: 0.28 to 0.72, py: 0.35 to 0.80)
            mx = (px - 0.26) / (0.74 - 0.26)
            my = (py - 0.32) / (0.80 - 0.32)
            
            if 0.0 <= mx <= 1.0 and 0.0 <= my <= 1.0:
                # Triangular Roof: my in [0.0, 0.30], roof shape
                if my <= 0.28:
                    roof_dx = abs(mx - 0.5) * 2
                    if my >= (roof_dx * 0.28):
                        is_monument = True
                # Architrave: my in [0.28, 0.36]
                elif 0.28 < my <= 0.38 and 0.08 <= mx <= 0.92:
                    is_monument = True
                # 4 Columns: my in [0.38, 0.82]
                elif 0.38 < my <= 0.82:
                    col1 = 0.12 <= mx <= 0.26
                    col2 = 0.36 <= mx <= 0.46
                    col3 = 0.54 <= mx <= 0.64
                    col4 = 0.74 <= mx <= 0.88
                    if col1 or col2 or col3 or col4:
                        is_monument = True
                # Base Pedestal: my in [0.82, 1.0]
                elif 0.82 < my <= 1.0 and 0.04 <= mx <= 0.96:
                    is_monument = True
                    
            # Header Star / Eagle Seal at px ~ 0.5, py in [0.12, 0.26]
            star_dx = abs(px - 0.5)
            star_dy = abs(py - 0.20)
            if math.hypot(star_dx, star_dy) < 0.065:
                is_monument = True

    # Mounting Post at bottom
    if 0.44 <= nx <= 0.56 and 0.82 <= ny <= 0.94:
        return 180, 83, 9, 255 # Bronze post

    if in_plaque:
        if is_monument:
            # Gleaming Gold / Amber Emboss
            return 254, 240, 138, 255 # Bright gold
        elif is_inner_line:
            # Gold Accent Line
            return 245, 158, 11, 255 # Amber
        elif is_border:
            # Rich Cast Bronze Border Gradient
            b_val = int(px * 80)
            return 217 - b_val, 119 - b_val//2, 6, 255
        else:
            # Dark Oxidized Bronze Plaque Face
            face_shade = int((1 - py) * 20)
            return 58 + face_shade, 24 + face_shade//2, 8, 255

    # Background Squircle
    return bg_r, bg_g, bg_b, 255

def main():
    os.makedirs("public", exist_ok=True)
    # Generate 512x512 icon
    create_png(512, 512, marker_icon_drawer, "public/icon-512.png")
    # Generate 192x192 icon
    create_png(192, 192, marker_icon_drawer, "public/icon-192.png")
    # Generate 180x180 Apple Touch icon
    create_png(180, 180, marker_icon_drawer, "public/apple-touch-icon.png")
    # Generate favicon.png
    create_png(64, 64, marker_icon_drawer, "public/favicon.png")
    print("All PNG launcher icons successfully generated with pure standard library!")

if __name__ == "__main__":
    main()
