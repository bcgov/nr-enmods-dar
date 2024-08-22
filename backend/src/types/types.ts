/**
 * Type of data returned by CSS user api
 */
export type IdirUserInfo = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  attributes: {
    idir_user_guid: string[];
    idir_username: string[];
    display_name: string[];
  };
};

/**
 * Type returned to the frontend for displaying users on Admin page
 */
export type UserInfo = {
  username: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  idirUsername: string;
  role: string[];
};

export type FileInfo = {
  submission_id: string;
  file_name: string, 
  submission_date: Date,
  submitter_user_id: string,
  submitter_agency_name: string,
  submission_status_code: string,
  sample_count: number,
  results_count: number,
};

export type ResultsWithCount = {
  results: [],
  count: number,
};

export type FieldVisits = {
  MinistryContact: string;
  SamplingAgency: string;
  Project: string;
  LocationID: string;
  FieldVisitStartTime: string;
  FieldVisitEndTime: string;
  FieldVisitParticipants: string;
  FieldVisitComments: string;
  PlanningStatus: 'DONE';
};

export type FieldActivities = {
  CollectionMethod: string;
  Medium: string;
  DepthUpper: string;
  DepthLower: string;
  DepthUnit: string;
  LocationID: string;
  ObservedDateTime: string;
  ObservedDateTimeEnd: string;
  ActivityType: 'SAMPLE_ROUTINE';
  ActivityName: string;
  SamplingContextTag: string;
}

export type FieldSpecimens = {
  WorkOrderNumber: string;
  FieldFiltered: string;
  FieldFilterComment: string;
  FieldPreservative: string;
  ObservedDateTime: string;
  ObservedDateTimeEnd: string;
  Medium:string;
  TissueType: string;
  LabArrivalTemperature:string;
  SpecimenName: string;
  AnalyzingAgency: string;
}

export type Observations = {
  ObservationID: string;
  LocationID: string;
  ObservedPropertyID: string;
  ObservedDateTime: string;
  AnalyzedDateTime: string;
  DepthUpper: string;
  DepthUnit: string;
  DataClassification: string;
  ResultValue: string;
  ResultUnit: string;
  SourceofRoundedValue: string;
  RoundedValue: string;
  RoundingSpecification: string;
  ResultStatus: string;
  ResultGrade: string;
  Medium: string;
  ActivityID: string;
  ActivityName: string;
  CollectionMethod: string;
  FieldDeviceID: string;
  FieldDeviceType: string;
  FieldVisitComments: string;
  SpecimenName: string;
  AnalysisMethod: string;
  DetectionCondition: string;
  LimitType: string;
  MethodDetectionLimit: string;
  MethodReportingLimit: string;
  LabQualityFlag: string
  LabArrivalDateandTime: string;
  LabPreparedDateTime: string;
  Fraction: string;
  AnalyzingAgency: string;
  LabSampleID: string;
  LabDilutionFactor: string;
  LabComment: string;
  QCType: string;
  QCSourceActivityName: string;
}

export type ObservationFile ={
  'Observation ID': string;
  'Location ID': string;
  'Observed Property ID': string;
  'Observed DateTime': string;
  'Analyzed DateTime': string;
  'Depth': string;
  'Depth Unit': string;
  'Data Classification': string
  'Result Value': string;
  'Result Unit': string;
  'Source Of Rounded Value': string;
  'Rounded Value': string;
  'Rounding Specification': string;
  'Result Status': string;
  'Result Grade': string;
  'Medium': string;
  'Activity ID': string;
  'Activity Name': string;
  'Collection Method': string;
  'Field: Device ID': string;
  'Field: Device Type': string;
  'Field: Comment': string;
  'Lab: Specimen Name': string;
  'Lab: Analysis Method': string;
  'Lab: Detection Condition': string;
  'Lab: Limit Type': string;
  'Lab: MDL': string;
  'Lab: MRL': string;
  'Lab: Quality Flag': string
  'Lab: Received DateTime': string;
  'Lab: Prepared DateTime': string;
  'Lab: Sample Fraction': string;
  'Lab: From Laboratory': string;
  'Lab: Sample ID': string;
  'Lab: Dilution Factor': string;
  'Lab: Comment': string;
  'QC: Type': string;
  'QC: Source Sample ID': string;
}

export type EmailTemplate = {
  from: string;
  subject: string;
  body: string;
};
