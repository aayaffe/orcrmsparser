import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List
import os
import logging
import json

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


def add_event(input_file, output_file, event_title, start_date, end_date, venue, organizer, gmt_offset_seconds=None, tz_abbr=None):
    tree = ET.parse(input_file)
    Event = tree.getroot().find('./Event')
    # Remove existing event
    for item in Event.findall('./ROW'):
        Event.remove(item)
    
    # If GMT offset not provided, calculate from current timezone
    if gmt_offset_seconds is None:
        from datetime import datetime, timezone
        # Get local timezone offset
        local_tz = datetime.now().astimezone().tzinfo
        gmt_offset = local_tz.utcoffset(datetime.now())
        gmt_offset_seconds = int(gmt_offset.total_seconds())
    
    # If timezone abbreviation not provided, use calculated one
    if tz_abbr is None:
        hours = gmt_offset_seconds // 3600
        sign = '+' if gmt_offset_seconds >= 0 else '-'
        tz_abbr = f"GMT{sign}{abs(hours):02d}"
    
    event_row = EventRow("ROW", EventTitle=event_title, StartDate=start_date, EndDate=end_date, Venue=venue,
                         Organizer=organizer, UTCOffset=gmt_offset_seconds, TZAbbr=tz_abbr)

    Event.append(event_row.to_element())
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)


def add_classes(input_file, output_file, classes: List[ClsRow]):
    tree = ET.parse(input_file)
    Cls = tree.getroot().find('./Cls')
    for cls_row in classes:
        Cls.append(cls_row.to_element())
    logging.info(f"Classes added: {classes}")
    add_reports(input_file, output_file, classes)
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
    logging.info("Current races in file:")
    logging.info("\n".join(str(race) for race in get_race_names(scoring_file)))
    logging.info("Races to add:")
    logging.info("\n".join(f"{race.ClassId}, {race.RaceName}" for race in races))
    add_races(scoring_file, scoring_file, races)
    logging.info("Races added successfully.")


def create_new_scoring_file(event_title, venue="Haifa Bay", organizer="CYC", output_file=None, start_date=None, end_date=None, classes=None, races=None, boats=None, gmt_offset_seconds=None):
    template_file = os.path.join(os.path.dirname(__file__), "templates", "template.orcsc")
    logging.info(f"Using template file: {template_file}")
    
    if output_file is None:
        raise ValueError("output_file parameter is required")
    
    create_folder(output_file)
    logging.info(f"Creating new output file: {output_file}")
    
    if start_date is None:
        start_date = datetime.now()
        logging.info("Set default start date to today")
    if end_date is None:
        end_date = datetime.now()
        logging.info("Set default end date to today")
    add_event(template_file, output_file, event_title=event_title, start_date=start_date,
              end_date=end_date, venue=venue, organizer=organizer, gmt_offset_seconds=gmt_offset_seconds)
    logging.info("Added event to output file")
    if classes is not None:
        add_classes(output_file, output_file, classes)
        # add_reports(output_file, output_file, classes)
    logging.info("Added classes and reports to output file")
    with open(os.path.join(os.path.dirname(__file__), "logo.txt"), "r") as logo_file:
        logo_str = logo_file.read()
    logos = [
        logo("logo", _filename="cyc.png", _name="center", _mediatype="image/", _text_val=logo_str),
        logo("logo", _filename="", _name="right", _mediatype="image/"),
        logo("logo", _filename="", _name="left", _mediatype="image/")
    ]
    add_logos(output_file, output_file, logos)
    logging.info("Added logos to output file")
    if races is not None:
        add_races(output_file, output_file, races)
        logging.info("Added Races to output file")
    if boats is not None:
        add_fleets(output_file, output_file, boats)
        logging.info("Added boats to output file")


def update_fleet(input_file, output_file, updated_fleet: FleetRow):
    """
    Update an existing fleet entry in the XML file based on YID.
    Only update fields provided (non-None) in updated_fleet, retain all other data.
    """
    tree = ET.parse(input_file)
    Fleet = tree.getroot().find('./Fleet')
    updated = False
    for fleet_elem in Fleet.findall('./ROW'):
        yid_elem = fleet_elem.find('YID')
        if yid_elem is not None and int(yid_elem.text) == int(updated_fleet.YID):
            # Convert XML element to FleetRow
            existing_row = FleetRow.from_element(fleet_elem)
            # Update only fields that are not None in updated_fleet
            for field in vars(updated_fleet):
                value = getattr(updated_fleet, field)
                if value is not None and field != "_tag":
                    setattr(existing_row, field, value)
            # Replace the fleet element with the updated one
            Fleet.remove(fleet_elem)
            Fleet.append(existing_row.to_element())
            updated = True
            break
    if not updated:
        raise ValueError(f"Fleet with YID {updated_fleet.YID} not found.")
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)


