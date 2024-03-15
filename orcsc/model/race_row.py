from dataclasses import dataclass, field
from datetime import date

from orcsc.model.xml_element import XmlElement


@dataclass
class RaceRow(XmlElement):
    RaceId: int = None
    RaceName: str = None
    StartTime: date = None
    ClassId: str = None
    Distance: str = None
    CourseId: int = None
    Provisional: bool = field(default=True)
    CountryId: str = None
    ScoringType: str = field(default="TMF_Offshore")
    Discardable: bool = field(default=True)
    Coeff: int = field(default=1)
    CountryId2: str = None
    ScoringType2: int = field(default=0)
    RaceNo: int = None
    HeatNo: int = field(default=0)
    DayNo: int = field(default=0)
    HeatStat: int = field(default=0)
    BoatIWUsed: bool = field(default=False)
    FinishOffset: str = None




