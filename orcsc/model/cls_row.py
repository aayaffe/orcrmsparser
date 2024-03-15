from dataclasses import dataclass, field

from orcsc.model.class_enum import YachtClass
from orcsc.model.xml_element import XmlElement


@dataclass
class ClsRow(XmlElement):
    ClassId: str = None
    ClassName: str = None
    Discards: int = field(default=0)
    DivFromOverall: bool = field(default=False)
    TimeLimitFormulae: str = None
    ResultScoring: int = field(default=0)
    UseBoatIW: bool = field(default=False)
    EnableA9: str = None
    HeatState: str = None
    DayNo: str = None
    _class_enum: YachtClass = None



    def get_yacht_class(self):
        return self._class_enum

