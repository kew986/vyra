import os
import struct
import zlib
import binascii

def write_png(filename, width, height, pixels):
    """
    pixels: list of RGBA tuples of length width * height
    """
    # Signature
    png = bytearray([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += make_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk (scanlines with filter byte 0)
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter byte 0
        for x in range(width):
            r, g, b, a = pixels[y * width + x]
            raw_data.append(r)
            raw_data.append(g)
            raw_data.append(b)
            raw_data.append(a)
            
    compressed = zlib.compress(raw_data)
    png += make_chunk(b'IDAT', compressed)
    
    # IEND chunk
    png += make_chunk(b'IEND', b'')
    
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(png)

def make_chunk(chunk_type, data):
    length = struct.pack('>I', len(data))
    to_crc = chunk_type + data
    crc = struct.pack('>I', binascii.crc32(to_crc) & 0xFFFFFFFF)
    return length + to_crc + crc

def generate_icons():
    # 1. Generate icon-512.png (512x512)
    # Slate dark background: #0F1117 (15, 17, 23, 255)
    # Gradient rect: size 448x448, centered (padding 32px), rx=96
    # Gradient: #5B8CFF (91, 140, 255) to #7C5CFF (124, 92, 255)
    # Central diamond: size 120, centered, white with 0.95 opacity
    
    width = 512
    height = 512
    pixels = []
    
    for y in range(height):
        for x in range(width):
            # Default background
            r, g, b, a = 15, 17, 23, 255
            
            # Check rounded rect boundary
            # Center of rounded rect is 256, 256
            # Rect spans from 32 to 480
            rx = 96
            rect_x1, rect_y1 = 32, 32
            rect_x2, rect_y2 = 480, 480
            
            in_rect = False
            if rect_x1 <= x < rect_x2 and rect_y1 <= y < rect_y2:
                # Rounded corners check
                # Top-left corner
                if x < rect_x1 + rx and y < rect_y1 + rx:
                    dx = x - (rect_x1 + rx)
                    dy = y - (rect_y1 + rx)
                    if dx*dx + dy*dy <= rx*rx:
                        in_rect = True
                # Top-right corner
                elif x >= rect_x2 - rx and y < rect_y1 + rx:
                    dx = x - (rect_x2 - rx)
                    dy = y - (rect_y1 + rx)
                    if dx*dx + dy*dy <= rx*rx:
                        in_rect = True
                # Bottom-left corner
                elif x < rect_x1 + rx and y >= rect_y2 - rx:
                    dx = x - (rect_x1 + rx)
                    dy = y - (rect_y2 - rx)
                    if dx*dx + dy*dy <= rx*rx:
                        in_rect = True
                # Bottom-right corner
                elif x >= rect_x2 - rx and y >= rect_y2 - rx:
                    dx = x - (rect_x2 - rx)
                    dy = y - (rect_y2 - rx)
                    if dx*dx + dy*dy <= rx*rx:
                        in_rect = True
                else:
                    in_rect = True
            
            if in_rect:
                # Gradient interpolation (diagonal)
                ratio = (x + y) / (width + height)
                r_grad = int(91 + ratio * 33)
                g_grad = int(140 - ratio * 48)
                b_grad = 255
                
                # Check central diamond
                # abs(x - cx) + abs(y - cy) <= 96
                cx, cy = 256, 256
                if abs(x - cx) + abs(y - cy) <= 96:
                    r, g, b, a = 255, 255, 255, 240
                else:
                    r, g, b, a = r_grad, g_grad, b_grad, 255
            
            pixels.append((r, g, b, a))
            
    write_png('c:/xampp/htdocs/1. DesignHub/public/icons/icon-512.png', width, height, pixels)
    print("Generated icon-512.png")
    
    # 2. Generate icon-192.png (192x192)
    # Same design scaled down
    width = 192
    height = 192
    pixels = []
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = 15, 17, 23, 255
            rx = 36
            rect_x1, rect_y1 = 12, 12
            rect_x2, rect_y2 = 180, 180
            
            in_rect = False
            if rect_x1 <= x < rect_x2 and rect_y1 <= y < rect_y2:
                if x < rect_x1 + rx and y < rect_y1 + rx:
                    dx = x - (rect_x1 + rx)
                    dy = y - (rect_y1 + rx)
                    if dx*dx + dy*dy <= rx*rx:
                        in_rect = True
                elif x >= rect_x2 - rx and y < rect_y1 + rx:
                    dx = x - (rect_x2 - rx)
                    dy = y - (rect_y1 + rx)
                    if dx*dx + dy*dy <= rx*rx:
                        in_rect = True
                elif x < rect_x1 + rx and y >= rect_y2 - rx:
                    dx = x - (rect_x1 + rx)
                    dy = y - (rect_y2 - rx)
                    if dx*dx + dy*dy <= rx*rx:
                        in_rect = True
                elif x >= rect_x2 - rx and y >= rect_y2 - rx:
                    dx = x - (rect_x2 - rx)
                    dy = y - (rect_y2 - rx)
                    if dx*dx + dy*dy <= rx*rx:
                        in_rect = True
                else:
                    in_rect = True
                    
            if in_rect:
                ratio = (x + y) / (width + height)
                r_grad = int(91 + ratio * 33)
                g_grad = int(140 - ratio * 48)
                b_grad = 255
                
                cx, cy = 96, 96
                if abs(x - cx) + abs(y - cy) <= 36:
                    r, g, b, a = 255, 255, 255, 240
                else:
                    r, g, b, a = r_grad, g_grad, b_grad, 255
                    
            pixels.append((r, g, b, a))
            
    write_png('c:/xampp/htdocs/1. DesignHub/public/icons/icon-192.png', width, height, pixels)
    print("Generated icon-192.png")

    # 3. Generate icon-512-maskable.png (512x512)
    # Pure gradient filled background with central diamond (no outer slate dark rect)
    width = 512
    height = 512
    pixels = []
    
    for y in range(height):
        for x in range(width):
            ratio = (x + y) / (width + height)
            r_grad = int(91 + ratio * 33)
            g_grad = int(140 - ratio * 48)
            b_grad = 255
            
            cx, cy = 256, 256
            if abs(x - cx) + abs(y - cy) <= 96:
                r, g, b, a = 255, 255, 255, 240
            else:
                r, g, b, a = r_grad, g_grad, b_grad, 255
                
            pixels.append((r, g, b, a))
            
    write_png('c:/xampp/htdocs/1. DesignHub/public/icons/icon-512-maskable.png', width, height, pixels)
    print("Generated icon-512-maskable.png")

if __name__ == '__main__':
    generate_icons()
