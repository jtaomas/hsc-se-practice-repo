#!/usr/bin/env python3
"""Build five synthetic class-diagram fixtures from one scene/PNG geometry source.

Requires Pillow only for regeneration. The evaluator reads embedded PNGs and does
not need Python/Pillow. No student code, model call or remote service is used.
"""
import argparse
import base64
import io
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FIXTURE = ROOT / 'tests/fixtures/marking-calibration.json'
WIDTH, HEIGHT = 960, 740
FONT_PATHS = [
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
]


def font(size):
    for candidate in FONT_PATHS:
        if Path(candidate).is_file():
            return ImageFont.truetype(candidate, size)
    raise RuntimeError('Install an Arial, DejaVu Sans or Liberation Sans font before regenerating fixtures.')


def element(identifier, kind, x, y, width, height, **fields):
    return dict(id=identifier, type=kind, x=x, y=y, width=width, height=height,
                angle=0, opacity=100, strokeColor='#202020', backgroundColor='transparent',
                strokeWidth=2, strokeStyle='solid', roughness=0, fillStyle='solid', **fields)


def text_element(identifier, text, x, y, size=20, container=None, group=None):
    lines = text.split('\n')
    face = font(size)
    width = max(1, math.ceil(max(face.getlength(line) for line in lines)))
    # Explicit 1.4-em line spacing, also used in draw_scene. Geometry is never
    # inferred from a second, independently authored picture.
    height = len(lines) * size * 1.4
    return element(identifier, 'text', x, y, width, height, text=text, originalText=text,
                   fontSize=size, fontFamily=2, textAlign='left', verticalAlign='top',
                   containerId=container, groupIds=[group] if group else [])


def scene(variant):
    elements = [text_element('diagram-title', 'Veterinary clinic', 60, 20, 24)]
    positions = {'Owner': (60, 70), 'Pet': (600, 70), 'Vet': (60, 450), 'Appointment': (600, 450)}
    attributes = {'Owner': ['name', 'phone', 'email'], 'Pet': ['name', 'species', 'dateOfBirth'],
                  'Vet': ['name', 'registrationNumber'], 'Appointment': ['date', 'time', 'reason']}
    methods = {'Owner': 'getPets()', 'Pet': 'getAppointments()', 'Vet': 'getSchedule()', 'Appointment': 'reschedule(date, time)'}
    if variant == 'irrelevant':
        positions = {'Car': (60, 70), 'Engine': (600, 70), 'Garage': (60, 450), 'Wheel': (600, 450)}
        attributes = {'Car': ['model', 'colour'], 'Engine': ['capacity'], 'Garage': ['address'], 'Wheel': ['diameter']}
    boxes = {}
    for name, (x, y) in positions.items():
        group = name.lower() + '-group'
        attrs = [] if variant == 'no_attributes' else attributes[name]
        if variant == 'beyond_full':
            kinds = {'name': 'String', 'phone': 'String', 'email': 'String', 'species': 'String', 'dateOfBirth': 'Date',
                     'registrationNumber': 'String', 'date': 'Date', 'time': 'Time', 'reason': 'String'}
            attrs = ['+ ' + value + ': ' + kinds[value] for value in attrs]
        lines = [name, ''] + attrs
        if variant == 'beyond_full':
            lines += ['', '+ ' + methods[name]]
        box_height = 240 if variant == 'beyond_full' else 190
        box = element(name.lower() + '-box', 'rectangle', x, y, 270, box_height, groupIds=[group], boundElements=[])
        box['backgroundColor'] = '#ffffff'
        label = text_element(name.lower() + '-text', '\n'.join(lines), x + 14, y + 12, 18 if variant == 'beyond_full' else 20, box['id'], group)
        assert label['x'] + label['width'] < x + 270, 'Text must fit its class box.'
        assert label['y'] + label['height'] <= y + box_height, 'Text must fit vertically.'
        box['boundElements'].append({'id': label['id'], 'type': 'text'})
        divider = element(name.lower() + '-divider', 'line', x, y + 43, 270, 0, points=[[0, 0], [270, 0]],
                          startArrowhead=None, endArrowhead=None, groupIds=[group])
        elements += [box, divider, label]
        boxes[name] = box

    if variant != 'irrelevant':
        connections = [('Owner', 'Pet', 'owner-pets'), ('Pet', 'Appointment', 'pet-appointments'), ('Vet', 'Appointment', 'vet-appointments')]
        for start, end, identifier in connections:
            first, second = boxes[start], boxes[end]
            vertical = start == 'Pet'
            if vertical:
                p1 = (first['x'] + first['width'] / 2, first['y'] + first['height'])
                p2 = (second['x'] + second['width'] / 2, second['y'])
                fixed_start, fixed_end = [0.5, 1], [0.5, 0]
                first_label = (p1[0] + 15, p1[1] + 15)
                second_label = (p2[0] + 15, p2[1] - 35)
            else:
                p1 = (first['x'] + first['width'], first['y'] + first['height'] / 2)
                p2 = (second['x'], second['y'] + second['height'] / 2)
                fixed_start, fixed_end = [1, 0.5], [0, 0.5]
                first_label, second_label = (p1[0] + 20, p1[1] - 30), (p2[0] - 65, p2[1] - 30)
            connector = element(identifier, 'arrow', p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1],
                                points=[[0, 0], [p2[0] - p1[0], p2[1] - p1[1]]],
                                startBinding={'elementId': first['id'], 'focus': 0, 'gap': 0, 'fixedPoint': fixed_start},
                                endBinding={'elementId': second['id'], 'focus': 0, 'gap': 0, 'fixedPoint': fixed_end},
                                startArrowhead=None, endArrowhead=None, groupIds=[identifier + '-group'])
            first['boundElements'].append({'id': identifier, 'type': 'arrow'})
            second['boundElements'].append({'id': identifier, 'type': 'arrow'})
            cardinalities = ['0..*', '1'] if variant == 'reversed_multiplicity' and start == 'Owner' else ['1', '0..*']
            elements += [connector, text_element(identifier + '-start-cardinality', cardinalities[0], *first_label, group=identifier + '-group'),
                         text_element(identifier + '-end-cardinality', cardinalities[1], *second_label, group=identifier + '-group')]
    return {'elements': elements}


