from dataclasses import dataclass, field
from datetime import date

from orcsc.model.xml_element import XmlElement


@dataclass
class FleetRow(XmlElement):
    YID: int = None
    SailNo: str = None
    YachtName: str = None
    BowNo: str = None
    ClassId: str = None
    DivId: str = None
    LOA: float = None
    CDL: float = None
    # GPH: int = None
    TMF_Inshore: int = 0
    CTOT: int = 1
    Nation: str = "ISR"



      # APHD>0/APHD>
      # CTOD
      # CTOT>1/CTOT>
      # YClass
      # Owner
      # Skipper
      # Sponsor
      # Club
      # Nation
      # EMail
      # Phone
      # CertType
      # IssueDate
      # NatAuth
      # Points
      # BIN
      # RefNo
      # Position
      # PtsHash
      # PtsHash2
      # RMS
      # YID>15/YID>
      # RMS2
      # SNInt>0/SNInt>
      # Family>/Family>
      # HeatNo
      # ILCWA>0/ILCWA>
      # TMF_Inshore>0/TMF_Inshore>
      # APHT>0/APHT>
      # MHRD>0/MHRD>
      # MHRT>0/MHRT>
      # OSN>0/OSN>
      # TMF_Offshore>0/TMF_Offshore>
      # TND_Offshore_Low>0/TND_Offshore_Low>
      # TN_Offshore_Low>0/TN_Offshore_Low>
      # TND_Offshore_Medium>0/TND_Offshore_Medium>
      # TN_Offshore_Medium>0/TN_Offshore_Medium>
      # TND_Offshore_High>0/TND_Offshore_High>
      # TN_Offshore_High>0/TN_Offshore_High>
      # TND_Inshore_Low>0/TND_Inshore_Low>
      # TN_Inshore_Low>0/TN_Inshore_Low>
      # TND_Inshore_Medium>0/TND_Inshore_Medium>
      # TN_Inshore_Medium>0/TN_Inshore_Medium>
      # TND_Inshore_High>0/TND_Inshore_High>
      # TN_Inshore_High>0/TN_Inshore_High>
      # Pred_Up_TOD>0/Pred_Up_TOD>
      # Pred_Up_TOT>0/Pred_Up_TOT>
      # Pred_Down_TOD>0/Pred_Down_TOD>
      # Pred_Down_TOT>0/Pred_Down_TOT>
      # US_PREDUP_L_TOD>0/US_PREDUP_L_TOD>
      # US_PREDUP_L_TOT>0/US_PREDUP_L_TOT>
      # US_PREDUP_M_TOD>0/US_PREDUP_M_TOD>
      # US_PREDUP_M_TOT>0/US_PREDUP_M_TOT>
      # US_PREDUP_H_TOD>0/US_PREDUP_H_TOD>
      # US_PREDUP_H_TOT>0/US_PREDUP_H_TOT>
      # US_PREDDN_L_TOD>0/US_PREDDN_L_TOD>
      # US_PREDDN_L_TOT>0/US_PREDDN_L_TOT>
      # US_PREDDN_M_TOD>0/US_PREDDN_M_TOD>
      # US_PREDDN_M_TOT>0/US_PREDDN_M_TOT>
      # US_PREDDN_H_TOD>0/US_PREDDN_H_TOD>
      # US_PREDDN_H_TOT>0/US_PREDDN_H_TOT>
      # US_CHIMAC_UP_TOT>0/US_CHIMAC_UP_TOT>
      # US_CHIMAC_AP_TOT>0/US_CHIMAC_AP_TOT>
      # US_CHIMAC_DN_TOT>0/US_CHIMAC_DN_TOT>
      # US_BAYMAC_CV_TOT>0/US_BAYMAC_CV_TOT>
      # US_BAYMAC_SH_TOT>0/US_BAYMAC_SH_TOT>
      # US_HARVMOON_TOD>0/US_HARVMOON_TOD>
      # US_HARVMOON_TOT>0/US_HARVMOON_TOT>
      # US_VICMAUI_TOT>0/US_VICMAUI_TOT>
      # KR_PREDR_TOD>0/KR_PREDR_TOD>
      # RSA_CD_INS_TOD>0/RSA_CD_INS_TOD>
      # RSA_CD_INS_TOT>0/RSA_CD_INS_TOT>
      # RSA_CD_OFF_TOD>0/RSA_CD_OFF_TOD>
      # RSA_CD_OFF_TOT>0/RSA_CD_OFF_TOT>
      # BRA_ALL_UP_TOT>0/BRA_ALL_UP_TOT>
      # BRA_ALL_DN_TOT>0/BRA_ALL_DN_TOT>
      # BRA_7030_TOT>0/BRA_7030_TOT>
      # BRA_3070_TOT>0/BRA_3070_TOT>
      # US_5B_L_TOD>0/US_5B_L_TOD>
      # US_5B_L_TOT>0/US_5B_L_TOT>
      # US_5B_LM_TOD>0/US_5B_LM_TOD>
      # US_5B_LM_TOT>0/US_5B_LM_TOT>
      # US_5B_M_TOD>0/US_5B_M_TOD>
      # US_5B_M_TOT>0/US_5B_M_TOT>
      # US_5B_MH_TOD>0/US_5B_MH_TOD>
      # US_5B_MH_TOT>0/US_5B_MH_TOT>
      # US_5B_H_TOD>0/US_5B_H_TOD>
      # US_5B_H_TOT>0/US_5B_H_TOT>
