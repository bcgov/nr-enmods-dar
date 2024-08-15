// expected headers, originally from EMSEDT-186, adjusted to match the Aug 9, 2024 example file
export const mandatoryHeaders = [
  "Ministry Contact",
  "Sampling Agency",
  "Project",
  "Location ID",
  "Observed Property ID",
  "Field Visit Start Time",
  "Observed DateTime",
  "Analyzed DateTime",
  "Data Classification",
  "Result Status",
  "Medium",
  "Collection Method",
  "Analysis Method", // Lab:
  "Detection Condition", // Lab:
  "Limit Type", // Lab:
];
export const conditionallyMandatoryHeaders = [
  "Depth Unit", // if Depth is filled in
  "Result Unit", // if Result Value, Lab: MDL, or Lab: MRL are filled in
  "Rounded Value", // if source of rounded value = 'PROVIDED BY USER'
  "Specimen Name", // if data classification = LAB, FIELD_SURVEY, SURROGATE_RESULT
  "Method Detection Limit", // if data classification = LAB, FIELD_RESULT, SURROGATE_RESULT // Lab:
  "Method Reporting Limit", // if data classification = LAB, FIELD_RESULT, SURROGATE_RESULT // Lab:
  "Lab Arrival Date and Time", // if data classification = LAB, SURROGATE_RESULT // Lab:
  "Fraction", // if data classification = LAB, SURROGATE_RESULT // Lab:
  "From Laboratory", // if data classification = LAB, SURROGATE_RESULT // Lab:
  "QC Source Sample ID", // if QC Type not blank use activity name(???) // QC:
];

export const optionalHeaders = [
  "Observation ID",
  "Work Order Number",
  "Field Visit End Time",
  "Observed Date Time End",
  "Depth",
  "Depth Lower",
  "Result Value",
  "Source of Rounded Value",
  "Rounding Specification",
  "Result Grade",
  "Medium Detail",
  "Activity ID",
  "Activity Name",
  "Field: Participants",
  "Field: Filter",
  "Field: Filter Comment",
  "Field: Preservative",
  "Field: Device ID",
  "Field: Device Type",
  "Field: Comment",
  "Lab Arrival Temperature",
  "Composite Stat",
  "Sampling Context Tag",
];

export const conditionallyOptionalHeaders = [
  "Quality Flag", // if data classification = LAB, FIELD_RESULT, SURROGATE_RESULT // Lab:
  "Prepared DateTime", // if data classification = LAB, SURROGATE_RESULT // Lab:
  "Sample ID", // if data classification = LAB, SURROGATE_RESULT // Lab:
  "Dilution Factor", // if data classification = LAB, SURROGATE_RESULT // Lab:
  "Comment", // if data classification = LAB, SURROGATE_RESULT // Lab:
  "Type", // if blank, assumed to be 'ROUTINE' // QC:
];
