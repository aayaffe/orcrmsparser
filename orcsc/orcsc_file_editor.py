import xml.etree.ElementTree as ET

from orcsc.model.cls_row import ClsRow


def parse_orcsc_file(file):
    tree = ET.parse(file)
    for item in tree.getroot().findall('./Cls/ROW'):
        cls_row = ClsRow.from_element(item)
        xml = cls_row.to_element()


def add_classes(input_file, output_file, classes):
    tree = ET.parse(input_file)
    Cls = tree.getroot().find('./Cls')
    for cls_row in classes:
        Cls.append(cls_row.to_element())
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)


def add_logos(input_file, output_file, logos):
    tree = ET.parse(input_file)
    reports = tree.getroot().find('./reports')
    for l in reports.findall('./logo'):
        reports.remove(l)
    reports = tree.getroot().find('./reports')
    for logo in logos:
        reports.append(logo.to_element())
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)


def add_races(input_file, output_file, races):
    tree = ET.parse(input_file)
    Race = tree.getroot().find('./Race')
    for race_row in races:
        Race.append(race_row.to_element())
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)


def add_fleets(input_file, output_file, fleets):
    tree = ET.parse(input_file)
    Fleet = tree.getroot().find('./Fleet')
    for fleet_row in fleets:
        Fleet.append(fleet_row.to_element())
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)
    pass
