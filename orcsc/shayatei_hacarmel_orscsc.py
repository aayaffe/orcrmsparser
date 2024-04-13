from datetime import datetime

from orcsc.model.class_enum import YachtClass
from orcsc.model.cls_row import ClsRow
from orcsc.model.fleet_row import FleetRow
from orcsc.model.logo import logo
from orcsc.model.race_row import RaceRow
from orcsc.model.scoring_codes_enum import ScoringCode
from orcsc.orcsc_file_editor import add_classes, add_logos, add_races, add_fleets, add_reports
from utils import backup_file

input_file = "D:/odrive/Google Drive/שיט/קהילת שייטים כרמל/שיוטים ואירועים/2024/ליגת החורף 2024/results.orcsc"
output_file = "testout.orcsc"

# create a file backup
backup_file(input_file)

new_classes = [
    ClsRow("ROW", ClassId="O1", ClassName="ORC1", _class_enum=YachtClass.ORC),
    ClsRow("ROW", ClassId="O2", ClassName="ORC2", _class_enum=YachtClass.ORC),
    # ClsRow("ROW", ClassId="O3", ClassName="ORC3"),
    # ClsRow("ROW", ClassId="SN", ClassName="Snonit"),
    # ClsRow("ROW", ClassId="SE", ClassName="Snonit EDU"),
    # ClsRow("ROW", ClassId="SF", ClassName="Sayfan"),
    ClsRow("ROW", ClassId="Z", ClassName="Amami", _class_enum=YachtClass.OneDesign)
]
# add_reports(input_file, output_file, new_classes)

# add_classes(input_file, output_file, new_classes)

# with open("logo.txt", "r") as logo_file:
#     logo_str = logo_file.read()
#
# logos = [
#     logo("logo", _filename="cyc.png", _name="center", _mediatype="image/", _text_val=logo_str),
#     logo("logo", _filename="", _name="right", _mediatype="image/"),
#     logo("logo", _filename="", _name="left", _mediatype="image/")
# ]
# add_logos(output_file, output_file, logos)
#
start_time = datetime(2024, 4, 13, 10, 55, 0)
scoring_code = ScoringCode.TOT_All_Purpose.value
races = [
    RaceRow("ROW", RaceName="Race 6 (Etgarim)", StartTime=start_time, ClassId="O1", ScoringType=scoring_code),
    RaceRow("ROW", RaceName="Race 6 (Etgarim)", StartTime=start_time, ClassId="O2", ScoringType=scoring_code),
    RaceRow("ROW", RaceName="Race 6 (Etgarim)", StartTime=start_time, ClassId="Z", ScoringType=ScoringCode.TOT_Custom.value)
]
add_races(input_file, output_file, races)
# fleets = [
#     FleetRow("ROW", YID=1, YachtName="Yacht1")
# ]
#
# add_fleets(output_file, output_file, fleets)


#TODO: Add Amami from list (With custom TOT)
#TODO: Add ORC from list
#Todo: Add races to existing file
#TODO: Set race scoring option and discardble and privsional
