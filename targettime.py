import xlsxwriter

import orc
from settings import json_files, L1_dist_interval, L1_min_dist, L1_max_dist, selected_boats, classes, course_types, \
    target_time, target_time_margin
from utils import create_folder, is_int

def generate_boat_sheet(workbook, wind_speeds, boat_rows, name):
    global row, c, idx
    worksheet = workbook.add_worksheet(name)
    worksheet.write(0, 0, name)
    cell_format = workbook.add_format({
        'border': 1,
        'valign': 'vcenter'})
    target_time_cell_format = workbook.add_format({
        'border': 1,
        'valign': 'vcenter',
        'bg_color': '#FFFA73'})
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
                if is_int(col) and (int(col) < target_time + target_time_margin) and (
                        int(col) > target_time - target_time_margin):
                    worksheet.write(r + 1, c, col, target_time_cell_format)
                else:
                    worksheet.write(r + 1, c, col, cell_format)
    merge_format = workbook.add_format({
        'bold': 1,
        'border': 1,
        'align': 'center',
        'valign': 'vcenter',
        'text_wrap': True})
    headline = name + "\n(L1 is distance from start line to 1st mark in nautical miles, wind speeds in knots, " \
                      "time in minutes) "
    worksheet.merge_range(0, 0, 0, (len(wind_speeds) + 2) * (len(course_types)) - 2, headline, merge_format)
    worksheet.set_row(0, 32)
    for idx, c in enumerate(course_types):
        worksheet.merge_range(1, idx * (len(wind_speeds) + 1) + idx, 1,
                              idx + idx * (len(wind_speeds) + 1) + len(wind_speeds), c, merge_format)
    worksheet.set_column(0, len(course_types) * (len(wind_speeds) + 2) - 2, 3)
    worksheet.set_landscape()
    worksheet.set_paper(9)
    worksheet.print_area(0, 0, len(boat_rows), len(course_types) * (len(wind_speeds) + 2) - 2)
    worksheet.fit_to_pages(1, 1)


def generate_ranking_sheet(workbook, wind_speeds, boats_number, lengths):
    worksheet = workbook.add_worksheet('_Ranking')
    cell_formats = {}
    for name, color in classes.items():
        cell_formats[name] = workbook.add_format({
            'border': 1,
            'valign': 'vcenter',
            'bg_color': color})
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
            worksheet.write(r * (len(wind_speeds) + 1) + c + 2, 0, speed, bold_format)
            for col, boat in enumerate(lengths[course][speed]):
                worksheet.write(r * (len(wind_speeds) + 1) + c + 2, col + 1, boat[0],
                                cell_formats[selected_boats[boat[0]]])

    worksheet.merge_range(0, 0, 0, boats_number,
                          'Race Course competitors arranged from Fastest to slowest (By wind speed)', merge_format)
    worksheet.set_landscape()
    worksheet.set_paper(9)
    # worksheet.print_area(0, 0, len(boat_rows), len(course_types) * (len(wind_speeds) + 2) - 2)
    worksheet.fit_to_pages(1, 1)


def generate_target_time_file():
    rms = orc.load_json_files(json_files)
    courseLengths = {}
    filename = f'boats/timetables.xlsx'
    create_folder(filename)
    workbook = xlsxwriter.Workbook(filename)
    wind_speeds = rms[1]['Allowances']['WindSpeeds']

    boats_rows = {}
    for boat in rms:
        allowances = boat['Allowances']
        boat_name = boat['YachtName']
        boats_rows[boat_name] = []
        if boat_name not in selected_boats.keys() and len(selected_boats) != 0:
            continue  # Skip if boat not selected and selected_boats list is not empty
        courseLengths[boat_name] = {}

        for course in course_types:
            course_rows = [[course] + [' ' for x in range(len(allowances['WindSpeeds']))]]
            courseLengths[boat_name][course] = {}
            course_rows.append(['L1'] + ([str(x) for x in allowances['WindSpeeds']]))
            lengths = [x * L1_dist_interval for x in
                       range(int(L1_min_dist * (1 / L1_dist_interval)), int(1 / L1_dist_interval * L1_max_dist + 1))]
            for length in lengths:
                distances = [f'{length:.1f}']
                for idx, spd in enumerate(allowances['WindSpeeds']):
                    spd = int(spd)
                    total_time = 0
                    for leg in course_types[course]:
                        total_time += length * course_types[course][leg] * allowances[leg][idx]
                    distances.append(f'{total_time / 60:.0f}')
                    courseLengths[boat_name][course][spd] = total_time / 60
                course_rows.append(distances)
            if not boats_rows[boat_name]:
                boats_rows[boat_name] = course_rows
            else:
                for idx, row in enumerate(boats_rows[boat_name]):
                    boats_rows[boat_name][idx] = boats_rows[boat_name][idx] + [' '] + course_rows[idx]

    sorted_lengths = {}
    for c in course_types:
        sorted_lengths[c] = {}
        for s in rms[1]['Allowances']['WindSpeeds']:
            sorted_lengths[c][s] = []
            for boat in courseLengths:
                sorted_lengths[c][s].append((boat, courseLengths[boat][c][s]))
            sorted_lengths[c][s] = sorted(sorted_lengths[c][s], key=lambda k: k[1])
            boats_number = len(courseLengths)

    generate_ranking_sheet(workbook, wind_speeds, boats_number, sorted_lengths)
    for boat in selected_boats.keys():
        generate_boat_sheet(workbook, wind_speeds, boats_rows[boat], boat)
    workbook.close()
    print (f"Target time file generated: {filename}")
