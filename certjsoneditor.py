from datetime import datetime

from prompt_toolkit import print_formatted_text, HTML, PromptSession
from bidi.algorithm import get_display
import copy
import io
import json
import random
import string

import utils
from utils import create_folder

json_template = 'Template_short.json'
classes = ['Amami', 'Snonit', 'Snonit Small Rig', 'Sayfan', 'Livyatanit']

"""
A script used to generate Json files of one design boats to be used for simple import in ORC scorer
"""


def fix_bins(json_file):
    """
    Fixes Duplicate BIN numbers in the JSON file.
    """
    iojson = json.load(io.open(json_file, 'r', encoding='utf-8-sig'))
    print('Number of boats: ' + str(len(iojson['rms'])))
    bins = []
    fixed = 0
    for r in iojson['rms']:
        if r['BIN'] not in bins:
            bins.append(r['BIN'])
        else:
            BIN = ''.join(random.choice(string.digits) for _ in range(12))
            while BIN in bins:
                BIN = ''.join(random.choice(string.digits) for _ in range(12))
            r['BIN'] = BIN
            bins.append(r['BIN'])
            fixed += 1
    print('Fixed ' + str(fixed) + ' BIN numbers.')
    print(bins)
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(iojson, f, ensure_ascii=False, indent=4)


def add_boats_to_json(json_file):
    """
    Adds a boat to the JSON file.
    """
    j = json.load(io.open(json_template, 'r', encoding='utf-8-sig'))
    iojson = json.load(io.open(json_file, 'r', encoding='utf-8-sig'))
    bins = [b['BIN'] for b in iojson['rms']]
    # BIN number must be unique when adding a boat to event
    rms = copy.deepcopy(j['rms'][0])
    del j['rms'][0]
    more = True
    while (more):
        print('---------------------------------------------------------------------------------------')
        name = utils.default_input('Boat name?', "")
        sailno = utils.default_input('Sail number?', "")
        class_ = utils.default_input('Class?', "Amami", classes, ignore_case=True)
        owner = utils.default_input('Owner?', "")
        BIN = ''.join(random.choice(string.digits) for _ in range(12))
        while BIN in bins:
            BIN = ''.join(random.choice(string.digits) for _ in range(12))
        rms['BIN'] = BIN
        rms['CertNo'] = '082821'
        rms['SailNo'] = sailno
        rms['YachtName'] = name
        rms['Class'] = class_
        rms['Owner'] = owner
        rms['IssueDate'] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        iojson['rms'].append(copy.deepcopy(rms))
        more = utils.default_input('Add another boat?', "y", ['y', 'n'], ignore_case=True)
        more = utils.convert_yn_to_bool(more)
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(iojson, f, ensure_ascii=False, indent=4)


add_boats_to_json("boats/Israel Small sailing vessels.json")
