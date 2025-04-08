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
}

export interface OrcscFile {
  event: EventData;
  classes: ClassData[];
  races: RaceData[];
  fleet: FleetData[];
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