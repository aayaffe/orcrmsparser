export enum YachtClass {
  ORC = "ORC",
  OneDesign = "OneDesign"
}

export enum ScoringCode {
  TOT_Triple_Number_Windward_Leeward_High = "TOT_Triple_Number_Windward_Leeward_High",
  TOT_Custom = "TOT_Custom"
}

export interface EventData {
  EventTitle: string;
  StartDate: string;
  EndDate: string;
  Venue: string;
  Organizer: string;
}

export interface ClassData {
  ClassId: string;
  ClassName: string;
  YachtClass: string;
}

export interface RaceData {
  RaceId: number;
  RaceName: string;
  StartTime: string;
  ClassId: string;
  ScoringType: string;
}

export interface FleetData {
  YID: number;
  YachtName: string;
  SailNo: string | null;
  ClassId: string;
  CDL?: number | null;
  Rating?: string | null;
  GPH?: number | null;
  TN_Inshore_Low?: number | null;
  TN_Inshore_Medium?: number | null;
  TN_Inshore_High?: number | null;
  TN_Offshore_Low?: number | null;
  TN_Offshore_Medium?: number | null;
  TN_Offshore_High?: number | null;
  TND_Inshore_Low?: number | null;
  TND_Inshore_Medium?: number | null;
  TND_Inshore_High?: number | null;
  TND_Offshore_Low?: number | null;
  TND_Offshore_Medium?: number | null;
  TND_Offshore_High?: number | null;
}

export interface OrcscFile {
  filePath: string;
  event: {
    EventTitle: string;
    Venue: string;
    Organizer: string;
    StartDate: string;
    EndDate: string;
  };
  classes: Array<{
    ClassId: string;
    ClassName: string;
    YachtClass: string;
  }>;
  races: Array<{
    RaceId: string;
    RaceName: string;
    ClassId: string;
    StartTime: string;
    Status: string;
    ScoringType: string;
  }>;
  fleet: Array<{
    YID: string;
    YachtName: string;
    SailNo: string;
    ClassId: string;
    CDL: number | null;
    Rating: string | null;
    GPH: number | null;
    TN_Inshore_Low: number | null;
    TN_Inshore_Medium: number | null;
    TN_Inshore_High: number | null;
    TN_Offshore_Low: number | null;
    TN_Offshore_Medium: number | null;
    TN_Offshore_High: number | null;
    TND_Inshore_Low: number | null;
    TND_Inshore_Medium: number | null;
    TND_Inshore_High: number | null;
    TND_Offshore_Low: number | null;
    TND_Offshore_Medium: number | null;
    TND_Offshore_High: number | null;
    HelmName: string;
    CrewName: string;
    ClubName: string;
  }>;
}

export interface ClassRow {
  classId: string;
  className: string;
  yachtClass: YachtClass;
}

export interface RaceRow {
  raceName: string;
  startTime: Date;
  classId: string;
  scoringType: ScoringCode;
}

export interface FleetRow {
  yachtName: string;
  sailNo?: string;
  classId: string;
} 