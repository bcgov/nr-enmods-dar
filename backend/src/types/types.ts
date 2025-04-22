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

export type BCeIDUserInfo = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  attributes: {
    bceid_user_guid: string[];
    bceid_username: string[];
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
  // idirUsername: string;
  role: string[];
};

export type FileInfo = {
  submission_id: string;
  file_name: string;
  original_file_name: string;
  submission_date: Date;
  submitter_user_id: string;
  submitter_agency_name: string;
  submission_status_code: string;
  sample_count: number;
  results_count: number;
};

export type ResultsWithCount = {
  results: [];
  count: number;
};

export type FileHeaders = {
  "Observation ID": string;
  "Ministry Contact": string;
  "Sampling Agency": string;
  Project: string;
  "Work Order Number": string;
  "Location ID": string;
  "Field Visit Start Time": string;
  "Field Visit End Time": string;
  "Field Visit Participants": string;
  "Field Visit Comments": string;
  "Activity Comments": string;
  "Field Filtered": string;
  "Field Filtered Comment": string;
  "Field Preservative": string;
  "Field Device ID": string;
  "Field Device Type": string;
  "Sampling Context Tag": string;
  "Collection Method": string;
  Medium: string;
  "Depth Upper": string;
  "Depth Lower": string;
  "Depth Unit": string;
  "Observed DateTime": string;
  "Observed Date Time End": string;
  "Observed Property ID": string;
  "Result Value": string;
  "Method Detection Limit": string;
  "Method Reporting Limit": string;
  "Result Unit": string;
  "Detection Condition": string;
  "Limit Type": string;
  Fraction: string;
  "Data Classification": string;
  "Source of Rounded Value": string;
  "Rounded Value": string;
  "Rounding Specification": string;
  "Analyzing Agency": string;
  "Analysis Method": string;
  "Analyzed Date Time": string;
  "Result Status": string;
  "Result Grade": string;
  "Activity ID": string;
  "Activity Name": string;
  "Tissue Type": string;
  "Lab Arrival Temperature": string;
  "Specimen Name": string;
  "Lab Quality Flag": string;
  "Lab Arrival Date and Time": string;
  "Lab Prepared DateTime": string;
  "Lab Sample ID": string;
  "Lab Dilution Factor": string;
  "Lab Comment": string;
  "Lab Batch ID": string;
  "QC Type": string;
  "QC Source Activity Name": string;
  "Composite Stat": string;
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
  PlanningStatus: "DONE";
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
  ActivityType: string;
  ActivityName: string;
  ActivityComments: string;
  SamplingContextTag: string;
};

export type FieldSpecimens = {
  WorkOrderNumber: string;
  FieldFiltered: string;
  FieldFilterComment: string;
  FieldPreservative: string;
  ObservedDateTime: string;
  ObservedDateTimeEnd: string;
  Medium: string;
  TissueType: string;
  LabArrivalTemperature: string;
  SpecimenName: string;
  AnalyzingAgency: string;
};

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
  LabQualityFlag: string;
  LabArrivalDateandTime: string;
  LabPreparedDateTime: string;
  Fraction: string;
  AnalyzingAgency: string;
  LabSampleID: string;
  LabDilutionFactor: string;
  LabComment: string;
  LabBatchID: string;
  QCType: string;
  QCSourceActivityName: string;
  CompositeStat: string;
};

export type ObservationFile = {
  "Observation ID": string;
  "Location ID": string;
  "Observed Property ID": string;
  "Observed DateTime": string;
  "Analyzed DateTime": string;
  Depth: string;
  "Depth Unit": string;
  "Data Classification": string;
  "Result Value": string;
  "Result Unit": string;
  "Source Of Rounded Value": string;
  "Rounded Value": string;
  "Rounding Specification": string;
  "Result Status": string;
  "Result Grade": string;
  Medium: string;
  "Activity ID": string;
  "Activity Name": string;
  "Collection Method": string;
  "Field: Device ID": string;
  "Field: Device Type": string;
  "Field: Comment": string;
  "Lab: Specimen Name": string;
  "Lab: Analysis Method": string;
  "Lab: Detection Condition": string;
  "Lab: Limit Type": string;
  "Lab: MDL": string;
  "Lab: MRL": string;
  "Lab: Quality Flag": string;
  "Lab: Received DateTime": string;
  "Lab: Prepared DateTime": string;
  "Lab: Sample Fraction": string;
  "Lab: From Laboratory": string;
  "Lab: Sample ID": string;
  "Lab: Dilution Factor": string;
  "Lab: Comment": string;
  "EA_Lab Batch ID": string;
  "QC: Type": string;
  "QC: Source Sample ID": string;
  "EA_Observation Composite Stat": string;
  "EA_Upload File Name": string;
};

export type EmailTemplate = {
  from: string;
  subject: string;
  body: string;
};
