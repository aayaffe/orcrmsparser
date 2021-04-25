import math
import xlsxwriter

import orc
from utils import create_folder

####################SETTINGS##################################
json_files = ['ISR_ORC.json', 'ISR_NS.json']
L1_dist_interval = 0.1
L1_min_dist = 0.4
L1_max_dist = 2
selected_boats = ["Bellendaine", "Blanc Bleu", "Karakahia", "Mermaid of Delaware", "Fury",
                  "Cyclop", "YOLO", "Mina", "Semiramis", "Shayna", "Lou of Ixopo", "Oran Almog",
                  "Tamar"]
course_types = {
    'T1':
        {
            'Beat': 1,
            'R135': 2 / math.sqrt(2)
        },
    'T1-2':
        {
            'Beat': 1.5,
            'R135': 2 / math.sqrt(2),
            'Run': 0.5
        },
    # 'T2':
    #     {
    #         'Beat': 2,
    #         'R135': 4 / math.sqrt(2)
    #     },
    'W1':
        {
            'Beat': 1,
            'Run': 1
        },
    'W1-2':
        {
            'Beat': 1.5,
            'Run': 1.5
        },
    # 'W2':
    #     {
    #         'Beat': 2,
    #         'Run': 2
    #     }
}


##############################################################

def generate_boatsheet(name):
    global row, c, idx
    worksheet = workbook.add_worksheet(name)
    worksheet.write(0, 0, name)
    cell_format = workbook.add_format({
        'border': 1,
        'valign': 'vcenter'})
    bold_format = workbook.add_format({
        'bold': 1,
        'border': 1,
        'valign': 'vcenter'})
    for r, row in enumerate(boat_rows):
        for c, col in enumerate(row):
            if r == 1 or c % 9 == 0:
                worksheet.write(r + 1, c, col, bold_format)
            elif (c + 1) % 9 == 0:
                worksheet.write(r + 1, c, col)
            else:
                worksheet.write(r + 1, c, col, cell_format)
    merge_format = workbook.add_format({
        'bold': 1,
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'})
    worksheet.merge_range(0, 0, 0, (len(wind_speeds) + 2) * (len(course_types)) - 2, boat_name, merge_format)
    for idx, c in enumerate(course_types):
        worksheet.merge_range(1, idx * (len(wind_speeds) + 1) + idx, 1,
                              idx + idx * (len(wind_speeds) + 1) + len(wind_speeds), c, merge_format)
    worksheet.set_column(0, len(course_types) * (len(wind_speeds) + 2) - 2, 3)
    worksheet.set_landscape()
    worksheet.set_paper(9)
    worksheet.print_area(0, 0, len(boat_rows), len(course_types) * (len(wind_speeds) + 2) - 2)
    worksheet.fit_to_pages(1, 1)


def generate_rankingsheet(sorted_lengths):
    worksheet = workbook.add_worksheet('_Ranking')
    cell_format = workbook.add_format({
        'border': 1,
        'valign': 'vcenter'})
    bold_format = workbook.add_format({
        'bold': 1,
        'border': 1,
        'valign': 'vcenter'})
    merge_format = workbook.add_format({
        'bold': 1,
        'align': 'center',
        'valign': 'vcenter'})
    for r, course in enumerate(course_types):
        worksheet.write(r * (len(wind_speeds) + 1) + 1, 0, course, bold_format)
        worksheet.merge_range(r * (len(wind_speeds) + 1) + 1, 0, r * (len(wind_speeds) + 1) + 1,
                              boats_number, course, merge_format)
        for c, speed in enumerate(wind_speeds):
            worksheet.write(r * (len(wind_speeds) + 1) + c + 2, 0, speed)
            for col, boat in enumerate(sorted_lengths[course][speed]):
                worksheet.write(r * (len(wind_speeds) + 1) + c + 2, col + 1, boat[0], cell_format)

    worksheet.merge_range(0, 0, 0, boats_number,
                          'Race Course competitors arranged from Fastest to slowest (By wind speed)', merge_format)
    worksheet.set_landscape()
    worksheet.set_paper(9)
    # worksheet.print_area(0, 0, len(boat_rows), len(course_types) * (len(wind_speeds) + 2) - 2)
    worksheet.fit_to_pages(1, 1)


rms = orc.load_json_files(json_files)
courseLengths = {}
filename = f'boats/timetables.xlsx'
create_folder(filename)
workbook = xlsxwriter.Workbook(filename)

wind_speeds = rms[1]['Allowances']['WindSpeeds']
for boat in rms:
    boat_rows = []
    allowances = boat['Allowances']
    boat_name = boat['YachtName']
    if boat_name not in selected_boats and len(selected_boats) != 0:
        continue  # Skip in boat not selected and selected_boats list is not empty
    courseLengths[boat_name] = {}

    for course in course_types:
        course_rows = [[course] + [' ' for x in range(len(allowances['WindSpeeds']))]]
        courseLengths[boat_name][course] = {}
        course_rows.append(['L1'] + ([str(x) for x in allowances['WindSpeeds']]))
        lengths = [x * L1_dist_interval for x in
                   range(int(L1_min_dist * (1 / L1_dist_interval)), int(1 / L1_dist_interval * L1_max_dist + 1))]
        for l in lengths:
            distances = [f'{l:.1f}']
            for idx, spd in enumerate(allowances['WindSpeeds']):
                spd = int(spd)
                total_time = 0
                for leg in course_types[course]:
                    total_time += l * course_types[course][leg] * allowances[leg][idx]
                distances.append(f'{total_time / 60:.0f}')
                courseLengths[boat_name][course][spd] = total_time / 60
            course_rows.append(distances)
        if not boat_rows:
            boat_rows = course_rows
        else:
            for idx, row in enumerate(boat_rows):
                boat_rows[idx] = boat_rows[idx] + [' '] + course_rows[idx]
    generate_boatsheet(boat_name)
sorted_lengths = {}
for c in course_types:
    sorted_lengths[c] = {}
    for s in rms[1]['Allowances']['WindSpeeds']:
        sorted_lengths[c][s] = []
        for boat in courseLengths:
            sorted_lengths[c][s].append((boat, courseLengths[boat][c][s]))
        sorted_lengths[c][s] = sorted(sorted_lengths[c][s], key=lambda k: k[1])
        boats_number = len(courseLengths)

generate_rankingsheet(sorted_lengths)
workbook.close()

pass