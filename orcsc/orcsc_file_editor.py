import xml.etree.ElementTree as ET
from typing import List

from orcsc.model.class_enum import YachtClass
from orcsc.model.cls_row import ClsRow


def parse_orcsc_file(file):
    tree = ET.parse(file)
    for item in tree.getroot().findall('./Cls/ROW'):
        cls_row = ClsRow.from_element(item)
        xml = cls_row.to_element()


def add_classes(input_file, output_file, classes: List[ClsRow]):
    tree = ET.parse(input_file)
    Cls = tree.getroot().find('./Cls')
    for cls_row in classes:
        Cls.append(cls_row.to_element())
    # Add report printing directives
    reports = tree.getroot().find('./reports')
    # add entry list report printing
    #TODO: Check if not preexisting reports in XML file
    for cls_row in classes:
        if cls_row.get_yacht_class() == YachtClass.ORC:
            entry_list_orc = ET.parse("model/EntryListReportORC.xml")
            entry_list_orc.getroot().set('id', cls_row.ClassId)
            reports.append(entry_list_orc.getroot())
        else:
            entry_list_one_design = ET.parse("model/EntryListReportZ.xml")
            entry_list_one_design.getroot().set('id', cls_row.ClassId)
            reports.append(entry_list_one_design.getroot())
    # add race results report printing
    for cls_row in classes:
        if cls_row.get_yacht_class() == YachtClass.ORC:
            race_results_orc = ET.parse("model/RaceResultsReportORC.xml")
            race_results_orc.getroot().set('id', cls_row.ClassId)
            reports.append(race_results_orc.getroot())
        else:
            race_results_one_design = ET.parse("model/RaceResultsReportZ.xml")
            race_results_one_design.getroot().set('id', cls_row.ClassId)
            reports.append(race_results_one_design.getroot())
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


def get_races(input_file):
    tree = ET.parse(input_file)
    return tree.getroot().find('./Race')


def get_race_ids(input_file):
    races = get_races(input_file)
    return [int(race.find('RaceId').text) for race in races]


def add_races(input_file, output_file, races):
    tree = ET.parse(input_file)
    Race = tree.getroot().find('./Race')
    existing_ids = get_race_ids(input_file)
    last_id = max(existing_ids) if len(existing_ids) > 0 else 1
    for race_row in races:
        race_row.RaceId = last_id + 1
        last_id += 1
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
