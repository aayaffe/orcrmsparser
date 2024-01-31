from dataclasses import dataclass, field
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


