import xml.etree.ElementTree as ET

from orcsc.model.cls_row import ClsRow
from orcsc.model.logo import logo


def get_classes(file):
    tree = ET.parse(file)
    ret = [ClsRow.from_element(item) for item in tree.getroot().findall('./Cls/ROW')]
    return ret


def get_logos(file):
    tree = ET.parse(file)
    ret = [logo.from_element(item) for item in tree.getroot().findall('./reports/logo')]
    return ret
