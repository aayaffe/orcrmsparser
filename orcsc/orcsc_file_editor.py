import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List
import os
from prompt_toolkit import print_formatted_text as print, HTML

from orcsc.model.class_enum import YachtClass
from orcsc.model.cls_row import ClsRow
from orcsc.model.event_row import EventRow
from orcsc.model.fleet_row import FleetRow
from orcsc.model.logo import logo
from utils import backup_file, default_input, create_folder


def parse_orcsc_file(file):
    tree = ET.parse(file)
    for item in tree.getroot().findall('./Cls/ROW'):
        cls_row = ClsRow.from_element(item)
        xml = cls_row.to_element()


def remove_namespace(doc, namespace):
    """Remove namespace in the passed document in place."""
    ns = f'{{{namespace}}}'  # namespace as {namespace}
    for elem in doc.iter():
        if elem.tag.startswith(ns):
            elem.tag = elem.tag[len(ns):]  # strip ns


def add_event(input_file, output_file, event_title, start_date, end_date, venue, organizer):
    tree = ET.parse(input_file)
    Event = tree.getroot().find('./Event')
    # Remove existing event
    for item in Event.findall('./ROW'):
        Event.remove(item)
    event_row = EventRow("ROW", EventTitle=event_title, StartDate=start_date, EndDate=end_date, Venue=venue,
                         Organizer=organizer)

    Event.append(event_row.to_element())
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)


def add_classes(input_file, output_file, classes: List[ClsRow]):
    tree = ET.parse(input_file)
    Cls = tree.getroot().find('./Cls')
    for cls_row in classes:
        Cls.append(cls_row.to_element())
    # add_reports(classes, tree)
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)


def add_reports(input_file, output_file, classes: List[ClsRow]):
    tree = ET.parse(input_file)
    reports = tree.getroot().find('./reports')
    # Add Event results
    preexisting_report = reports.find(f".//report[@name='TEventResults']")
    if preexisting_report is not None:
        reports.remove(preexisting_report)
    event_results_report = ET.parse(os.path.join(os.path.dirname(__file__), "model", "EventResults.xml"))
    # event_results_report = ET.parse("model/EventResults.xml")
    reports.append(event_results_report.getroot())

    #Add Scratch Sheet
    preexisting_report = reports.find(f".//report[@name='TScratchSheet']")
    if preexisting_report is not None:
        reports.remove(preexisting_report)
    scratch_sheet_report = ET.parse(os.path.join(os.path.dirname(__file__), "model", "ScratchSheetReport.xml"))
    # scratch_sheet_report = ET.parse("model/ScratchSheetReport.xml")
    reports.append(scratch_sheet_report.getroot())

    # add entry list report printing
    for cls_row in classes:
        preexisting_report = reports.find(f".//report[@name='TEntryList'][@id='{cls_row.ClassId}']")
        if preexisting_report is not None:
            reports.remove(preexisting_report)
        if cls_row.get_yacht_class() == YachtClass.ORC:
            entry_list_orc = ET.parse(os.path.join(os.path.dirname(__file__), "model", "EntryListReportORC.xml"))
            # entry_list_orc = ET.parse("model/EntryListReportORC.xml")
            entry_list_orc.getroot().set('id', cls_row.ClassId)
            reports.append(entry_list_orc.getroot())
        else:
            entry_list_one_design = ET.parse(os.path.join(os.path.dirname(__file__), "model", "EntryListReportZ.xml"))
            # entry_list_one_design = ET.parse("model/EntryListReportZ.xml")
            entry_list_one_design.getroot().set('id', cls_row.ClassId)
            reports.append(entry_list_one_design.getroot())
    # add race results report printing
    for cls_row in classes:
        preexisting_report = reports.find(f".//report[@name='TRaceResults'][@id='{cls_row.ClassId}']")
        if preexisting_report is not None:
            reports.remove(preexisting_report)
        if cls_row.get_yacht_class() == YachtClass.ORC:
            race_results_orc = ET.parse(os.path.join(os.path.dirname(__file__), "model", "RaceResultsReportORC.xml"))
            # race_results_orc = ET.parse("model/RaceResultsReportORC.xml")
            race_results_orc.getroot().set('id', cls_row.ClassId)
            reports.append(race_results_orc.getroot())
        else:
            race_results_one_design = ET.parse(os.path.join(os.path.dirname(__file__), "model", "RaceResultsReportZ.xml"))
            # race_results_one_design = ET.parse("model/RaceResultsReportZ.xml")
            race_results_one_design.getroot().set('id', cls_row.ClassId)
            reports.append(race_results_one_design.getroot())
    ET.indent(tree, space="\t", level=0)
    remove_namespace(tree, "http://www.topografix.com/GPX/1/1")
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

