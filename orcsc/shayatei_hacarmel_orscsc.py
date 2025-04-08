import csv
from datetime import datetime

from orcsc.model.class_enum import YachtClass
from orcsc.model.cls_row import ClsRow
from orcsc.model.fleet_row import FleetRow
from orcsc.model.race_row import RaceRow
from orcsc.model.scoring_codes_enum import ScoringCode
from orcsc.orcsc_file_editor import create_new_scoring_file

scoring_file = "F:\odrive\Google Drive\שיט\קהילת שייטים כרמל\שיוטים ואירועים\\2025\ליגת החורף 2025\\results.orcsc"

test_file = r"test_files\test.orcsc"

start_time = datetime(2025, 4, 5, 10, 35, 0)
scoring_code = ScoringCode.TOT_Triple_Number_Windward_Leeward_High
race_name = "Race"
races = [
    RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="O1", ScoringType=scoring_code.value),
    RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="O2", ScoringType=scoring_code.value),
    RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="O3", ScoringType=scoring_code.value),
    # RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="SN", ScoringType=ScoringCode.TOT_Custom.value),
    # RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="SE", ScoringType=ScoringCode.TOT_Custom.value),
    # RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="SF", ScoringType=ScoringCode.TOT_Custom.value),
    RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="Z", ScoringType=ScoringCode.TOT_Custom.value)
]


# add_races_existing_file(test_file, races)

def get_boats_from_registration_csv(csv_file, class_id, class_name=None, class_column="class",
                                    yacht_name_column="סירה", sail_number_column=None):
    boats = []
    with open(csv_file, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            if row[class_column] == class_name or class_name is None:
                sail_number = None
                if sail_number_column is not None:
                    sail_number = row[sail_number_column]
                boats.append(FleetRow("ROW", YachtName=row[yacht_name_column], SailNo=sail_number,
                                      ClassId=class_id))
    return boats


# csv_file = r"C:\Users\aayaffe\Downloads\!temp\רישום לשיוט אמיר רוסו 2025.csv"
# boats = get_boats_from_registration_csv(csv_file, "Z", yacht_name_column='boat-name')


#TODO: Add ORC from list
#Todo: Add races to existing file


# create_new_scoring_file("Amir Russo Memorial Regatta",
#                         organizer="Etgarim",
#                         start_date=datetime(2025, 4, 5),
#                         end_date=datetime(2025, 4, 5),
#                         classes=[
#                             ClsRow("ROW", ClassId="O1", ClassName="ORC1", _class_enum=YachtClass.ORC),
#                             ClsRow("ROW", ClassId="O2", ClassName="ORC2", _class_enum=YachtClass.ORC),
#                             ClsRow("ROW", ClassId="O3", ClassName="ORC3", _class_enum=YachtClass.ORC),
#                             ClsRow("ROW", ClassId="SN", ClassName="Snonit", _class_enum=YachtClass.OneDesign),
#                             ClsRow("ROW", ClassId="SE", ClassName="Snonit EDU", _class_enum=YachtClass.OneDesign),
#                             ClsRow("ROW", ClassId="SF", ClassName="Sayfan", _class_enum=YachtClass.OneDesign),
#                             ClsRow("ROW", ClassId="Z", ClassName="Amami", _class_enum=YachtClass.OneDesign)
#                         ],
#                         races=races,
#                         boats=boats
#                         )


