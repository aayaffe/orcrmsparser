import io
import json


def load_json_files(files):
    ret = []
    for file in files:
        j = json.load(io.open(file, 'r', encoding='utf-8-sig'))
        if 'rms' in j:
            ret += j['rms']
        else:
            ret += j
    return ret
