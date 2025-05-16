import xml.etree.ElementTree as ET
from svg.path import parse_path, Line, CubicBezier, QuadraticBezier, Arc

def svg_to_lines(svg_filepath, segment_length=5.0):
    """
    Converts an SVG file to a system of line segments.

    Args:
        svg_filepath (str): The path to the SVG file.
        segment_length (float): The maximum length of each line segment
                                used to approximate curves and arcs.

    Returns:
        list: A list of tuples, where each tuple represents a line segment
              as ((x1, y1), (x2, y2)).
    """
    lines = []
    tree = ET.parse(svg_filepath)
    root = tree.getroot()

    for element in root.findall('.//{*}path'):
        path_string = element.get('d')
        if path_string:
            path = parse_path(path_string)
            for segment in path:
                if isinstance(segment, Line):
                    lines.append(((segment.start.real, segment.start.imag),
                                  (segment.end.real, segment.end.imag)))
                elif isinstance(segment, (CubicBezier, QuadraticBezier, Arc)):
                    length = segment.length()
                    num_segments = int(length / segment_length) + 1
                    for i in range(num_segments + 1):
                        t = i / num_segments
                        point1 = segment.point(t)
                        if i > 0:
                            point0 = segment.point((i - 1) / num_segments)
                            lines.append(((point0.real, point0.imag),
                                          (point1.real, point1.imag)))

    # Handle basic shapes (lines, rectangles, circles, polygons, ellipses)
    for element in root.findall('.//{*}line'):
        x1 = float(element.get('x1', 0))
        y1 = float(element.get('y1', 0))
        x2 = float(element.get('x2', 0))
        y2 = float(element.get('y2', 0))
        lines.append(((x1, y1), (x2, y2)))

    for element in root.findall('.//{*}rect'):
        x = float(element.get('x', 0))
        y = float(element.get('y', 0))
        width = float(element.get('width', 0))
        height = float(element.get('height', 0))
        lines.extend([((x, y), (x + width, y)),
                      ((x + width, y), (x + width, y + height)),
                      ((x + width, y + height), (x, y + height)),
                      ((x, y + height), (x, y))])

    for element in root.findall('.//{*}polygon'):
        points_str = element.get('points')
        if points_str:
            points_list = [tuple(map(float, p.split(','))) for p in points_str.strip().split()]
            for i in range(len(points_list)):
                lines.append((points_list[i], points_list[(i + 1) % len(points_list)]))

    for element in root.findall('.//{*}circle'):
        cx = float(element.get('cx', 0))
        cy = float(element.get('cy', 0))
        r = float(element.get('r', 0))
        circumference = 2 * 3.14159 * r
        num_segments = int(circumference / segment_length) + 1
        for i in range(num_segments):
            angle1 = 2 * 3.14159 * i / num_segments
            angle2 = 2 * 3.14159 * (i + 1) / num_segments
            x1 = cx + r * cos(angle1)
            y1 = cy + r * sin(angle1)
            x2 = cx + r * cos(angle2)
            y2 = cy + r * sin(angle2)
            lines.append(((x1, y1), (x2, y2)))

    for element in root.findall('.//{*}ellipse'):
        cx = float(element.get('cx', 0))
        cy = float(element.get('cy', 0))
        rx = float(element.get('rx', 0))
        ry = float(element.get('ry', 0))
        circumference = 2 * 3.14159 * max(rx, ry) # Approximate circumference
        num_segments = int(circumference / segment_length) + 1
        for i in range(num_segments):
            angle1 = 2 * 3.14159 * i / num_segments
            angle2 = 2 * 3.14159 * (i + 1) / num_segments
            x1 = cx + rx * cos(angle1)
            y1 = cy + ry * sin(angle1)
            x2 = cx + rx * cos(angle2)
            y2 = cy + ry * sin(angle2)
            lines.append(((x1, y1), (x2, y2)))

    return lines

if __name__ == "__main__":
    svg_file = "your_image.svg"  # Replace with the path to your SVG file
    lines = svg_to_lines(svg_file, segment_length=2.0)
    print(f"Extracted {len(lines)} line segments:")
    for line in lines[:10]:  # Print the first 10 lines
        print(line)
