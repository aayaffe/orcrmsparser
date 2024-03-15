from dataclasses import dataclass, field
import xml.etree.ElementTree as ET
from datetime import date


def to_xml_str(val):
    if val is None:
        return val
    if isinstance(val, bool):
        if val:
            return "true"
        return "false"
    if isinstance(val, date):
        return val.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    return str(val)


@dataclass()
class XmlElement:
    __elem_name: str

    def __str__(self):
        el = self.to_element()
        ET.indent(el, space="\t", level=0)
        return ET.tostring(el, encoding='utf-8').decode('utf-8')

    def to_element(self):
        element_name = self.__elem_name
        ROW = ET.Element(element_name)
        child_leafs = [a for a in dir(type(self)) if not a.startswith('_') and not callable(getattr(type(self), a))]
        for child in child_leafs:
            el = ET.SubElement(ROW, child)
            val = getattr(self, child)
            if val is not None:
                el.text = to_xml_str(val)
        attributes = [a for a in dir(type(self)) if a.startswith('_') and not a.startswith('__')
                      and not a == "_text_val" and not callable(getattr(type(self), a))
                      and not '__elem_name'
                      and not '_class_enum' in a]
        for attr in attributes:
            val = getattr(self, attr)
            if val is not None:
                ROW.set(attr[1:], to_xml_str(val))
        if hasattr(self, "_text_val"):
            ROW.text = self.__getattribute__("_text_val")
        return ROW

    @classmethod
    def from_element(cls, el):
        ret = cls(el.tag)
        for child in el:
            setattr(ret, child.tag, child.text)
        for attribute, value in el.attrib.items():
            setattr(ret, "_" + attribute, value)
        if el.text:
            setattr(ret, "_text_val", el.text)
        return ret


