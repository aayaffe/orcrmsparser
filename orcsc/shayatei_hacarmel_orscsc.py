from datetime import datetime
import csv

from orcsc.model.class_enum import YachtClass
from orcsc.model.cls_row import ClsRow
from orcsc.model.fleet_row import FleetRow
from orcsc.model.logo import logo
from orcsc.model.race_row import RaceRow
from orcsc.model.scoring_codes_enum import ScoringCode
from orcsc.orcsc_file_editor import add_classes, add_logos, add_races, add_fleets, add_reports, get_fleets, get_yids, \
    add_event
from utils import backup_file

input_file = "./test_files/template.orcsc"
output_file = "testout.orcsc"

# create a file backup
# backup_file(input_file)

start_date = datetime(2024, 5, 31)
end_date = datetime(2024, 5, 31)
add_event(input_file, output_file, event_title="Dakar Memorial Regatta 2024", start_date=start_date, end_date=end_date, venue="Haifa Bay", organizer="CYC")


new_classes = [
    ClsRow("ROW", ClassId="O1", ClassName="ORC1", _class_enum=YachtClass.ORC),
    ClsRow("ROW", ClassId="O2", ClassName="ORC2", _class_enum=YachtClass.ORC),
    ClsRow("ROW", ClassId="O3", ClassName="ORC3", _class_enum=YachtClass.ORC),
    ClsRow("ROW", ClassId="SN", ClassName="Snonit", _class_enum=YachtClass.OneDesign),
    ClsRow("ROW", ClassId="SE", ClassName="Snonit EDU", _class_enum=YachtClass.OneDesign),
    ClsRow("ROW", ClassId="SF", ClassName="Sayfan", _class_enum=YachtClass.OneDesign),
    ClsRow("ROW", ClassId="Z", ClassName="Amami", _class_enum=YachtClass.OneDesign)
]
add_reports(output_file, output_file, new_classes)

add_classes(output_file, output_file, new_classes)

with open("logo.txt", "r") as logo_file:
    logo_str = logo_file.read()

logos = [
    logo("logo", _filename="cyc.png", _name="center", _mediatype="image/", _text_val=logo_str),
    logo("logo", _filename="", _name="right", _mediatype="image/"),
    logo("logo", _filename="", _name="left", _mediatype="image/")
]
add_logos(output_file, output_file, logos)
#
start_time = datetime(2024, 5, 31, 11, 5, 0)
scoring_code = ScoringCode.TOT_Coastal_Long_distance
races = [
    RaceRow("ROW", RaceName="Dakar", StartTime=start_time, ClassId="O1", ScoringType=scoring_code.value),
    RaceRow("ROW", RaceName="Dakar", StartTime=start_time, ClassId="O2", ScoringType=scoring_code.value),
    RaceRow("ROW", RaceName="Dakar", StartTime=start_time, ClassId="O3", ScoringType=scoring_code.value),
    RaceRow("ROW", RaceName="Dakar", StartTime=start_time, ClassId="SN", ScoringType=ScoringCode.TOT_Custom.value),
    RaceRow("ROW", RaceName="Dakar", StartTime=start_time, ClassId="SE", ScoringType=ScoringCode.TOT_Custom.value),
    RaceRow("ROW", RaceName="Dakar", StartTime=start_time, ClassId="SF", ScoringType=ScoringCode.TOT_Custom.value),
    RaceRow("ROW", RaceName="Dakar", StartTime=start_time, ClassId="Z", ScoringType=ScoringCode.TOT_Custom.value)
]
add_races(output_file, output_file, races)


def get_boats_from_registration_csv(csv_file, class_id, class_name="עממי", class_column="קטגוריה",
                                    yacht_name_column="סירה", sail_number_column=None):
    boats = []
    with open(csv_file, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row[class_column] == class_name:
                sail_number = None
                if sail_number_column is not None:
                    sail_number = row[sail_number_column]
                boats.append(FleetRow("ROW", YachtName=row[yacht_name_column], SailNo=sail_number,
                                      ClassId=class_id))
    return boats


csv_file = "C:\programing\orcrmsparser\רישום לשיוט דקר 2024.csv"
boats = get_boats_from_registration_csv(csv_file, "Z", class_name="עממי", class_column="קטגוריה",
                                        yacht_name_column="סירה")

add_fleets(output_file, output_file, boats)


#TODO: Add Amami from list (With custom TOT)
#TODO: Add ORC from list
#Todo: Add races to existing file
#TODO: Set race scoring option and discardble and privsional
