from dataclasses import dataclass, field
from datetime import date

from orcsc.model.xml_element import XmlElement


@dataclass
class EventRow(XmlElement):
    EventName: str = None
    EventFolder: str = None
    EventId: str = None
    Status: int = None
    StartDate: date = None
    EndDate: date = None
    DoubleScoring: bool = field(default=False)
    AlternativeRMS: bool = field(default=False)
    TZAbbr: str = "GMT+03"
    UTCOffset: int = field(default=10800)
    EventTitle: str = None
    EventCode: str = None
    DSFormula: str = "CorrDelay1+CorrDelay2"
    Venue: str = None
    Organizer: str = None
