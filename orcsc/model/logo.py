from dataclasses import dataclass, field
from orcsc.model.xml_element import XmlElement


@dataclass
class logo(XmlElement):
    _name: str = None
    _filename: str = None
    _mediatype: str = None
    _text_val: str = None



