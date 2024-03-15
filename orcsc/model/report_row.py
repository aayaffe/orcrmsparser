from dataclasses import dataclass, field
from datetime import date

from orcsc.model.xml_element import XmlElement


@dataclass
class ReportRow(XmlElement):
    __elem_name = "report"
    _name: str = "TEntryList"
    _id: str = ""
    _title = "Entry List class {ClassName}"


