from orcsc.orcsc_file_editor import get_races
import xml.etree.ElementTree as ET

input_file = "test_files/results_winter2024.orcsc"
races = get_races(input_file)
for race in races:
    print(race.find('ScoringType').text)

# ids = [int(race.find('RaceId').text) for race in races]
# print(ids)
# print(get_races(input_file))
