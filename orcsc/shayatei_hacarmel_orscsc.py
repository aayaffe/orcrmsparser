import csv
from datetime import datetime

from orcsc.model.class_enum import YachtClass
from orcsc.model.cls_row import ClsRow
from orcsc.model.fleet_row import FleetRow
from orcsc.model.race_row import RaceRow
from orcsc.model.scoring_codes_enum import ScoringCode
from orcsc.orcsc_file_editor import create_new_scoring_file, add_fleets

scoring_file = "C:\\programing\\orcrmsparser\\orcsc\\output\\results.orcsc"

# test_file = r"test_files\test.orcsc"

start_time = datetime(2025, 10, 25, 11, 5, 0)
scoring_code = ScoringCode.TOT_Triple_Number_Windward_Leeward_High
race_name = "Race"
races = [
    RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="O1", ScoringType=scoring_code.value),
    RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="O2", ScoringType=scoring_code.value),
    # RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="O3", ScoringType=scoring_code.value),
    RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="SN", ScoringType=ScoringCode.TOT_Custom.value),
    RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="SE", ScoringType=ScoringCode.TOT_Custom.value),
    RaceRow("ROW", RaceName=race_name, StartTime=start_time, ClassId="SF", ScoringType=ScoringCode.TOT_Custom.value),
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


csv_file = r"C:\Users\aayaffe\Downloads\!temp\רישום לשיוט פלצור 2025.csv"
boats1 = get_boats_from_registration_csv(csv_file, "Z", class_column='class', class_name="עממי", yacht_name_column='boat-name')
boats2 = get_boats_from_registration_csv(csv_file, "SF", class_column='class', class_name="סייפן", yacht_name_column='boat-name')
boats3 = get_boats_from_registration_csv(csv_file, "SE", class_column='class', class_name="סנונית מערך קטן", yacht_name_column='boat-name')
boats4 = get_boats_from_registration_csv(csv_file, "SN", class_column='class', class_name="סנונית מערך גדול", yacht_name_column='boat-name')
boats = boats1 + boats2 + boats3 + boats4
# add_fleets(scoring_file, scoring_file, boats)

#TODO: Add ORC from list
# I need to add the option to add boats from the orc certificates API.
# 1. Add a button to add new boats from ORC DB
# 2. After pushing the button add option to select country.
# 3. Country list should be downloaded from the ORC API
# 4. Then show a searchable list of boats from that country. the list should contain all the certificates of that country
# of all types (Regular, double handed, no spinnaker, etc.)
# 5. The list should be searchable by name and by sail number.
# 6. The list should show also date of certificate and certificate type. for boats with more than one certificates
# all the certificates should be shown
# 7. After selecting all relevant certificates, the boats should be added to the file according to the orcsc file schema
# Including assigning correct YID.
# 8. After adding all the boats there should be an option to assign boats to classes.
# 9. this option should allow adding multiple boats simultaneously to a class.
# 10. There should be an option to remove boats.


create_new_scoring_file("Palzur Memorial Regatta 2025",
                        organizer="CYC",
                        start_date=datetime(2025, 10, 25),
                        end_date=datetime(2025, 10, 25),
                        classes=[
                            ClsRow("ROW", ClassId="O1", ClassName="ORC1", _class_enum=YachtClass.ORC),
                            ClsRow("ROW", ClassId="O2", ClassName="ORC2", _class_enum=YachtClass.ORC),
                            # ClsRow("ROW", ClassId="O3", ClassName="ORC3", _class_enum=YachtClass.ORC),
                            ClsRow("ROW", ClassId="SN", ClassName="Snonit", _class_enum=YachtClass.OneDesign),
                            ClsRow("ROW", ClassId="SE", ClassName="Snonit EDU", _class_enum=YachtClass.OneDesign),
                            ClsRow("ROW", ClassId="SF", ClassName="Sayfan", _class_enum=YachtClass.OneDesign),
                            ClsRow("ROW", ClassId="Z", ClassName="Amami", _class_enum=YachtClass.OneDesign)
                        ],
                        races=races,
                        boats=boats,
                        output_file=scoring_file
                        )


