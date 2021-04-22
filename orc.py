import io
import json


def load_json_files(files):
    ret = []
    for file in files:
        j = json.load(io.open(file, 'r', encoding='utf-8-sig'))
        ret += j['rms']
    return ret