def add_fleet_from_orc_json(input_file, output_file, orc_json, class_id=None):
    """
    Add a fleet (boat) entry from ORC API JSON to the XML file.
    """
    tree = ET.parse(input_file)
    Fleet = tree.getroot().find('./Fleet')
    # Determine next YID
    yids = get_yids(get_fleets(input_file))
    next_yid = max(yids) + 1 if yids else 1

    # Map JSON fields to FleetRow fields
    fleet_row = FleetRow("ROW")
    fleet_row.YID = next_yid
    fleet_row.SailNo = orc_json.get("SailNo")
    fleet_row.YachtName = orc_json.get("YachtName")
    fleet_row.BowNo = ""
    fleet_row.ClassId = class_id or orc_json.get("ClassId") or ""
    fleet_row.DivId = ""
    fleet_row.changeHeatNo = ""
    fleet_row.LOA = orc_json.get("LOA")
    fleet_row.CDL = orc_json.get("CDL")
    fleet_row.GPH = orc_json.get("GPH")
    fleet_row.APHD = orc_json.get("APHD")
    fleet_row.CTOD = ""
    fleet_row.CTOT = ""
    fleet_row.YClass = orc_json.get("Class")
    fleet_row.Owner = ""
    fleet_row.Skipper = ""
    fleet_row.Sponsor = ""
    fleet_row.Club = ""
    fleet_row.Nation = orc_json.get("NatAuth")
    fleet_row.EMail = ""
    fleet_row.Phone = ""
    fleet_row.CertType = orc_json.get("C_Type")
    fleet_row.IssueDate = orc_json.get("IssueDate")
    fleet_row.NatAuth = orc_json.get("NatAuth")
    fleet_row.BIN = orc_json.get("BIN")
    fleet_row.RefNo = orc_json.get("RefNo")
    fleet_row.RMS2 = ""
    fleet_row.Family = orc_json.get("Family")
    fleet_row.Points = ""
    fleet_row.Position = ""
    fleet_row.PtsHash = ""
    fleet_row.PtsHash2 = ""
    fleet_row.RMS = ""#json.dumps(orc_json, separators=(',', ':'))
    fleet_row.SNInt = None
    fleet_row.HeatNo = ""
    fleet_row.ILCWA = orc_json.get("ILCWA")
    fleet_row.TMF_Inshore = orc_json.get("TMF_Inshore")
    fleet_row.APHT = orc_json.get("APHT")
    fleet_row.MHRD = orc_json.get("MHRD", 0)
    fleet_row.MHRT = orc_json.get("MHRT", 0)
    fleet_row.OSN = orc_json.get("OSN")
    fleet_row.TMF_Offshore = orc_json.get("TMF_Offshore")
    fleet_row.TND_Offshore_Low = orc_json.get("TND_Offshore_Low")
    fleet_row.TN_Offshore_Low = orc_json.get("TN_Offshore_Low")
    fleet_row.TND_Offshore_Medium = orc_json.get("TND_Offshore_Medium")
    fleet_row.TN_Offshore_Medium = orc_json.get("TN_Offshore_Medium")
    fleet_row.TND_Offshore_High = orc_json.get("TND_Offshore_High")
    fleet_row.TN_Offshore_High = orc_json.get("TN_Offshore_High")
    fleet_row.TND_Inshore_Low = orc_json.get("TND_Inshore_Low")
    fleet_row.TN_Inshore_Low = orc_json.get("TN_Inshore_Low")
    fleet_row.TND_Inshore_Medium = orc_json.get("TND_Inshore_Medium")
    fleet_row.TN_Inshore_Medium = orc_json.get("TN_Inshore_Medium")
    fleet_row.TND_Inshore_High = orc_json.get("TND_Inshore_High")
    fleet_row.TN_Inshore_High = orc_json.get("TN_Inshore_High")
    fleet_row.Pred_Up_TOD = orc_json.get("Pred_Up_TOD")
    fleet_row.Pred_Up_TOT = orc_json.get("Pred_Up_TOT")
    fleet_row.Pred_Down_TOD = orc_json.get("Pred_Down_TOD")
    fleet_row.Pred_Down_TOT = orc_json.get("Pred_Down_TOT")
    fleet_row.US_PREDUP_TOD = orc_json.get("US_PREDUP_TOD")
    fleet_row.US_PREDUP_TOT = orc_json.get("US_PREDUP_TOT")
    fleet_row.US_PREDRC_TOD = orc_json.get("US_PREDRC_TOD")
    fleet_row.US_PREDRC_TOT = orc_json.get("US_PREDRC_TOT")
    fleet_row.US_PREDDN_TOD = orc_json.get("US_PREDDN_TOD")
    fleet_row.US_PREDDN_TOT = orc_json.get("US_PREDDN_TOT")
    fleet_row.US_PREDUP_L_TOD = orc_json.get("US_PREDUP_L_TOD")
    fleet_row.US_PREDUP_L_TOT = orc_json.get("US_PREDUP_L_TOT")
    fleet_row.US_PREDUP_LM_TOD = orc_json.get("US_PREDUP_LM_TOD")
    fleet_row.US_PREDUP_LM_TOT = orc_json.get("US_PREDUP_LM_TOT")
    fleet_row.US_PREDUP_M_TOD = orc_json.get("US_PREDUP_M_TOD")
    fleet_row.US_PREDUP_M_TOT = orc_json.get("US_PREDUP_M_TOT")
    fleet_row.US_PREDUP_MH_TOD = orc_json.get("US_PREDUP_MH_TOD")
    fleet_row.US_PREDUP_MH_TOT = orc_json.get("US_PREDUP_MH_TOT")
    fleet_row.US_PREDUP_H_TOD = orc_json.get("US_PREDUP_H_TOD")
    fleet_row.US_PREDUP_H_TOT = orc_json.get("US_PREDUP_H_TOT")
    fleet_row.US_PREDDN_L_TOD = orc_json.get("US_PREDDN_L_TOD")
    fleet_row.US_PREDDN_L_TOT = orc_json.get("US_PREDDN_L_TOT")
    fleet_row.US_PREDDN_LM_TOD = orc_json.get("US_PREDDN_LM_TOD")
    fleet_row.US_PREDDN_LM_TOT = orc_json.get("US_PREDDN_LM_TOT")
    fleet_row.US_PREDDN_M_TOD = orc_json.get("US_PREDDN_M_TOD")
    fleet_row.US_PREDDN_M_TOT = orc_json.get("US_PREDDN_M_TOT")
    fleet_row.US_PREDDN_MH_TOD = orc_json.get("US_PREDDN_MH_TOD")
    fleet_row.US_PREDDN_MH_TOT = orc_json.get("US_PREDDN_MH_TOT")
    fleet_row.US_PREDDN_H_TOD = orc_json.get("US_PREDDN_H_TOD")
    fleet_row.US_PREDDN_H_TOT = orc_json.get("US_PREDDN_H_TOT")
    fleet_row.US_PREDRC_L_TOD = orc_json.get("US_PREDRC_L_TOD")
    fleet_row.US_PREDRC_L_TOT = orc_json.get("US_PREDRC_L_TOT")
    fleet_row.US_PREDRC_LM_TOD = orc_json.get("US_PREDRC_LM_TOD")
    fleet_row.US_PREDRC_LM_TOT = orc_json.get("US_PREDRC_LM_TOT")
    fleet_row.US_PREDRC_M_TOD = orc_json.get("US_PREDRC_M_TOD")
    fleet_row.US_PREDRC_M_TOT = orc_json.get("US_PREDRC_M_TOT")
    fleet_row.US_PREDRC_MH_TOD = orc_json.get("US_PREDRC_MH_TOD")
    fleet_row.US_PREDRC_MH_TOT = orc_json.get("US_PREDRC_MH_TOT")
    fleet_row.US_PREDRC_H_TOD = orc_json.get("US_PREDRC_H_TOD")
    fleet_row.US_PREDRC_H_TOT = orc_json.get("US_PREDRC_H_TOT")
    fleet_row.US_CHIMAC_UP_TOT = orc_json.get("US_CHIMAC_UP_TOT")
    fleet_row.US_CHIMAC_AP_TOT = orc_json.get("US_CHIMAC_AP_TOT")
    fleet_row.US_CHIMAC_DN_TOT = orc_json.get("US_CHIMAC_DN_TOT")
    fleet_row.US_BAYMAC_CV_TOT = orc_json.get("US_BAYMAC_CV_TOT")
    fleet_row.US_BAYMAC_SH_TOT = orc_json.get("US_BAYMAC_SH_TOT")
    fleet_row.US_HARVMOON_TOD = orc_json.get("US_HARVMOON_TOD")
    fleet_row.US_HARVMOON_TOT = orc_json.get("US_HARVMOON_TOT")
    fleet_row.US_VICMAUI_TOT = orc_json.get("US_VICMAUI_TOT")
    fleet_row.US_5B_L_TOD = orc_json.get("US_5B_L_TOD")
    fleet_row.US_5B_L_TOT = orc_json.get("US_5B_L_TOT")
    fleet_row.US_5B_LM_TOD = orc_json.get("US_5B_LM_TOD")
    fleet_row.US_5B_LM_TOT = orc_json.get("US_5B_LM_TOT")
    fleet_row.US_5B_M_TOD = orc_json.get("US_5B_M_TOD")
    fleet_row.US_5B_M_TOT = orc_json.get("US_5B_M_TOT")
    fleet_row.US_5B_MH_TOD = orc_json.get("US_5B_MH_TOD")
    fleet_row.US_5B_MH_TOT = orc_json.get("US_5B_MH_TOT")
    fleet_row.US_5B_H_TOD = orc_json.get("US_5B_H_TOD")
    fleet_row.US_5B_H_TOT = orc_json.get("US_5B_H_TOT")
    fleet_row.US_AP_L_TOD = orc_json.get("US_AP_L_TOD")
    fleet_row.US_AP_L_TOT = orc_json.get("US_AP_L_TOT")
    fleet_row.US_AP_LM_TOD = orc_json.get("US_AP_LM_TOD")
    fleet_row.US_AP_LM_TOT = orc_json.get("US_AP_LM_TOT")
    fleet_row.US_AP_M_TOD = orc_json.get("US_AP_M_TOD")
    fleet_row.US_AP_M_TOT = orc_json.get("US_AP_M_TOT")
    fleet_row.US_AP_MH_TOD = orc_json.get("US_AP_MH_TOD")
    fleet_row.US_AP_MH_TOT = orc_json.get("US_AP_MH_TOT")
    fleet_row.US_AP_H_TOD = orc_json.get("US_AP_H_TOD")
    fleet_row.US_AP_H_TOT = orc_json.get("US_AP_H_TOT")
    fleet_row.US_TNAP_L_TOD = orc_json.get("US_TNAP_L_TOD")
    fleet_row.US_TNAP_L_TOT = orc_json.get("US_TNAP_L_TOT")
    fleet_row.US_TNAP_M_TOD = orc_json.get("US_TNAP_M_TOD")
    fleet_row.US_TNAP_M_TOT = orc_json.get("US_TNAP_M_TOT")
    fleet_row.US_TNAP_H_TOD = orc_json.get("US_TNAP_H_TOD")
    fleet_row.US_TNAP_H_TOT = orc_json.get("US_TNAP_H_TOT")
    fleet_row.US_SFBay_L_TOD = orc_json.get("US_SFBay_L_TOD")
    fleet_row.US_SFBay_L_TOT = orc_json.get("US_SFBay_L_TOT")
    fleet_row.US_SFBay_LM_TOD = orc_json.get("US_SFBay_LM_TOD")
    fleet_row.US_SFBay_LM_TOT = orc_json.get("US_SFBay_LM_TOT")
    fleet_row.US_SFBay_M_TOD = orc_json.get("US_SFBay_M_TOD")
    fleet_row.US_SFBay_M_TOT = orc_json.get("US_SFBay_M_TOT")
    fleet_row.US_SFBay_MH_TOD = orc_json.get("US_SFBay_MH_TOD")
    fleet_row.US_SFBay_MH_TOT = orc_json.get("US_SFBay_MH_TOT")
    fleet_row.US_SFBay_H_TOD = orc_json.get("US_SFBay_H_TOD")
    fleet_row.US_SFBay_H_TOT = orc_json.get("US_SFBay_H_TOT")
    fleet_row.US_WL6040_L_TOD = orc_json.get("US_WL6040_L_TOD")
    fleet_row.US_WL6040_L_TOT = orc_json.get("US_WL6040_L_TOT")
    fleet_row.US_WL6040_LM_TOD = orc_json.get("US_WL6040_LM_TOD")
    fleet_row.US_WL6040_LM_TOT = orc_json.get("US_WL6040_LM_TOT")
    fleet_row.US_WL6040_M_TOD = orc_json.get("US_WL6040_M_TOD")
    fleet_row.US_WL6040_M_TOT = orc_json.get("US_WL6040_M_TOT")
    fleet_row.US_WL6040_MH_TOD = orc_json.get("US_WL6040_MH_TOD")
    fleet_row.US_WL6040_MH_TOT = orc_json.get("US_WL6040_MH_TOT")
    fleet_row.US_WL6040_H_TOD = orc_json.get("US_WL6040_H_TOD")
    fleet_row.US_WL6040_H_TOT = orc_json.get("US_WL6040_H_TOT")
    fleet_row.KR_PREDR_TOD = orc_json.get("KR_PREDR_TOD")
    fleet_row.RSA_CD_INS_TOD = orc_json.get("RSA_CD_INS_TOD")
    fleet_row.RSA_CD_INS_TOT = orc_json.get("RSA_CD_INS_TOT")
    fleet_row.RSA_CD_OFF_TOD = orc_json.get("RSA_CD_OFF_TOD")
    fleet_row.RSA_CD_OFF_TOT = orc_json.get("RSA_CD_OFF_TOT")
    fleet_row.BRA_ALL_UP_TOT = orc_json.get("BRA_ALL_UP_TOT")
    fleet_row.BRA_ALL_DN_TOT = orc_json.get("BRA_ALL_DN_TOT")
    fleet_row.BRA_7030_TOT = orc_json.get("BRA_7030_TOT")
    fleet_row.BRA_3070_TOT = orc_json.get("BRA_3070_TOT")
    logging.info(f"Adding fleet from ORC JSON: {fleet_row}")
    Fleet.append(fleet_row.to_element())
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)