def get_race_names(input_file):
    races = get_races(input_file)
    return [f"{int(race.find('RaceId').text)}: {race.find('ClassId').text}, {race.find('RaceName').text}" for race in races]


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


def add_fleets(input_file, output_file, new_fleets):
    tree = ET.parse(input_file)
    Fleet = tree.getroot().find('./Fleet')
    yids = get_yids(get_fleets(input_file))
    max_yid = 0
    if len(yids) > 0:
        max_yid = max(yids)
    for fleet_row in new_fleets:
        max_yid = max_yid + 1
        fleet_row.YID = max_yid
        Fleet.append(fleet_row.to_element())
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)
    pass


def get_fleets(input_file):
    tree = ET.parse(input_file)
    fleets = tree.getroot().find('./Fleet')
    fleet_rows = []
    for fleet in fleets:
        fleet_rows.append(FleetRow.from_element(fleet))
    return fleet_rows


def get_yids(fleets):
    return [int(fleet.YID) for fleet in fleets]


def add_races_existing_file(scoring_file, races):
    backup_file(scoring_file)
    print(HTML("<ansigreen>Current races in file:</ansigreen>"))
    print("\n".join(str(race) for race in get_race_names(scoring_file)))
    print(HTML("<ansigreen>Races to add:</ansigreen>"))
    print("\n".join(f"{race.ClassId}, {race.RaceName}" for race in races))
    response = default_input("Do you want to add these races?",'n',['y','n'],True)
    if response == 'y':
        add_races(scoring_file, scoring_file, races)
        print("Races added successfully.")
    else:
        print("No races were added.")


def create_new_scoring_file(event_title, venue= "Haifa Bay", organizer="CYC", output_file=None, start_date=None, end_date=None, classes=None, races=None, boats=None):
    template_file = os.path.join(os.path.dirname(__file__), "templates", "template.orcsc")
    print(template_file)
    # template_file = "/templates/template.orcsc"
    if output_file is None:
        output_file = f"output/{event_title}.orcsc"
    create_folder(output_file)
    print("Creating new output file:", output_file)
    if start_date is None:
        start_date = datetime.now()
        print("Set default start date to today")
    if end_date is None:
        end_date = datetime.now()
        print("Set default end date to today")
    add_event(template_file, output_file, event_title=event_title, start_date=start_date,
              end_date=end_date, venue=venue, organizer=organizer)
    print("Added event to output file")
    if classes is not None:
        add_classes(output_file, output_file, classes)
        add_reports(output_file, output_file, classes)
    print("Added classes and reports to output file")
    with open(os.path.join(os.path.dirname(__file__), "logo.txt"), "r") as logo_file:
        logo_str = logo_file.read()
    logos = [
        logo("logo", _filename="cyc.png", _name="center", _mediatype="image/", _text_val=logo_str),
        logo("logo", _filename="", _name="right", _mediatype="image/"),
        logo("logo", _filename="", _name="left", _mediatype="image/")
    ]
    add_logos(output_file, output_file, logos)
    print("Added logos to output file")
    if races is not None:
        add_races(output_file, output_file, races)
        print("Added Races to output file")
    if boats is not None:
        add_fleets(output_file, output_file, boats)
        print("Added boats to output file")
