# Scoring Codes class enum
from enum import Enum


class ScoringCode(Enum):
    TOT_Triple_Number_Windward_Leeward_Low = "TN_Inshore_Low"
    TOT_Triple_Number_Windward_Leeward_Medium = "TN_Inshore_Medium"
    TOT_Triple_Number_Windward_Leeward_High = "TN_Inshore_High"
    TOT_Custom = "CTOT"
    TOT_Coastal_Long_distance = "TMF_Offshore"
    TOT_Windward_Leeward = "TMF_Inshore"
