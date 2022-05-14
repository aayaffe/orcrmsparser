import copy
import csv
import io
import json
import random
import string

from utils import create_folder

# ###################SETTINGS##################################
json_output = f'boats/' + 'smallboats.json'
json_template = 'Template.json'
csv_file = 'small_boat_rms.csv'

# #############################################################

j = json.load(io.open(json_template, 'r', encoding='utf-8-sig'))
rms = copy.deepcopy(j['rms'][0])
del j['rms'][0]
create_folder(json_output)

with open(csv_file, newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        rms['BIN'] = row['SAILNUMB'].strip()
        rms['CertNo'] = '082821'
        rms['RefNo'] = ''.join(random.choice(string.digits) for _ in range(12))
        rms['SailNo'] = row['SAILNUMB'].rstrip()
        rms['YachtName'] = row['NAME'].rstrip()
        rms['Class'] = row['TYPE'].rstrip()
        rms['Owner'] = row['OWNER'].rstrip()
        rms['IssueDate'] = '2021-08-28T00:00:00.000Z'
        j['rms'].append(copy.deepcopy(rms))
with open(json_output, 'w', encoding='utf-8') as f:
    json.dump(j, f, ensure_ascii=False, indent=4)
pass