def draw_scene(value):
    image = Image.new('RGB', (WIDTH, HEIGHT), 'white')
    drawing = ImageDraw.Draw(image)
    for item in value['elements']:
        x, y, w, h = item['x'], item['y'], item['width'], item['height']
        colour = item['strokeColor']
        if item['type'] == 'rectangle':
            drawing.rectangle((x, y, x + w, y + h), fill=item['backgroundColor'], outline=colour, width=item['strokeWidth'])
        elif item['type'] in ('line', 'arrow'):
            assert item['startArrowhead'] is None and item['endArrowhead'] is None
            drawing.line([(x + point[0], y + point[1]) for point in item['points']], fill=colour, width=item['strokeWidth'])
        elif item['type'] == 'text':
            size = item['fontSize']
            for index, line in enumerate(item['text'].split('\n')):
                drawing.text((x, y + index * size * 1.4), line, font=font(size), fill=colour, anchor='lt')
        else:
            raise ValueError('Unsupported deterministic renderer element')
    output = io.BytesIO()
    image.save(output, format='PNG', optimize=True)
    return output.getvalue()


LABELS = [
    ('full', 4, 'All four criteria are met: Owner, Pet, Appointment and Vet have the specified attributes; the three required associations are present; each pet has one owner and each appointment one pet and one vet, with zero-or-many multiplicities at the other ends.', ['full', 'diagram', 'visual_diagram']),
    ('beyond_full', 4, 'c1–c4 are all met as in the complete diagram. Attribute types, public visibility notation and relevant methods add useful detail but are not required and cannot exceed four marks. They must not become compulsory for other responses.', ['beyond_full', 'diagram', 'visual_diagram']),
    ('reversed_multiplicity', 3, 'c1 classes, c2 attributes and c3 associations are correct. The Owner–Pet multiplicities are reversed: the diagram gives each owner one pet and permits several owners per pet. This loses c4 only, without removing the correctly drawn association or attribute credit.', ['partial', 'diagram', 'visual_diagram', 'boundary_or_logic']),
    ('no_attributes', 3, 'c1 all four classes, c3 associations and c4 multiplicities remain demonstrated. No class contains its required attributes, so c2 alone is lost. Do not infer the absent attributes from the class names or model answer.', ['partial', 'diagram', 'visual_diagram', 'missing_requirement']),
    ('irrelevant', 0, 'The drawing models Car, Engine, Garage and Wheel, with no required clinic classes or their attributes, associations or multiplicities. None of c1–c4 is demonstrated. Legible drawing is optional quality evidence, not exam credit.', ['zero', 'diagram', 'visual_diagram', 'irrelevant']),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='Replace only these generated visual cases in the fixture.')
    parser.add_argument('--previews', type=Path, help='Optional directory for viewable PNG previews.')
    args = parser.parse_args()
    data = json.loads(FIXTURE.read_text())
    source = next(case['source'] for case in data['cases'] if case['request']['bankId'] == '7' and case['request']['questionNumber'] == 25)
    generated = []
    for variant, mark, rationale, tags in LABELS:
        answer = scene(variant)
        png = draw_scene(answer)
        case_id = 'p7-q25-0-visual_' + variant
        generated.append(dict(id=case_id, split='development', tags=tags,
            request=dict(bankId='7', questionNumber=25, partIndex=0, answer=answer, diagramPng='data:image/png;base64,' + base64.b64encode(png).decode()),
            source=dict(source),
            expected=dict(status='marked', mark=mark, range=[mark, mark], rationale=rationale, criterionIds=['c1', 'c2', 'c3', 'c4'],
                feedbackExpectations=['Use the rendered PNG and matching scene together; no visual ambiguity is intentionally present.',
                    'Ground relationship diagnoses in the connector and endpoint/cardinality label IDs.',
                    'Missing attributes must not be invented, and optional methods or style cannot create mark requirements.'],
                qualityExpectations=[dict(factor='diagram_quality', range=[7, 10], basis='Class boxes, readable labels and any connectors are deliberately separated and clearly laid out; substantive content mistakes are evaluated against the rubric separately.')])))
        if args.previews:
            args.previews.mkdir(parents=True, exist_ok=True)
            (args.previews / (case_id + '.png')).write_bytes(png)
    if args.write:
        generated_ids = {case['id'] for case in generated}
        data['cases'] = [case for case in data['cases'] if case['id'] not in generated_ids] + generated
        FIXTURE.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
    print(f'{len(generated)} matching image/scene cases generated; fixture {"updated" if args.write else "unchanged"}.')


if __name__ == '__main__':
    main()
