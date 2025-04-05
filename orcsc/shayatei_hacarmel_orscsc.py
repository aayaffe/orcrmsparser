import csv
from datetime import datetime
from orcsc.model.fleet_row import FleetRow
from orcsc.model.logo import logo
from orcsc.model.race_row import RaceRow
from orcsc.model.scoring_codes_enum import ScoringCode
from orcsc.orcsc_file_editor import add_classes, add_logos, add_races, add_fleets, add_reports, add_event, get_races, \
    get_race_names
from utils import backup_file, create_folder, default_input
from prompt_toolkit import print_formatted_text as print, HTML

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


def create_new_scoring_file(event_title, venue= "Haifa Bay", organizer="CYC", output_file=None, start_date=None, end_date=None, classes=None, races=None, boats=None):
    template_file = "./test_files/template.orcsc"
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
    with open("logo.txt", "r") as logo_file:
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


