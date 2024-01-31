from datetime import datetime

from orcsc.model.cls_row import ClsRow
from orcsc.model.fleet_row import FleetRow
from orcsc.model.logo import logo
from orcsc.model.race_row import RaceRow
from orcsc.orcsc_file_editor import add_classes, add_logos, add_races, add_fleets

input_file = "test.orcsc"
output_file = "testout.orcsc"

new_classes = [
    ClsRow("ROW", ClassId="O1", ClassName="ORC1"),
    ClsRow("ROW", ClassId="O2", ClassName="ORC2"),
    ClsRow("ROW", ClassId="O3", ClassName="ORC3"),
    # ClsRow("ROW", ClassId="SN", ClassName="Snonit"),
    # ClsRow("ROW", ClassId="SE", ClassName="Snonit EDU"),
    # ClsRow("ROW", ClassId="SF", ClassName="Sayfan"),
    ClsRow("ROW", ClassId="Z", ClassName="Amami")
]
add_classes(input_file, output_file, new_classes)

with open("logo.txt", "r") as logo_file:
    logo_str = logo_file.read()

logos = [
    logo("logo", _filename="cyc.png", _name="center", _mediatype="image/", _text_val=logo_str),
    logo("logo", _filename="", _name="right", _mediatype="image/"),
    logo("logo", _filename="", _name="left", _mediatype="image/")
]
add_logos(output_file, output_file, logos)
start_time = datetime(2024, 2, 2, 10, 5, 0)
races = [
    RaceRow("ROW", RaceId=1, RaceName="Race 1", StartTime=start_time, ClassId="O1"),
    RaceRow("ROW", RaceId=2, RaceName="Race 1", StartTime=start_time, ClassId="O2"),
    RaceRow("ROW", RaceId=3, RaceName="Race 1", StartTime=start_time, ClassId="Z")
]
add_races(output_file, output_file, races)

# fleets = [
#     FleetRow("ROW", YID=1, YachtName="Yacht1")
# ]
#
# add_fleets(output_file, output_file, fleets)


 #TODO: Add print setting for results in website
 #TODO: Add Amami from list (With custom TOT)
 #TODO: Add ORC from list
 #Todo: Add races to existing file
 #TODO: Set race scoring option and discardble and privsional