def delete_class(input_file, output_file, class_id: str):
    """Delete a class by ClassId from the file."""
    tree = ET.parse(input_file)
    Cls = tree.getroot().find('./Cls')
    if Cls is None:
        raise ValueError("No Cls element found in file")
    
    # Find and remove the class with matching ClassId
    found = False
    for row in Cls.findall('./ROW'):
        if row.find('ClassId') is not None and row.find('ClassId').text == class_id:
            Cls.remove(row)
            found = True
            break
    
    if not found:
        raise ValueError(f"Class with ID '{class_id}' not found")
    
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)
    logging.info(f"Deleted class: {class_id}")


def delete_race(input_file, output_file, race_id: str):
    """Delete a race by RaceId from the file."""
    tree = ET.parse(input_file)
    Races = tree.getroot().find('./Races')
    if Races is None:
        raise ValueError("No Races element found in file")
    
    # Find and remove the race with matching RaceId
    found = False
    for row in Races.findall('./ROW'):
        if row.find('RaceId') is not None and row.find('RaceId').text == race_id:
            Races.remove(row)
            found = True
            break
    
    if not found:
        raise ValueError(f"Race with ID '{race_id}' not found")
    
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)
    logging.info(f"Deleted race: {race_id}")


def delete_boat(input_file, output_file, boat_id: str):
    """Delete a boat by YID from the Fleet."""
    tree = ET.parse(input_file)
    Fleet = tree.getroot().find('./Fleet')
    if Fleet is None:
        raise ValueError("No Fleet element found in file")
    
    # Find and remove the boat with matching YID
    found = False
    for row in Fleet.findall('./ROW'):
        if row.find('YID') is not None and row.find('YID').text == boat_id:
            Fleet.remove(row)
            found = True
            break
    
    if not found:
        raise ValueError(f"Boat with ID '{boat_id}' not found")
    
    ET.indent(tree, space="\t", level=0)
    tree.write(output_file, encoding='utf-8', xml_declaration=False)
    logging.info(f"Deleted boat: {boat_id}")
