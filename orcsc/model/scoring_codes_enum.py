# Scoring Codes class enum
from enum import Enum


class ScoringCode(Enum):
    TOT_Triple_Number_Windward_Leeward_Low = "TN_Inshore_Low"
    TOT_Triple_Number_Windward_Leeward_Medium = "TN_Inshore_Medium"
    TOT_Triple_Number_Windward_Leeward_High = "TN_Inshore_High"
    TOT_Custom = "CTOT"
    TOT_Coastal_Long_distance = "TMF_Offshore"
    TOT_Windward_Leeward = "TMF_Inshore"
    TOT_All_Purpose = "APHT"
    # TOT_Triple_Number_All_Purpose_Low = "US_TNAP_L_TOT"
    # TOT_Triple_Number_All_Purpose_Medium = "US_TNAP_M_TOT"
    # TOT_Triple_Number_All_Purpose_High = "US_TNAP_H_TOT"
