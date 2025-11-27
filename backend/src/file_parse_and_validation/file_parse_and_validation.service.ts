import { Injectable, Logger } from "@nestjs/common";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";
import { ObjectStoreService } from "src/objectStore/objectStore.service";
import { OperationLockService } from "src/operationLock/operationLock.service";
import {
  FieldActivities,
  FieldSpecimens,
  FieldVisits,
  FileHeaders,
  ObservationFile,
  Observations,
} from "src/types/types";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import ExcelJS from "exceljs";
import fs from "fs";
import { PrismaService } from "nestjs-prisma";
import { NotificationsService } from "src/notifications/notifications.service";
import { Readable } from "stream";
import { format } from "fast-csv";
import { parse } from "csv-parse";
import * as readline from "readline";
import { isISO8601 } from "validator";

const fileHeaders: FileHeaders = {
  "Observation ID": "Observation ID",
  "Ministry Contact": "Ministry Contact",
  "Sampling Agency": "Sampling Agency",
  Project: "Project",
  "Work Order Number": "Work Order Number",
  "Location ID": "Location ID",
  "Field Visit Start Time": "Field Visit Start Time",
  "Field Visit End Time": "Field Visit End Time",
  "Field Visit Participants": "Field Visit Participants",
  "Field Visit Comments": "Field Visit Comments",
  "Activity Comments": "Activity Comments",
  "Field Filtered": "Field Filtered",
  "Field Filtered Comment": "Field Filtered Comment",
  "Field Preservative": "Field Preservative",
  "Field Device ID": "Field Device ID",
  "Field Device Type": "Field Device Type",
  "Sampling Context Tag": "Sampling Context Tag",
  "Collection Method": "Collection Method",
  Medium: "Medium",
  "Depth Upper": "Depth Upper",
  "Depth Lower": "Depth Lower",
  "Depth Unit": "Depth Unit",
  "Observed DateTime": "Observed DateTime",
  "Observed Date Time End": "Observed Date Time End",
  "Observed Property ID": "Observed Property ID",
  "Result Value": "Result Value",
  "Method Detection Limit": "Method Detection Limit",
  "Method Reporting Limit": "Method Reporting Limit",
  "Result Unit": "Result Unit",
  "Detection Condition": "Detection Condition",
  "Limit Type": "Limit Type",
  Fraction: "Fraction",
  "Data Classification": "Data Classification",
  "Source of Rounded Value": "Source of Rounded Value",
  "Rounded Value": "Rounded Value",
  "Rounding Specification": "Rounding Specification",
  "Analyzing Agency": "Analyzing Agency",
  "Analysis Method": "Analysis Method",
  "Analyzed Date Time": "Analyzed Date Time",
  "Result Status": "Result Status",
  "Result Grade": "Result Grade",
  "Activity ID": "Activity ID",
  "Activity Name": "Activity Name",
  "Tissue Type": "Tissue Type",
  "Lab Arrival Temperature": "Lab Arrival Temperature",
  "Specimen Name": "Specimen Name",
  "Lab Quality Flag": "Lab Quality Flag",
  "Lab Arrival Date and Time": "Lab Arrival Date and Time",
  "Lab Prepared DateTime": "Lab Prepared DateTime",
  "Lab Sample ID": "Lab Sample ID",
  "Lab Dilution Factor": "Lab Dilution Factor",
  "Lab Comment": "Lab Comment",
  "Lab Batch ID": "Lab Batch ID",
  "QC Type": "QC Type",
  "QC Source Activity Name": "QC Source Activity Name",
  "Composite Stat": "Composite Stat",
  "Biological Life Stage": "Biological Life Stage",
};

const visits: FieldVisits = {
  MinistryContact: "",
  SamplingAgency: "",
  Project: "",
  LocationID: "",
  FieldVisitStartTime: "",
  FieldVisitEndTime: "",
  FieldVisitParticipants: "",
  FieldVisitComments: "",
  PlanningStatus: "DONE",
};

const activities: FieldActivities = {
  CollectionMethod: "",
  Medium: "",
  DepthUpper: "",
  DepthLower: "",
  DepthUnit: "",
  LocationID: "",
  ObservedDateTime: "",
  ObservedDateTimeEnd: "",
  ActivityType: "",
  ActivityName: "",
  ActivityComments: "",
  SamplingContextTag: "",
};

const specimens: FieldSpecimens = {
  WorkOrderNumber: "",
  FieldFiltered: "",
  FieldFilteredComment: "",
  FieldPreservative: "",
  ObservedDateTime: "",
  ObservedDateTimeEnd: "",
  Medium: "",
  SpecimenName: "",
  TissueType: "",
  LabArrivalTemperature: "",
  AnalyzingAgency: "",
};

const observations: Observations = {
  ObservationID: "",
  LocationID: "",
  ObservedPropertyID: "",
  ObservedDateTime: "",
  AnalyzedDateTime: "",
  DepthUpper: "",
  DepthUnit: "",
  DataClassification: "",
  ResultValue: "",
  ResultUnit: "",
  SourceofRoundedValue: "",
  RoundedValue: "",
  RoundingSpecification: "",
  ResultStatus: "",
  ResultGrade: "",
  Medium: "",
  ActivityID: "",
  ActivityName: "",
  CollectionMethod: "",
  FieldDeviceID: "",
  FieldDeviceType: "",
  FieldVisitComments: "",
  SpecimenName: "",
  AnalysisMethod: "",
  DetectionCondition: "",
  LimitType: "",
  MethodDetectionLimit: "",
  MethodReportingLimit: "",
  LabQualityFlag: "",
  LabArrivalDateandTime: "",
  LabPreparedDateTime: "",
  Fraction: "",
  AnalyzingAgency: "",
  LabSampleID: "",
  LabDilutionFactor: "",
  LabComment: "",
  QCType: "",
  QCSourceActivityName: "",
  LabBatchID: "",
  CompositeStat: "",
  BiologicalLifeStage: "",
};

const obsFile: ObservationFile = {
  "Observation ID": "",
  "Location ID": "",
  "Observed Property ID": "",
  "Observed DateTime": "",
  "Analyzed DateTime": "",
  Depth: "",
  "Depth Unit": "",
  "Data Classification": "",
  "Result Value": "",
  "Result Unit": "",
  "Source of Rounded Value": "",
  "Rounded Value": "",
  "Rounding Specification": "",
  "Result Status": "",
  "Result Grade": "",
  Medium: "",
  "Activity ID": "",
  "Activity Name": "",
  "Collection Method": "",
  "Field: Device ID": "",
  "Field: Device Type": "",
  "Field: Comment": "",
  "Lab: Specimen Name": "",
  "Lab: Analysis Method": "",
  "Lab: Detection Condition": "",
  "Lab: Limit Type": "",
  "Lab: MDL": "",
  "Lab: MRL": "",
  "Lab: Quality Flag": "",
  "Lab: Received DateTime": "",
  "Lab: Prepared DateTime": "",
  "Lab: Sample Fraction": "",
  "Lab: From Laboratory": "",
  "Lab: Sample ID": "",
  "Lab: Dilution Factor": "",
  "Lab: Comment": "",
  "QC: Type": "",
  "QC: Source Sample ID": "",
  "EA_Lab Batch ID": "",
  "EA_Observation Composite Stat": "",
  "EA_Biological Life Stage": "",
  "EA_Upload File Name": "",
};

let partialUpload = false;
let rollBackHalted = false;
let validationApisCalled = [];
let fieldVisitStartTimes = {};

@Injectable()
export class FileParseValidateService {
  private readonly logger = new Logger(FileParseValidateService.name);

  constructor(
    private prisma: PrismaService,
    private readonly fileSubmissionsService: FileSubmissionsService,
    private readonly aqiService: AqiApiService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getQueuedFiles() {
    return this.fileSubmissionsService.findByCode("QUEUED");
  }

  async getRollBackFiles() {
    return this.fileSubmissionsService.findByCode("ROLLBACK");
  }

  async getFilesToDelete() {
    return this.fileSubmissionsService.findByCode("DEL QUEUED");
  }

  async deleteFile(fileName, fileId) {
    return this.fileSubmissionsService.remove(fileName, fileId);
  }

  async queryCodeTables(tableName: string, param: any) {
    switch (tableName) {
      case "LOCATIONS":
        let locID = await this.prisma.aqi_locations.findMany({
          where: {
            custom_id: {
              equals: param,
            },
          },
          select: {
            aqi_locations_id: true,
          },
        });
        if (locID.length == 0) {
          return {};
        } else {
          return {
            samplingLocation: {
              id: locID[0].aqi_locations_id,
              custom_id: param,
            },
          };
        }
      case "PROJECT":
        let projectID = await this.prisma.aqi_projects.findMany({
          where: {
            custom_id: {
              equals: param,
            },
          },
          select: {
            aqi_projects_id: true,
          },
        });
        return {
          project: { id: projectID[0].aqi_projects_id, customId: param },
        };
      case "COLLECTION_METHODS":
        let cmID = await this.prisma.aqi_collection_methods.findMany({
          where: {
            custom_id: {
              equals: param,
            },
          },
          select: {
            aqi_collection_methods_id: true,
          },
        });
        return {
          collectionMethod: {
            id: cmID[0].aqi_collection_methods_id,
            customId: param,
          },
        };
      case "MEDIUM":
        let mediumID = await this.prisma.aqi_mediums.findMany({
          where: {
            custom_id: {
              equals: param,
            },
          },
          select: {
            aqi_mediums_id: true,
          },
        });
        return { medium: { id: mediumID[0].aqi_mediums_id, customId: param } };
      case "LABS":
        let labID = await this.prisma.aqi_laboratories.findMany({
          where: {
            custom_id: {
              equals: param,
            },
          },
          select: {
            aqi_laboratories_id: true,
          },
        });
        return {
          laboratory: { id: labID[0].aqi_laboratories_id, customId: param },
        };
      case "TAGS":
        let returnTags: any = [];
        for (const tag of param) {
          let tagID = await this.prisma.aqi_context_tags.findMany({
            where: {
              custom_id: {
                equals: tag,
              },
            },
            select: {
              aqi_context_tags_id: true,
            },
          });
          returnTags.push({ id: tagID[0].aqi_context_tags_id, name: tag });
        }
        return returnTags;
      case "TAXONS":
        let taxon = await this.aqiService.getTaxons(param);
        return {
          taxonomy: { id: taxon["aqiId"], customId: taxon["customId"] },
        };
      case "BioLifeStage":
        let stageValue = await this.aqiService.getBioLifeStage(param);
        return {
          lifeStage: {
            id: stageValue["aqiId"],
            customId: stageValue["customId"],
          },
        };
      case "BioSex":
        let sexValue = await this.aqiService.getBioSex(param);
        return {
          lifeStage: { id: sexValue["aqiId"], customId: sexValue["customId"] },
        };
      case "EXTENDED_ATTRIB":
        let eaID = await this.prisma.aqi_extended_attributes.findMany({
          where: {
            custom_id: {
              equals: param[0],
            },
          },
          select: {
            aqi_extended_attributes_id: true,
          },
        });

        if (param[0] == "Specimen Lab Arrival Temperature (°C)") {
          return {
            attributeId: eaID[0].aqi_extended_attributes_id,
            customId: param[0],
            number: +param[1],
          };
        } else if (
          param[0] == "Specimen Tissue Type" ||
          param[0] == "Sampling Agency"
        ) {
          return {
            attributeId: eaID[0].aqi_extended_attributes_id,
            customId: param[0],
            dropDownListItem: { customId: param[1] },
          };
        } else {
          return {
            attributeId: eaID[0].aqi_extended_attributes_id,
            customId: param[0],
            text: param[1],
          };
        }
    }
  }

  async fieldVisitJson(visitData: any, row_number: number, apiType: string) {
    let postData: any = {};
    const extendedAttribs = { extendedAttributes: [] };

    let locationCustomID = visitData.LocationID;
    let projectCustomID = visitData.Project;
    let EAMinistryContact = "Ministry Contact";
    let EASamplingAgency = "Sampling Agency";

    // get the location custom id from object and find location GUID
    Object.assign(
      postData,
      await this.queryCodeTables("LOCATIONS", locationCustomID),
    );
    // get the project custom id from object and find project GUID
    Object.assign(
      postData,
      await this.queryCodeTables("PROJECT", projectCustomID),
    );
    // get the EA custom id (Ministry Contact and Sampling Agency) and find the GUID

    if (visitData.MinistryContact != "") {
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EAMinistryContact,
          visitData.MinistryContact,
        ]),
      );
    }

    if (visitData.SamplingAgency != "") {
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EASamplingAgency,
          visitData.SamplingAgency,
        ]),
      );
    }

    Object.assign(postData, extendedAttribs);
    Object.assign(postData, { startTime: visitData.FieldVisitStartTime });
    Object.assign(postData, { endTime: visitData.FieldVisitEndTime });
    Object.assign(postData, { participants: visitData.FieldVisitParticipants });
    Object.assign(postData, { notes: visitData.FieldVisitComments });
    Object.assign(postData, { planningStatus: visitData.PlanningStatus });

    let currentVisitAndLoc: any = {};
    Object.assign(currentVisitAndLoc, {
      samplingLocation: postData.samplingLocation,
      startTime: postData.startTime,
    });

    if (apiType === "post") {
      Object.assign(currentVisitAndLoc, {
        fieldVisit: await this.aqiService.fieldVisits(row_number, postData),
      });
    } else if (apiType == "put") {
      const GUIDtoUpdate = visitData.id;
      await this.aqiService.putFieldVisits(row_number, GUIDtoUpdate, postData);
      Object.assign(currentVisitAndLoc, {
        fieldVisit: GUIDtoUpdate,
      });
    }
    return currentVisitAndLoc;
  }

  async fieldActivityJson(
    activityData: any,
    row_number: number,
    apiType: string,
  ) {
    let postData: any = {};
    const extendedAttribs = { extendedAttributes: [] };
    const sampleContextTags = { samplingContextTags: [] };

    let locationCustomID = activityData.LocationID;
    let collectionMethodCustomID = activityData.CollectionMethod;
    let mediumCustomID = activityData.Medium;
    let depthUnitCustomID =
      activityData.DepthUnit == ""
        ? null
        : activityData.DepthUnit == "m" || activityData.DepthUnit == "Metre"
          ? "Metre"
          : activityData.DepthUnit == "ft" || activityData.DepthUnit == "Feet"
            ? "Feet"
            : activityData.DepthUnit;

    let depthUnitValue = activityData.DepthUpper;
    let sampleContextTagCustomIds =
      activityData.sampleContextTag == ""
        ? null
        : activityData.sampleContextTag;

    // get the collection method custom id from object and find collection method GUID
    Object.assign(
      postData,
      await this.queryCodeTables(
        "COLLECTION_METHODS",
        collectionMethodCustomID,
      ),
    );
    // get the medium custom id from object and find medium GUID
    Object.assign(
      postData,
      await this.queryCodeTables("MEDIUM", mediumCustomID),
    );

    if (sampleContextTagCustomIds != null) {
      let tagsToLookup = sampleContextTagCustomIds.split(", ");
      sampleContextTags["samplingContextTags"] = await this.queryCodeTables(
        "TAGS",
        tagsToLookup,
      );
    }

    // get the EA custom id (Depth Lower and Depth Upper) and find the GUID
    if (activityData.DepthLower != "") {
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          "Depth Lower",
          activityData.DepthLower,
        ]),
      );
    }

    Object.assign(
      postData,
      await this.queryCodeTables("LOCATIONS", locationCustomID),
    );

    Object.assign(postData, { type: activityData.ActivityType });
    Object.assign(postData, extendedAttribs);
    Object.assign(postData, sampleContextTags);
    Object.assign(postData, { comment: activityData.ActivityComments });
    Object.assign(postData, { startTime: activityData.ObservedDateTime });
    Object.assign(postData, { endTime: activityData.ObservedDateTimeEnd });
    Object.assign(postData, {
      fieldVisit: { id: activityData.fieldVisit },
    });
    Object.assign(postData, { customId: activityData.ActivityName });

    let currentActivity: any = {};

    if (apiType === "post") {
      Object.assign(currentActivity, {
        activity: {
          id: await this.aqiService.fieldActivities(row_number, postData),
          customId: activityData.ActivityName,
          startTime: activityData.ObservedDateTime,
        },
      });
    } else if (apiType === "put") {
      const GUIDtoUpdate = activityData.id;
      await this.aqiService.putFieldActivities(
        row_number,
        GUIDtoUpdate,
        postData,
      );
      Object.assign(currentActivity, {
        activity: {
          id: GUIDtoUpdate,
          customId: activityData.ActivityName,
          startTime: activityData.ObservedDateTime,
        },
      });
    }

    return currentActivity;
  }

  async specimensJson(specimenData: any, row_number: number, apiType: string) {
    let postData: any = {};
    const extendedAttribs = { extendedAttributes: [] };

    let EAWorkOrderNumberCustomID = "Work Order Number";
    let EATissueType = "Specimen Tissue Type";
    let EALabArrivalTemp = "Specimen Lab Arrival Temperature (°C)";
    let mediumCustomID = specimenData.Medium;
    let FieldFiltered = specimenData.FieldFiltered;
    let FieldFilteredComment = specimenData.FieldFilteredComment;
    let analyzingAgencyCustomID = specimenData.AnalyzingAgency;

    Object.assign(
      postData,
      await this.queryCodeTables("MEDIUM", mediumCustomID),
    );

    if (analyzingAgencyCustomID !== "") {
      Object.assign(
        postData,
        await this.queryCodeTables("LABS", analyzingAgencyCustomID),
      );
    }

    // get the EA custom id (EA Work Order Number, FieldFiltered, FieldFilteredComment, FieldPreservative, EALabReportID, SpecimenName) and find the GUID
    if (specimenData.WorkOrderNumber != "") {
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EAWorkOrderNumberCustomID,
          specimenData.WorkOrderNumber,
        ]),
      );
    }
    if (specimenData.TissueType != "") {
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EATissueType,
          specimenData.TissueType,
        ]),
      );
    }
    if (specimenData.LabArrivalTemperature != "") {
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EALabArrivalTemp,
          specimenData.LabArrivalTemperature,
        ]),
      );
    }

    if (FieldFiltered === "TRUE") {
      Object.assign(postData, { filtered: "true" });
      Object.assign(postData, { filtrationComment: FieldFilteredComment });
    } else {
      Object.assign(postData, { filtered: "false" });
    }

    if (specimenData.FieldPreservative != "") {
      Object.assign(postData, { preservative: specimenData.FieldPreservative });
    }

    Object.assign(postData, { name: specimenData.SpecimenName });
    Object.assign(postData, { activity: specimenData.activity });
    Object.assign(postData, extendedAttribs);

    let currentSpecimen: any = {};

    if (apiType === "post") {
      Object.assign(currentSpecimen, {
        specimen: {
          id: await this.aqiService.fieldSpecimens(row_number, postData),
          customId: specimenData.SpecimenName,
          startTime: specimenData.ObservedDateTime,
        },
      });
    } else if (apiType === "put") {
      const GUIDtoUpdate = specimenData.id;
      await this.aqiService.putSpecimens(row_number, GUIDtoUpdate, postData);
      Object.assign(currentSpecimen, {
        specimen: {
          id: GUIDtoUpdate,
          customId: specimenData.SpecimenName,
          startTime: specimenData.ObservedDateTime,
        },
      });
    }
    return currentSpecimen;
  }

  async formulateObservationFile(
    observationData: any,
    originalFileName: string,
  ) {
    const sourceKeys = Object.keys(observationData);
    const targetKeys = Object.keys(obsFile);

    const newObs = {} as ObservationFile;

    for (let i = 0; i < sourceKeys.length; i++) {
      const sourceKey = sourceKeys[i];
      const targetKey = targetKeys[i];

      if (targetKey !== undefined) {
        newObs[targetKey] = observationData[sourceKey];
      }
    }

    const lookupAnalysisMethod = newObs["Lab: Analysis Method"];
    if (lookupAnalysisMethod) {
      const lookupResult = await this.prisma.aqi_analysis_methods.findFirst({
        where: {
          method_id: {
            equals: lookupAnalysisMethod,
          },
        },
        select: {
          method_id: true,
          method_context: true,
          method_name: true,
        },
      });

      if (lookupResult) {
        const methodId = lookupResult.method_id;
        const methodContext = lookupResult.method_context;
        const methodName = lookupResult.method_name;

        const concatAnalysisMethod =
          String(methodId) +
          ";" +
          String(methodName) +
          ";" +
          String(methodContext);
        // Add quotes around the newAnalysisMethod only if it isn't already enclosed in quotes
        newObs["Lab: Analysis Method"] = concatAnalysisMethod;
      }
    }

    const resultUnitLookup = newObs["Result Unit"];
    if (resultUnitLookup) {
      const resultLookUpResult = await this.prisma.aqi_units.findFirst({
        where: {
          edt_unit: {
            equals: resultUnitLookup,
          },
        },
        select: {
          custom_id: true,
        },
      });

      if (resultLookUpResult) {
        const newResultUnit = resultLookUpResult;
        newObs["Result Unit"] = newResultUnit.custom_id;
      }
    }

    const dataClassification = newObs["Data Classification"];
    if (dataClassification == "FIELD_RESULT") {
      newObs["Activity Name"] = "";
    }

    newObs["EA_Upload File Name"] = originalFileName; // this is needed for deletion purposes

    return newObs;
  }

  filterFile<T>(row: any, keys, customAttributes): Partial<T> {
    const filteredObj: Partial<T> = {};
    keys.forEach((key) => {
      if (row.hasOwnProperty(key)) {
        filteredObj[key] = `${row[key]}`;
      }
    });

    if (customAttributes) {
      if (customAttributes.hasOwnProperty("ActivityType")) {
        if (row["DataClassification"] == "VERTICAL_PROFILE") {
          Object.assign(filteredObj, {
            ActivityType: "SAMPLE_INTEGRATED_VERTICAL_PROFILE",
          });
        } else if (row["DataClassification"] == "FIELD_SURVEY") {
          Object.assign(filteredObj, { ActivityType: "FIELD_SURVEY" });
        } else if (
          row["DataClassification"] == "LAB" ||
          row["DataClassification"] == "SURROGATE_RESULT"
        ) {
          if (row["QCType"].toUpperCase().trim() == "REGULAR") {
            Object.assign(filteredObj, { ActivityType: "SAMPLE_ROUTINE" });
          } else {
            Object.assign(filteredObj, {
              ActivityType: `${row["QCType"].toUpperCase().trim()}`,
            });
          }
        } else if (
          row["DataClassification"] == "FIELD_RESULT" ||
          row["DataClassification"] == "ACTIVITY_RESULT"
        ) {
          if (
            row["QCType"].toUpperCase().trim() == "REGULAR" ||
            row["QCType"].toUpperCase().trim() == ""
          ) {
            Object.assign(filteredObj, { ActivityType: "SAMPLE_ROUTINE" });
          } else {
            Object.assign(filteredObj, {
              ActivityType: `${row["QCType"].toUpperCase().trim()}`,
            });
          }
        }
      } else {
        Object.assign(filteredObj, customAttributes);
      }
    }
    return filteredObj;
  }

  async checkHeaders(rowHeaders: any[], fileType: string) {
    let headerErrors = [];
    let sourceHeaders = [];
    const targetHeaders = Object.keys(fileHeaders);

    if (fileType == "xlsx") {
      sourceHeaders = rowHeaders.slice(1);
    } else {
      sourceHeaders = rowHeaders;
    }

    // Normalize by trimming for all comparisons
    const normalizedSourceHeaders = sourceHeaders.map((h) =>
      h !== undefined && h !== null ? `${h}`.trim() : h,
    );
    const normalizedTargetHeaders = targetHeaders.map((h) =>
      h !== undefined && h !== null ? `${h}`.trim() : h,
    );

    // Count matched headers for comparison
    const matchedHeaders = normalizedSourceHeaders.filter(
      (h) =>
        h !== "" &&
        h !== null &&
        h !== undefined &&
        normalizedTargetHeaders.includes(h),
    );
    const nonEmptyTargetHeaders = normalizedTargetHeaders.filter(
      (h) => h !== "" && h !== null && h !== undefined,
    );

    if (matchedHeaders.length != nonEmptyTargetHeaders.length) {
      // Find missing headers by comparing target headers with source headers
      const missingHeaders = normalizedTargetHeaders.filter(
        (header) => !normalizedSourceHeaders.includes(header),
      );
      const extraHeaders = normalizedSourceHeaders.filter(
        (header) => !normalizedTargetHeaders.includes(header),
      );

      let errorMessage = `Invalid number of headers. Got ${matchedHeaders.length}, expected ${nonEmptyTargetHeaders.length}`;

      if (missingHeaders.length > 0) {
        const missingWithPositions = missingHeaders.map((header) => {
          const expectedIndex = normalizedTargetHeaders.indexOf(header);
          return expectedIndex >= 0
            ? `${header} (position ${expectedIndex + 1})`
            : header;
        });
        errorMessage += `. Missing headers: ${missingWithPositions.join(", ")}`;
      }

      if (extraHeaders.length > 0) {
        // Find all positions of extra headers, ensuring each position is only reported once
        const extraWithPositions = [];
        const processedPositions = new Set();

        for (let i = 0; i < normalizedSourceHeaders.length; i++) {
          const header = normalizedSourceHeaders[i];
          if (extraHeaders.includes(header) && !processedPositions.has(i)) {
            extraWithPositions.push(`${header} (position ${i + 1})`);
            processedPositions.add(i);
          }
        }
      }

      let errorLog = `{"rowNum": 1, "type": "ERROR", "message": {"Header": "${errorMessage}"}}`;
      headerErrors.push(JSON.parse(errorLog));
      return headerErrors;
    }

    for (let i = 0; i < normalizedSourceHeaders.length; i++) {
      if (normalizedSourceHeaders[i] !== normalizedTargetHeaders[i]) {
        if (normalizedTargetHeaders[i] === undefined) {
          let errorLog = `{"rowNum": 1, "type": "ERROR", "message": {"Header": "${normalizedSourceHeaders[i]} is invalid. Please check submission file."}}`;
          headerErrors.push(JSON.parse(errorLog));
        } else {
          let errorLog = `{"rowNum": 1, "type": "ERROR", "message": {"Header": "${normalizedSourceHeaders[i]}, should be ${normalizedTargetHeaders[i]}"}}`;
          headerErrors.push(JSON.parse(errorLog));
        }
      }
    }
    return headerErrors;
  }

  async localValidation(rowNumber: number, rowData: any) {
    let errorLogs = [];
    let existingRecords = [];
    // for (const [index, record] of allRecords.entries()) {
    let existingGUIDS = {};
    const isoDateTimeRegex =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(:(\d{2})(\.\d+)?)?(Z|([+-]\d{2}:\d{2}))?$/;

    const numberRegex = /^-?\d+(\.\d+)?$/;

    const dateTimeFields = [
      "FieldVisitStartTime",
      "FieldVisitEndTime",
      "ObservedDateTime",
      "ObservedDateTimeEnd",
      "AnalyzedDateTime",
      "LabArrivalDateandTime",
      "LabPreparedDateTime",
    ];

    const numericalFields = [
      "DepthUpper",
      "DepthLower",
      "ResultValue",
      "MethodDetectionLimit",
      "MethodReportingLimit",
      "LabArrivalTemperature",
    ];

    const unitFields = "ResultUnit";
    let validObservedProperty = false;
    let OPResultType = "";

    if (rowData.hasOwnProperty("ObservedPropertyID")) {
      try {
        if (rowData["ObservedPropertyID"] == "") {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              ObservedPropertyID: "Cannot be empty",
            },
          };
          errorLogs.push(errorLog);
          validObservedProperty = false;
        } else {
          const present = await this.aqiService.databaseLookup(
            "aqi_observed_properties",
            rowData.ObservedPropertyID,
          );

          if (!present) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                ObservedPropertyID: `${rowData.ObservedPropertyID} not found in EnMoDS Observed Properties`,
              },
            };
            errorLogs.push(errorLog);
            validObservedProperty = false;
          } else {
            validObservedProperty = true;
            OPResultType = present[0].result_type;
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating ObservedPropertyID in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            ObservedPropertyID: `Failed to validate. Please contact an administrator.`,
          },
        };
        errorLogs.push(errorLog);
      }
    }

    // check all datetimes
    dateTimeFields.forEach((field) => {
      try {
        if (rowData.hasOwnProperty(field) && rowData[field]) {
          let valid = isISO8601(rowData[field], {
            strict: true,
            strictSeparator: true,
          });
          const yearFromDate = new Date(rowData[field]).getFullYear();
          const currentYear = new Date().getFullYear();

          if (yearFromDate > currentYear) valid = false;

          if (!valid) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                [field]: `${rowData[field]} is not valid ISO DateTime (year might be greater than current year)`,
              },
            };
            errorLogs.push(errorLog);
          }
        } else if (rowData.hasOwnProperty(field) && !rowData[field]) {
          if (field == "FieldVisitStartTime" || field == "ObservedDateTime") {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                [field]: "Cannot be empty",
              },
            };
            errorLogs.push(errorLog);
          } else if (
            field == "AnalyzedDateTime" &&
            (rowData["DataClassification"] == "LAB" ||
              rowData["DataClassification"] == "SURROGATE_RESULT")
          ) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                [field]: `Cannot be empty for data classification ${rowData["DataClassification"]}`,
              },
            };
            errorLogs.push(errorLog);
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating ${field} in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            [field]: `Failed to validate. Please contact an administrator.`,
          },
        };
        errorLogs.push(errorLog);
      }
    });

    // Ensure visit start time is not greater than visit end time
    if (
      rowData.hasOwnProperty("FieldVisitStartTime") &&
      rowData["FieldVisitStartTime"] &&
      rowData.hasOwnProperty("FieldVisitEndTime") &&
      rowData["FieldVisitEndTime"]
    ) {
      const startTime = new Date(rowData["FieldVisitStartTime"]);
      const endTime = new Date(rowData["FieldVisitEndTime"]);

      if (startTime > endTime) {
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            FieldVisitEndTime: `Field Visit Start Time MUST be earlier than or equal to Field Visit End Time`,
          },
        };
        errorLogs.push(errorLog);
      }
    }

    // Ensure observed date time is not greater than observed date time end
    if (
      rowData.hasOwnProperty("ObservedDateTime") &&
      rowData["ObservedDateTime"] &&
      rowData.hasOwnProperty("ObservedDateTimeEnd") &&
      rowData["ObservedDateTimeEnd"]
    ) {
      const observedDateTime = new Date(rowData["ObservedDateTime"]);
      const observedDateTimeEnd = new Date(rowData["ObservedDateTimeEnd"]);

      if (observedDateTime > observedDateTimeEnd) {
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            ObservedDateTimeEnd: `Observed DateTime MUST be earlier than or equal to Observed DateTime End`,
          },
        };
        errorLogs.push(errorLog);
      }
    }

    // check all numerical fields
    numericalFields.forEach(async (field) => {
      try {
        if (rowData.hasOwnProperty(field)) {
          if (validObservedProperty) {
            if (!rowData[field]) {
              if (
                field == "MethodDetectionLimit" &&
                (rowData["DataClassification"] == "LAB" ||
                  rowData["DataClassification"] == "SURROGATE_RESULT")
              ) {
                let errorLog = {
                  rowNum: rowNumber,
                  type: "ERROR",
                  message: {
                    [field]: `Cannot be empty for data classification ${rowData["DataClassification"]}`,
                  },
                };
                errorLogs.push(errorLog);
              }
            }

            if (OPResultType === "NUMERIC") {
              const validNumber =
                numberRegex.test(rowData[field]) &&
                !isNaN(parseFloat(rowData[field]));
              if (
                rowData[field] != null &&
                rowData[field].toString().trim() !== "" &&
                !validNumber
              ) {
                let errorLog;
                if (rowData[field] === `""`) {
                  errorLog = {
                    rowNum: rowNumber,
                    type: "ERROR",
                    message: {
                      [field]: "Empty quotes is not valid number",
                    },
                  };
                } else {
                  errorLog = {
                    rowNum: rowNumber,
                    type: "ERROR",
                    message: {
                      [field]: `${rowData[field]} is not valid number`,
                    },
                  };
                }
                errorLogs.push(errorLog);
              }
            } else {
              const validString =
                typeof rowData[field] === "string" &&
                rowData[field].trim().length > 0;
              if (rowData[field] !== "" && !validString) {
                let errorLog = {
                  rowNum: rowNumber,
                  type: "ERROR",
                  message: {
                    [field]: `${rowData[field]} is not valid number`,
                  },
                };
                errorLogs.push(errorLog);
              }
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating ${field} in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            [field]: `Failed to validate. Please contact an administrator.`,
          },
        };
        errorLogs.push(errorLog);
      }
    });

    // check all unit fields
    try {
      if (rowData.hasOwnProperty(unitFields)) {
        if (rowData[unitFields]) {
          const present = await this.aqiService.databaseLookup(
            "aqi_units",
            rowData[unitFields],
          );

          if (!present) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                [unitFields]: `${rowData[unitFields]} not found in EnMoDS Units`,
              },
            };
            errorLogs.push(errorLog);
          }
        }
      } else if (rowData.hasOwnProperty(unitFields)) {
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            [unitFields]: "Cannot be empty",
          },
        };
        errorLogs.push(errorLog);
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating ${unitFields} in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          [unitFields]: `Failed to validate. Please contact an administrator.`,
        },
      };
      errorLogs.push(errorLog);
    }

    try {
      if (rowData.hasOwnProperty("Depth Unit")) {
        if (rowData["Depth Upper"]) {
          if (rowData["Depth Unit"] != "metre") {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                DepthUnit: `${rowData["Depth Unit"]} is not valid unit for Depth. Only 'Metre' is allowed`,
              },
            };
            errorLogs.push(errorLog);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating Depth Unit in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          DepthUnit: `Failed to validate. Please contact an administrator.`,
        },
      };
      errorLogs.push(errorLog);
    }

    try {
      if (rowData.hasOwnProperty("SamplingAgency")) {
        if (rowData["SamplingAgency"] == "") {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              SamplingAgency: "Cannot be empty",
            },
          };
          errorLogs.push(errorLog);
        } else {
          const present = await this.aqiService.databaseLookup(
            "aqi_sampling_agency",
            rowData.SamplingAgency,
          );
          if (!present) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                SamplingAgency: `${rowData.SamplingAgency} not found in EnMoDS Sampling Agency`,
              },
            };
            errorLogs.push(errorLog);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating SamplingAgency in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          SamplingAgency: `Failed to validate. Please contact an administrator.`,
        },
      };
      errorLogs.push(errorLog);
    }

    try {
      if (rowData.hasOwnProperty("Project")) {
        if (rowData.Project == "") {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              Project: `Project cannot be empty`,
            },
          };
          errorLogs.push(errorLog);
        } else {
          const present = await this.aqiService.databaseLookup(
            "aqi_projects",
            rowData.Project,
          );
          if (!present) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                Project: `${rowData.Project} not found in EnMoDS Projects`,
              },
            };
            errorLogs.push(errorLog);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating Project in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          Project: `Failed to validate. Please contact an administrator.`,
        },
      };
      errorLogs.push(errorLog);
    }

    try {
      if (rowData.hasOwnProperty("LocationID") && rowData["LocationID"] != "") {
        const present = await this.aqiService.databaseLookup(
          "aqi_locations",
          rowData.LocationID,
        );
        if (!present) {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              LocationID: `${rowData.LocationID} not found in EnMoDS Locations`,
            },
          };
          errorLogs.push(errorLog);
        }
      } else {
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            LocationID: "Cannot be empty",
          },
        };
        errorLogs.push(errorLog);
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating LocationID in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          LocationID: "Failed to validate. Please contact an administrator.",
        },
      };
      errorLogs.push(errorLog);
    }

    try {
      if (
        rowData.hasOwnProperty("FieldPreservative") &&
        rowData.FieldPreservative !== ""
      ) {
        const present = await this.aqiService.databaseLookup(
          "aqi_preservatives",
          rowData.FieldPreservative.toUpperCase(),
        );
        if (!present) {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              Preservative: `${rowData.FieldPreservative} not found in EnMoDS Preservatives`,
            },
          };
          errorLogs.push(errorLog);
        }
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating FieldPreservative in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          Preservative: "Failed to validate. Please contact an administrator.",
        },
      };
      errorLogs.push(errorLog);
    }

    try {
      if (rowData.hasOwnProperty("CollectionMethod")) {
        if (
          rowData["DataClassification"] == "LAB" ||
          rowData["DataClassification"] == "SURROGATE_RESULT"
        ) {
          if (rowData["CollectionMethod"] == "") {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                CollectionMethod: `Cannot be empty when Data Classification is ${rowData["DataClassification"]}`,
              },
            };
            errorLogs.push(errorLog);
          } else {
            const present = await this.aqiService.databaseLookup(
              "aqi_collection_methods",
              rowData.CollectionMethod,
            );
            if (!present) {
              let errorLog = {
                rowNum: rowNumber,
                type: "ERROR",
                message: {
                  CollectionMethod: `${rowData.CollectionMethod} not found in EnMoDS Collection Methods`,
                },
              };
              errorLogs.push(errorLog);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating CollectionMethod in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          CollectionMethod:
            "Failed to validate. Please contact an administrator.",
        },
      };
      errorLogs.push(errorLog);
    }

    try {
      if (rowData.hasOwnProperty("Medium")) {
        if (rowData["Medium"] == "") {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              Medium: "Cannot be empty",
            },
          };
          errorLogs.push(errorLog);
        } else {
          const present = await this.aqiService.databaseLookup(
            "aqi_mediums",
            rowData.Medium,
          );
          if (!present) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                Medium: `${rowData.Medium} not found in EnMoDS Mediums`,
              },
            };
            errorLogs.push(errorLog);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating Medium in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          Medium: "Failed to validate. Please contact an administrator.",
        },
      };
      errorLogs.push(errorLog);
    }

    try {
      if (
        rowData.hasOwnProperty("DetectionCondition") &&
        rowData.DetectionCondition
      ) {
        const present = await this.aqiService.databaseLookup(
          "aqi_detection_conditions",
          rowData.DetectionCondition.toUpperCase(),
        );
        if (!present) {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              DetectionCondition: `${rowData.DetectionCondition} not found in EnMoDS Detection Conditions`,
            },
          };
          errorLogs.push(errorLog);
        }
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating DetectionCondition in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          DetectionCondition:
            "Failed to validate. Please contact an administrator.",
        },
      };
      errorLogs.push(errorLog);
    }

    try {
      if (rowData.hasOwnProperty("Fraction") && rowData.Fraction) {
        const present = await this.aqiService.databaseLookup(
          "aqi_sample_fractions",
          rowData.Fraction.toUpperCase(),
        );
        if (!present) {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              Fraction: `${rowData.Fraction} not found in EnMoDS Fractions`,
            },
          };
          errorLogs.push(errorLog);
        }
      }
    } catch (error) {
      this.logger.error(
        `Runtime error validating Fraction in row ${rowNumber}:`,
        error,
      );
      let errorLog = {
        rowNum: rowNumber,
        type: "ERROR",
        message: {
          Fraction: "Failed to validate. Please contact an administrator.",
        },
      };
      errorLogs.push(errorLog);
    }

    if (rowData.hasOwnProperty("DataClassification")) {
      try {
        if (rowData["DataClassification"] == "") {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              DataClassification: "Cannot be empty",
            },
          };
          errorLogs.push(errorLog);
        } else {
          const present = await this.aqiService.databaseLookup(
            "aqi_data_classifications",
            rowData.DataClassification,
          );
          if (!present) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                DataClassification: `${rowData.DataClassification} not found in EnMoDS Data Classifications`,
              },
            };
            errorLogs.push(errorLog);
          }
        }

        if (rowData["CompositeStat"] != "") {
          if (rowData["DataClassification"] != "LAB") {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                DataClassification:
                  "Must be LAB when Composite Stat is provided.",
              },
            };
            errorLogs.push(errorLog);
          }

          if (rowData["DataClassification"] == "LAB") {
            if (rowData["SpecimenName"] == "") {
              let errorLog = {
                rowNum: rowNumber,
                type: "ERROR",
                message: {
                  SpecimenName:
                    "Cannot be empty when Composite Stat is present and Data Classification is LAB.",
                },
              };
              errorLogs.push(errorLog);
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating DataClassification in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            DataClassification:
              "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("FieldFiltered")) {
      try {
        if (
          rowData["DataClassification"] == "LAB" ||
          rowData["DataClassification"] == "SURROGATE_RESULT"
        ) {
          const val = String(rowData["FieldFiltered"]).toLowerCase();
          if (val !== "true" && val !== "false" && val !== "") {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                FieldFiltered: `Value must either be True or False or empty. Value entered is ${rowData["FieldFiltered"]}`,
              },
            };
            errorLogs.push(errorLog);
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating FieldFiltered in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            FieldFiltered:
              "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("SourcefRoundedValue")) {
      try {
        if (rowData["SourceOfRoundedValue"] != "") {
          if (
            rowData["SourceOfRoundedValue"] != "PROVIDED_BY_USER" &&
            rowData["SourceOfRoundedValue"] != "ROUNDING_SPECIFICATION"
          ) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                SourceOfRoundedValue:
                  "Must be PROVIDED_BY_USER or ROUNDING_SPECIFICATION.",
              },
            };
            errorLogs.push(errorLog);
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating SourceOfRoundedValue in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            SourceOfRoundedValue:
              "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("RoundedValue")) {
      try {
        if (
          rowData["RoundedValue"] == "" &&
          rowData["SourceOfRoundedValue"] == "PROVIDED_BY_USER"
        ) {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              RoundedValue:
                "Cannot be empty when Source of Rounded Value is PROVIDED_BY_USER.",
            },
          };
          errorLogs.push(errorLog);
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating RoundedValue in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            RoundedValue:
              "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("RoundingSpecification")) {
      try {
        if (
          rowData["RoundingSpecification"] == "" &&
          rowData["SourceOfRoundedValue"] == "ROUNDING_SPECIFICATION"
        ) {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              RoundingSpecification:
                "Cannot be empty when Source of Rounded Value is ROUNDING_SPECIFICATION.",
            },
          };
          errorLogs.push(errorLog);
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating RoundingSpecification in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            RoundingSpecification:
              "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("AnalyzingAgency")) {
      try {
        if (
          rowData["DataClassification"] == "LAB" ||
          rowData["DataClassification"] == "SURROGATE_RESULT"
        ) {
          if (rowData["AnalyzingAgency"] == "") {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                AnalyzingAgency: `Cannot be empty when Data Classification is ${rowData["DataClassification"]}`,
              },
            };
            errorLogs.push(errorLog);
          } else {
            const present = await this.aqiService.databaseLookup(
              "aqi_laboratories",
              rowData.AnalyzingAgency,
            );
            if (!present) {
              let errorLog = {
                rowNum: rowNumber,
                type: "ERROR",
                message: {
                  AnalyzingAgency: `${rowData.AnalyzingAgency} not found in EnMoDS Agencies`,
                },
              };
              errorLogs.push(errorLog);
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating AnalyzingAgency in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            AnalyzingAgency:
              "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("AnalysisMethod")) {
      try {
        // if data classification is LAB/SURROGATE ensure Analysis Method is entered
        if (
          rowData["DataClassification"] == "LAB" ||
          rowData["DataClassification"] == "SURROGATE_RESULT"
        ) {
          if (rowData["AnalysisMethod"] == "") {
            let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"AnalysisMethod": "Cannot be empty when Data Classification is ${rowData["DataClassification"]}"}}`;
            errorLogs.push(JSON.parse(errorLog));
          } else {
            // if valid OP, then check if the analysis method is an associated method for that OP
            if (validObservedProperty) {
              const present: any = await this.aqiService.databaseLookup(
                "aqi_analysis_methods",
                rowData.AnalysisMethod,
              );

              if (!present) {
                let errorLog = {
                  rowNum: rowNumber,
                  type: "ERROR",
                  message: {
                    AnalysisMethod: `${rowData.AnalysisMethod} not found in EnMoDS Analysis Methods`,
                  },
                };
                errorLogs.push(errorLog);
              }
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating AnalysisMethod in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            AnalysisMethod:
              "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("ResultStatus")) {
      try {
        const present = await this.aqiService.databaseLookup(
          "aqi_result_status",
          rowData.ResultStatus,
        );
        if (!present) {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              ResultStatus: `${rowData.ResultStatus} not found in EnMoDS Result Statuses`,
            },
          };
          errorLogs.push(errorLog);
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating ResultStatus in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            ResultStatus:
              "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("ResultGrade")) {
      try {
        const present = await this.aqiService.databaseLookup(
          "aqi_result_grade",
          rowData.ResultGrade,
        );
        if (!present) {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              ResultGrade: `${rowData.ResultGrade} not found in EnMoDS Result Grades`,
            },
          };
          errorLogs.push(errorLog);
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating ResultGrade in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            ResultGrade: "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("TissueType")) {
      try {
        if (
          rowData["DataClassification"] == "LAB" ||
          rowData["DataClassification"] == "SURROGATE_RESULT"
        ) {
          if (rowData["Medium"] == "Animal - Fish") {
            if (rowData["TissueType"] == "") {
              let errorLog = {
                rowNum: rowNumber,
                type: "ERROR",
                message: {
                  TissueType: `Cannot be empty when Data Classification is ${rowData.DataClassification} and Medium is ${rowData.Medium}`,
                },
              };
              errorLogs.push(errorLog);
            } else if (rowData["TissueType"]) {
              const present = await this.aqiService.databaseLookup(
                "aqi_tissue_types",
                rowData.TissueType,
              );
              if (!present) {
                let errorLog = {
                  rowNum: rowNumber,
                  type: "ERROR",
                  message: {
                    TissueType: `${rowData.TissueType} not found in EnMoDS Tissue Types`,
                  },
                };
                errorLogs.push(errorLog);
              }
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating TissueType in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            TissueType: "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("QCType")) {
      try {
        if (
          rowData["DataClassification"] == "LAB" ||
          rowData["DataClassification"] == "SURROGATE_RESULT"
        ) {
          if (rowData["QCType"].toUpperCase() == "") {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                QCType: `QC Type cannot be empty when data classification is ${rowData.DataClassification}`,
              },
            };
            errorLogs.push(errorLog);
          } else if (
            rowData["QCType"].toUpperCase() != "REGULAR" &&
            rowData["QCType"].toUpperCase() != "BLANK" &&
            rowData["QCType"].toUpperCase() != "REPLICATE" &&
            rowData["QCType"].toUpperCase() != "SPIKE" &&
            rowData["QCType"].toUpperCase() != "OTHER_QC"
          ) {
            // null because the AQI api considers the type REGULAR as NULL
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                QCType: `${rowData.QCType} not found in EnMoDS QC Types`,
              },
            };
            errorLogs.push(errorLog);
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating QCType in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            QCType: "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    if (rowData.hasOwnProperty("SpecimenName")) {
      try {
        if (
          rowData["DataClassification"] == "LAB" ||
          rowData["DataClassification"] == "SURROGATE_RESULT"
        ) {
          if (
            /^Animal\b/.test(rowData["Medium"]) &&
            rowData["SpecimenName"] == ""
          ) {
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                SpecimenName: `Cannot be empty when Medium is ${rowData.Medium} and Data Classification is ${rowData.DataClassification}`,
              },
            };
            errorLogs.push(errorLog);
          }
        }
      } catch (error) {
        this.logger.error(
          `Runtime error validating SpecimenName in row ${rowNumber}:`,
          error,
        );
        let errorLog = {
          rowNum: rowNumber,
          type: "ERROR",
          message: {
            SpecimenName:
              "Failed to validate. Please contact an administrator.",
          },
        };
        errorLogs.push(errorLog);
      }
    }

    // check if the visit/activity already exists -- check if visit timetsamp for that location already exists or activity at that time with that name (or type) exists
    if (rowData["LocationID"] != "") {
      const locationGUID = await this.queryCodeTables(
        "LOCATIONS",
        rowData.LocationID,
      );
      let validFieldVisitStartTime = isISO8601(rowData.FieldVisitStartTime, {
        strict: true,
        strictSeparator: true,
      });
      let yearFromDate = new Date(rowData.FieldVisitStartTime).getFullYear();
      let currentYear = new Date().getFullYear();
      if (yearFromDate > currentYear) validFieldVisitStartTime = false;

      let validObservedDateTime = isISO8601(rowData.ObservedDateTime, {
        strict: true,
        strictSeparator: true,
      });
      yearFromDate = new Date(rowData.FieldVisitStartTime).getFullYear();
      if (yearFromDate > currentYear) validObservedDateTime = false;

      if (
        locationGUID.hasOwnProperty("samplingLocation") &&
        validFieldVisitStartTime &&
        validObservedDateTime
      ) {
        // check if the field visit exists between 00:00:00 - 23:59:59 for a given day, if it does then check if it exists at rowData.FieldVisitStartTime, else continue processing
        // if exists at rowData.FieldVisitStartTime, issue a WARNING (normal), it does not exist give an error message

        this.logger.log(
          `[Row ${rowNumber}] Starting visit validation for Location ${rowData.LocationID} at time ${rowData.FieldVisitStartTime}`,
        );

        // Extract YYYY-MM-DD from FieldVisitStartTime and append time components
        const datePart = rowData.FieldVisitStartTime.split("T")[0]; // Extract YYYY-MM-DD part
        const encodedVisitStartTime = encodeURIComponent(
          rowData.FieldVisitStartTime,
        );
        const encodedVisitEndTime = encodeURIComponent(
          rowData.FieldVisitEndTime,
        );
        const encodedObservedDateTime = encodeURIComponent(
          rowData.ObservedDateTime,
        );
        const visitURLForDay = `/v1/fieldvisits?samplingLocationIds=${locationGUID.samplingLocation.id}&start-startTime=${datePart}T00:00:00-08:00&end-startTime=${datePart}T23:59:59-08:00`;
        const visitURLForTime = `/v1/fieldvisits?samplingLocationIds=${locationGUID.samplingLocation.id}&start-startTime=${encodedVisitStartTime}&end-startTime=${encodedVisitEndTime}`;
        let visitExists = false;
        let visitExistsForDay = false;
        let activityURL = `/v1/activities?samplingLocationIds=${locationGUID.samplingLocation.id}&fromStartTime=${encodedObservedDateTime}&toStartTime=${encodedObservedDateTime}&customId=${rowData.ActivityName}`;
        let activityExists = false;

        this.logger.log(`[Row ${rowNumber}] Checking for visits on entire day`);

        // First check if a field visit exists for the entire day
        if (validationApisCalled.some((item) => item.url === visitURLForDay)) {
          // visit URL for day has been called before
          this.logger.log(
            `[Row ${rowNumber}] Day visit check - using cached result`,
          );
          let seenVisitUrlForDay = validationApisCalled.find(
            (item) => item.url === visitURLForDay,
          );
          if (seenVisitUrlForDay.count > 0) {
            visitExistsForDay = true;
            this.logger.log(
              `[Row ${rowNumber}] Day visit check - found ${seenVisitUrlForDay.count} existing visits for the day`,
            );
          } else {
            this.logger.log(
              `[Row ${rowNumber}] Day visit check - no existing visits found for the day`,
            );
          }
        } else {
          this.logger.log(
            `[Row ${rowNumber}] Day visit check - making API call`,
          );
          const visitURLCalledForDay = await this.aqiService.getFieldVisits(
            rowNumber,
            visitURLForDay,
          );
          if (visitURLCalledForDay.error == null) {
            // this means no error in the api call
            if (visitURLCalledForDay.count > 0) {
              visitExistsForDay = true;
              this.logger.log(
                `[Row ${rowNumber}] Day visit check - API returned ${visitURLCalledForDay.count} existing visits for the day`,
              );
            } else {
              this.logger.log(
                `[Row ${rowNumber}] Day visit check - API returned no existing visits for the day`,
              );
            }
            validationApisCalled.push(visitURLCalledForDay);
          } else {
            this.logger.error(
              `[Row ${rowNumber}] Full day visit check - API call error: ${visitURLCalledForDay.error}`,
            );
            let errorLog = {
              rowNum: rowNumber,
              type: "ERROR",
              message: {
                Visit: `Failed to call AQI API to validate visit. Error: ${visitURLCalledForDay.error}`,
              },
            };
            errorLogs.push(errorLog);
          }
        }

        // If a visit exists for the day, check if it exists at the specific time
        if (visitExistsForDay) {
          this.logger.log(
            `[Row ${rowNumber}] Visit exists for day, checking specific time`,
          );

          if (
            validationApisCalled.some((item) => item.url === visitURLForTime)
          ) {
            // visit URL for specific time has been called before
            this.logger.log(
              `[Row ${rowNumber}] Specific time visit check - using cached result`,
            );
            let seenVisitUrlForTime = validationApisCalled.find(
              (item) => item.url === visitURLForTime,
            );
            if (seenVisitUrlForTime.count > 0) {
              // visit exists at specific time - issue WARNING
              this.logger.log(
                `[Row ${rowNumber}] Specific time visit check - found existing visit at exact time, issuing WARNING`,
              );
              visitExists = true;
              existingGUIDS["visit"] = seenVisitUrlForTime.GUID;
              let errorLog = {
                rowNum: rowNumber,
                type: "WARN",
                message: {
                  Visit: `Visit for Location ${rowData.LocationID} at Start Time ${rowData.FieldVisitStartTime} already exists in EnMoDS Field Visits`,
                },
              };
              errorLogs.push(errorLog);
            } else {
              // visit exists for day but not at specific time - issue ERROR
              this.logger.log(
                `[Row ${rowNumber}] Specific time visit check - visit exists for day but not at specific time, issuing ERROR`,
              );
              let errorLog = {
                rowNum: rowNumber,
                type: "ERROR",
                message: {
                  Visit: `A field visit exists for Location ${rowData.LocationID} on this day, but not at the specified Start Time ${rowData.FieldVisitStartTime}`,
                },
              };
              errorLogs.push(errorLog);
            }
          } else {
            this.logger.log(
              `[Row ${rowNumber}] Specific time visit check - making API call`,
            );
            const visitURLCalledForTime = await this.aqiService.getFieldVisits(
              rowNumber,
              visitURLForTime,
            );
            if (visitURLCalledForTime.error == null) {
              // this means no error in the api call
              if (visitURLCalledForTime.count > 0) {
                // visit exists at specific time - issue WARNING
                this.logger.log(
                  `[Row ${rowNumber}] Specific time visit check - API returned existing visit at exact time, issuing WARNING`,
                );
                visitExists = true;
                existingGUIDS["visit"] = visitURLCalledForTime.GUID;
                let errorLog = {
                  rowNum: rowNumber,
                  type: "WARN",
                  message: {
                    Visit: `Visit for Location ${rowData.LocationID} at Start Time ${rowData.FieldVisitStartTime} already exists in EnMoDS Field Visits`,
                  },
                };
                errorLogs.push(errorLog);
              } else {
                // visit exists for day but not at specific time - issue ERROR
                this.logger.log(
                  `[Row ${rowNumber}] Specific time visit check - API returned no visit at specific time, issuing ERROR`,
                );
                let errorLog = {
                  rowNum: rowNumber,
                  type: "ERROR",
                  message: {
                    Visit: `A field visit exists for Location ${rowData.LocationID} on this day, but not at the specified Start Time ${rowData.FieldVisitStartTime}. Please correct the date time and re-upload the file.`,
                  },
                };
                errorLogs.push(errorLog);
              }
              validationApisCalled.push(visitURLCalledForTime);
            } else {
              this.logger.error(
                `[Row ${rowNumber}] Specific time visit check - API call error: ${visitURLCalledForTime.error}`,
              );
              let errorLog = {
                rowNum: rowNumber,
                type: "ERROR",
                message: {
                  Visit: `Failed to call AQI API to validate visit. Error: ${visitURLCalledForTime.error}`,
                },
              };
              errorLogs.push(errorLog);
            }
          }
        } else {
          this.logger.log(
            `[Row ${rowNumber}] No visits found for the day, skipping specific time check`,
          );
        }

        if (rowData["DataClassification"] != "FIELD_RESULT") {
          // ignoring the activity check for FIELD_RESULT as they do not have parent activity
          this.logger.log(
            `[Row ${rowNumber}] Starting activity validation for DataClassification: ${rowData["DataClassification"]}`,
          );

          if (rowData["DataClassification"] === "VERTICAL_PROFILE") {
            activityURL =
              activityURL + "&activityTypes=SAMPLE_INTEGRATED_VERTICAL_PROFILE";
          } else if (rowData["DataClassification"] === "FIELD_SURVEY") {
            activityURL = activityURL + "&activityTypes=FIELD_SURVEY";
          } else if (rowData["DataClassification"] === "SURROGATE_RESULT") {
            activityURL = activityURL + "&activityTypes=SPIKE";
          }

          this.logger.log(`[Row ${rowNumber}] Checking for activities`);

          if (validationApisCalled.some((item) => item.url === activityURL)) {
            // activity url has been called before
            this.logger.log(
              `[Row ${rowNumber}] Activity check - using cached result`,
            );
            let seenActivityUrl = validationApisCalled.find(
              (item) => item.url === activityURL,
            );

            if (seenActivityUrl.count > 0) {
              // activity exists in AQI
              this.logger.log(
                `[Row ${rowNumber}] Activity check - found existing activity, issuing ERROR`,
              );
              activityExists = true;
              existingGUIDS["activity"] = seenActivityUrl.GUID;
              let errorLog = {
                rowNum: rowNumber,
                type: "ERROR",
                message: {
                  Activity: `Activity Name ${rowData.ActivityName} for Field Visit at Start Time ${rowData.FieldVisitStartTime} already exists in EnMoDS Activities`,
                },
              };
              errorLogs.push(errorLog);
            } else {
              this.logger.log(
                `[Row ${rowNumber}] Activity check - no existing activity found`,
              );
            }
          } else {
            this.logger.log(
              `[Row ${rowNumber}] Activity check - making API call`,
            );
            const activityURLCalled = await this.aqiService.getActivities(
              rowNumber,
              activityURL,
            );
            if (activityURLCalled.error == null) {
              // this means no error in the api call
              if (activityURLCalled.count > 0) {
                // visit exists in AQI
                this.logger.log(
                  `[Row ${rowNumber}] Activity check - API returned existing activity, issuing ERROR`,
                );
                visitExists = true;
                existingGUIDS["activity"] = activityURLCalled.GUID;
                let errorLog = {
                  rowNum: rowNumber,
                  type: "ERROR",
                  message: {
                    Activity: `Activity Name ${rowData.ActivityName} for Field Visit at Start Time ${rowData.FieldVisitStartTime} already exists in EnMoDS Activities`,
                  },
                };
                errorLogs.push(errorLog);
              } else {
                this.logger.log(
                  `[Row ${rowNumber}] Activity check - API returned no existing activity`,
                );
              }
              validationApisCalled.push(activityURLCalled);
            } else {
              this.logger.error(
                `[Row ${rowNumber}] Activity check - API call error: ${activityURLCalled.error}`,
              );
              let errorLog = {
                rowNum: rowNumber,
                type: "ERROR",
                message: {
                  Activity: `Failed to call AQI API to validate activity. Error: ${activityURLCalled.error}`,
                },
              };
              errorLogs.push(errorLog);
            }
          }
        } else {
          this.logger.log(
            `[Row ${rowNumber}] Skipping activity check for FIELD_RESULT data classification`,
          );
        }

        this.logger.log(
          `[Row ${rowNumber}] Visit validation completed - visitExists: ${visitExists}, activityExists: ${activityExists}`,
        );
      }
    }

    let validFieldVisitStartTime = isISO8601(rowData.FieldVisitStartTime, {
      strict: true,
      strictSeparator: true,
    });

    if (rowData.FieldVisitStartTime != "" && validFieldVisitStartTime) {
      // check to see if a field visit for that given day already exists for the location
      const rawDateFromRow = rowData.FieldVisitStartTime;
      const formattedDateFromRow = rawDateFromRow.match(/^(.*?)T/)[1]; // without time
      const locationID = rowData.LocationID;

      // Initialize an array for that location if it has not been checked
      if (!fieldVisitStartTimes[locationID]) {
        fieldVisitStartTimes[locationID] = [];
      }

      // Check to make sure that the exact timestamp DOES NOT exist for that location
      if (!fieldVisitStartTimes[locationID].includes(rawDateFromRow)) {
        // check to see if a visit has already happened on that day - i.e. timestamp but only YYYY-MM-DD
        const sameDayVisit = fieldVisitStartTimes[locationID].some(
          (startTime) => startTime.match(/^(.*?)T/)[1] === formattedDateFromRow,
        );

        if (sameDayVisit) {
          let errorLog = {
            rowNum: rowNumber,
            type: "ERROR",
            message: {
              Visit: `Cannot have more than one visit record on the same day (${rowData.FieldVisitStartTime}) for a location (${rowData.LocationID})`,
            },
          };
          errorLogs.push(errorLog);
        } else {
          fieldVisitStartTimes[locationID].push(rawDateFromRow);
        }
      }
    }

    if (Object.keys(existingGUIDS).length > 0) {
      existingRecords.push({ rowNum: rowNumber, existingGUIDS: existingGUIDS });
    }

    return [errorLogs, existingRecords];
  }

  async validateObsFile(
    observationFilePath: string,
    fileSubmissionId: string,
    fileOperationCode: string,
    errorLogs: any,
  ) {
    /*
     * Do an initial validation on the observation file. This will check the file has the right number of columns, the header names are correct and the order of the headers are right
     * Do a dry run of the observations
     */
    const parser = parse({
      columns: false,
      trim: true,
    });

    let isFirstRow = true;

    fs.createReadStream(observationFilePath)
      .pipe(parser)
      .on("data", (row) => {
        if (isFirstRow) {
          isFirstRow = false;
          const expectedHeaders = Object.keys(obsFile);

          // First check: if the number of columns is correct
          if (row.length !== expectedHeaders.length) {
            let errorLog = `{"rowNum": "N/A", "type": "ERROR", "message": {"ObservationFile": "Invalid number of columns. Expected 40, got ${row.length}"}}`;
            errorLogs.push(JSON.parse(errorLog));
          }

          // Second-Third check: headers match expected names and order
          const headerMismatch = expectedHeaders.some(
            (header, rowNumber) => header !== row[rowNumber],
          );
          if (headerMismatch) {
            let errorLog = `{"rowNum": "N/A", "type": "ERROR", "message": {"ObservationFile": "Headers do not match expected names or order. You can find the expected format here: https://bcenv-enmods-test.aqsamples.ca/import"}}`;
            errorLogs.push(JSON.parse(errorLog));
          }
        }
      })
      .on("end", () => {});

    const observationsErrors = await this.aqiService.importObservations(
      observationFilePath,
      "dryrun",
      fileSubmissionId,
      fileOperationCode,
    );

    const finalErrorLog = this.aqiService.mergeErrorMessages(
      errorLogs,
      observationsErrors,
    );

    return finalErrorLog;
  }

  async rejectFileAndLogErrors(
    file_submission_id: string,
    fileName: string,
    originalFileName: string,
    file_operation_code: string,
    ministryContacts: any,
    localValidationResults: any[],
  ) {
    await this.fileSubmissionsService.updateFileStatus(
      file_submission_id,
      "REJECTED",
    );

    const file_error_log_data = {
      file_submission_id: file_submission_id,
      file_name: fileName,
      original_file_name: originalFileName,
      file_operation_code: file_operation_code,
      ministry_contact: ministryContacts,
      error_log: localValidationResults,
      create_utc_timestamp: new Date(),
    };

    await this.prisma.file_error_logs.create({
      data: file_error_log_data,
    });

    // set the aqi_obs_status record for that file submission id to false
    const aqi_obs_status = await this.prisma.aqi_obs_status.updateMany({
      where: {
        file_submission_id: file_submission_id,
      },
      data: {
        active_ind: false,
      },
    });

    return;
  }

  formulateActivityName(rowData) {
    let newActivityName = "";

    const userActivityName = rowData.ActivityName?.trim() || "";
    const QCType =
      rowData.QCType?.toUpperCase().trim() == ""
        ? "REGULAR"
        : rowData.QCType?.toUpperCase().trim();
    const depthLower = rowData.DepthLower?.trim() || "";
    const depthUpper = rowData.DepthUpper?.trim() || "";
    const medium = rowData.Medium?.trim() || "";
    const locnId = rowData.LocationID?.trim() || "";
    const observedTime = rowData.ObservedDateTime?.trim() || "";
    const separator = ";";

    // General template for activity name: <User Supplied Activity Name><sep><QC Type><sep><Depth Upper><Hyphen><Depth Lower>m<sep><Medium><sep><Location ID><sep><Observed Datetime>

    // Case 1: Only depth lower missing - only use depth upper
    if (
      (depthLower === "" || depthLower === undefined) &&
      depthUpper !== "" &&
      depthUpper !== undefined
    ) {
      newActivityName =
        userActivityName +
        separator +
        QCType +
        separator +
        depthUpper +
        "m" +
        separator +
        medium +
        separator +
        locnId +
        separator +
        observedTime;
      // Case 2: Only depth upper missing - only use depth lower
    } else if (
      depthLower !== "" &&
      depthLower !== undefined &&
      (depthUpper === "" || depthUpper === undefined)
    ) {
      newActivityName =
        userActivityName +
        separator +
        QCType +
        separator +
        depthLower +
        "m" +
        separator +
        medium +
        separator +
        locnId +
        separator +
        observedTime;
      // Case 3: Both depths missing - don't include depth at all
    } else if (
      (depthLower === "" || depthLower === undefined) &&
      (depthUpper === "" || depthUpper === undefined)
    ) {
      newActivityName =
        userActivityName +
        separator +
        QCType +
        separator +
        medium +
        separator +
        locnId +
        separator +
        observedTime;
      // Case 4: Activity name missing and the depths missing - don't include either of those
    } else if (
      (userActivityName === "" || userActivityName === undefined) &&
      (depthLower === "" || depthLower === undefined) &&
      (depthUpper === "" || depthUpper === undefined)
    ) {
      newActivityName =
        QCType +
        separator +
        medium +
        separator +
        locnId +
        separator +
        observedTime;
      // Case 5: All fields present
    } else {
      newActivityName =
        userActivityName +
        separator +
        QCType +
        separator +
        depthUpper +
        "-" +
        depthLower +
        "m" +
        separator +
        medium +
        separator +
        locnId +
        separator +
        observedTime;
    }

    return newActivityName;
  }

  cleanRowBasedOnDataClassification(rowData: any) {
    let cleanedRow = rowData;

    cleanedRow.QCType = rowData.QCType.toUpperCase(); // only set to upper case to use in the activity name

    let concatActivityName = this.formulateActivityName(rowData);

    if (
      rowData.DataClassification == "LAB" ||
      rowData.DataClassification == "SURROGATE_RESULT"
    ) {
      cleanedRow.ObservationID = "";
      cleanedRow.FieldDeviceID = "";
      cleanedRow.FieldDeviceType = "";
      cleanedRow.SamplingContextTag = "";
      cleanedRow.LimitType = "";
      cleanedRow.ResultStatus = "Preliminary";
      cleanedRow.ResultGrade = "Ungraded";
      cleanedRow.ActivityID = "";
      cleanedRow.ActivityName = concatActivityName;
      cleanedRow.TissueType =
        rowData.Medium === "Animal - Fish" ? rowData.TissueType : "";
      // QC Type should be blank as AQS rejects REGULAR, however, business requirement is to ensure the user enters REGULAR
    } else if (
      rowData.DataClassification == "FIELD_RESULT" ||
      rowData.DataClassification == "ACTIVITY_RESULT" ||
      rowData.DataClassification == "VERTICAL_PROFILE" ||
      rowData.DataClassification == "FIELD_SURVEY"
    ) {
      cleanedRow.ObservationID = "";
      cleanedRow.SamplingContextTag = "";
      cleanedRow.LimitType = "";
      cleanedRow.ResultStatus = "Preliminary";
      cleanedRow.ResultGrade = "Ungraded";
      cleanedRow.ActivityID = "";
      cleanedRow.ActivityName =
        rowData.DataClassification == "ACTIVITY_RESULT"
          ? concatActivityName
          : rowData.DataClassification == "FIELD_SURVEY"
            ? concatActivityName + ";FS"
            : "";
      cleanedRow.FieldFiltered = "";
      cleanedRow.FieldFilteredComment = "";
      cleanedRow.FieldPreservative = "";
      cleanedRow.Fraction = "";
      cleanedRow.LabArrivalTemperature = "";
      cleanedRow.LabQualityFlag = "";
      cleanedRow.LabArrivalDateandTime = "";
      cleanedRow.LabPreparedDateTime = "";
      cleanedRow.LabSampleID = "";
      cleanedRow.LabDilutionFactor = "";
      cleanedRow.QCSourceActivityName = "";
      cleanedRow.AnalyzingAgency = "";
      cleanedRow.AnalysisMethod = "";
      cleanedRow.AnalyzedDateTime = "";
      cleanedRow.SpecimenName =
        rowData.DataClassification == "FIELD_SURVEY"
          ? rowData.SpecimenName
          : "";
      cleanedRow.QCType = "";
      cleanedRow.CompositeStat = "";
      cleanedRow.TissueType = "";
      cleanedRow.BioLifeStage =
        rowData.DataClassification == "FIELD_SURVEY"
          ? rowData.BioLifeStage
          : "";
    }

    return cleanedRow;
  }

  async validateRowData(
    rowData: any,
    ministryContacts: any,
    csvStream: any,
    allNonObsErrors: any,
    allExistingRecords: any,
    originalFileName: any,
    rowNumber: any,
  ) {
    const fieldVisitCustomAttributes: Partial<FieldVisits> = {
      PlanningStatus: "DONE",
    };

    // if any \t character found, escape it
    const cleanSpecialChars: any = {};
    for (const [key, value] of Object.entries(rowData)) {
      if (typeof value === "string") {
        cleanSpecialChars[key] = value.replace(/\t/g, "\\t");
      } else {
        cleanSpecialChars[key] = value;
      }
    }

    /*
     * From the input file get all the atrributes and values for each sub section - Visits, Activities, Specimens and Observations
     */
    const fieldVisit = this.filterFile<FieldVisits>(
      rowData,
      Object.keys(visits),
      fieldVisitCustomAttributes,
    );

    ministryContacts.add(fieldVisit.MinistryContact); // getting the ministry contacts (this will result in a unique list at the end of all rows)

    if (rowData.DataClassification == "VERTICAL_PROFILE") {
      rowData.SpecimenName = "";
    }

    if (rowData.DataClassification == "FIELD_RESULT") {
      // TODO: add VERTICAL_PROFILE to this if when AQI fixed their bug and remove the if block above this
      rowData.SpecimenName = "";
      rowData.ActivityName == "";
    }

    const observation = this.filterFile<Observations>(
      rowData,
      Object.keys(observations),
      null,
    );

    observation.QCType =
      observation.QCType.toUpperCase().trim() == "REGULAR"
        ? ""
        : observation.QCType.toUpperCase().trim();

    const obsRecord = await this.formulateObservationFile(
      observation,
      originalFileName,
    );

    const csvRow = Object.values(obsRecord);

    this.logger.log(`Created observation object for row ${rowNumber}`);

    csvStream.write(csvRow);

    this.logger.log(`Wrote observation object to file for row ${rowNumber}`);

    /*
     * Do the local validation for each section here - if passed then go to the API calls - else create the message/file/email for the errors
     */

    this.logger.log(`Started local validation for row ${rowNumber}`);

    const recordLocalValidationResults = await this.localValidation(
      rowNumber,
      rowData,
    );

    this.logger.log(`Finished local validation for row ${rowNumber}`);

    allNonObsErrors.push(...recordLocalValidationResults[0]);
    allExistingRecords.push(...recordLocalValidationResults[1]);
  }

  async finalValidationStep(
    ministryContacts: Set<unknown>,
    filePath: any,
    file_submission_id: string,
    file_operation_code: string,
    allNonObsErrors: any[],
  ) {
    const uniqueMinistryContacts: any = Array.from(ministryContacts);

    // send the obsfile for validation here
    const fileValidationResults = [];
    const finalErrorLogs = await this.validateObsFile(
      filePath,
      file_submission_id,
      file_operation_code,
      allNonObsErrors,
    );

    fileValidationResults.push(...finalErrorLogs);

    return [uniqueMinistryContacts, fileValidationResults];
  }

  async insertDataNonObservations(
    rowNumber: number,
    rowData: any,
    GuidsToSave: any,
    fileName: string,
    validationErrors: any[],
  ) {
    const fieldVisitCustomAttributes: Partial<FieldVisits> = {
      PlanningStatus: "DONE",
    };

    const fieldActivityCustomAttrib: Partial<FieldActivities> = {
      ActivityType: "",
    };

    /*
     * From the input file get all the atrributes and values for each sub section - Visits, Activities, Specimens and Observations
     */
    const fieldVisit = this.filterFile<FieldVisits>(
      rowData,
      Object.keys(visits),
      fieldVisitCustomAttributes,
    );

    const fieldActivity = this.filterFile<FieldActivities>(
      rowData,
      Object.keys(activities),
      fieldActivityCustomAttrib,
    );

    const specimen = this.filterFile<FieldSpecimens>(
      rowData,
      Object.keys(specimens),
      null,
    );

    if (rowData.DataClassification == "VERTICAL_PROFILE") {
      specimen.SpecimenName = "";
    }

    if (rowData.DataClassification == "FIELD_RESULT") {
      // TODO: add VERTICAL_PROFILE to this if when AQI fixed their bug and remove the if block above this
      specimen.SpecimenName = "";
      fieldActivity.ActivityName == "";
    }

    /*
     * for each of the components (visits, activities, specimens):
     * make a call to AQI to see if the data exists (if not already called then add that URL to the list of URLs)
     * If exists - get the GUID and update the child object (if not the n-th child)
     * Otherwise - do a POST with the respective object to the respective API; save the GUID to the db table and save the URL to the list of URLs
     */

    const locationGUID = await this.queryCodeTables(
      "LOCATIONS",
      rowData.LocationID,
    );

    const encodedVisitStartTime = encodeURIComponent(
      rowData.FieldVisitStartTime,
    );
    const encodedObservedDateTime = encodeURIComponent(
      rowData.ObservedDateTime,
    );

    const visitURL = `/v1/fieldvisits?samplingLocationIds=${locationGUID.samplingLocation.id}&start-startTime=${encodedVisitStartTime}&end-startTime=${encodedVisitStartTime}`;
    const activityURL = `/v1/activities?samplingLocationIds=${locationGUID.samplingLocation.id}&fromStartTime=${encodedObservedDateTime}&toStartTime=${encodedObservedDateTime}&customId=${rowData.ActivityName}`;
    let visitInfo: any;
    let activityInfo: any;

    if (validationApisCalled.some((item) => item.url === visitURL)) {
      this.logger.log(`Visit URL seen, getting from lookup`);
      // visit url has been called before
      let seenVisitUrl = validationApisCalled.find(
        (item) => item.url === visitURL,
      );

      if (seenVisitUrl.count > 0) {
        this.logger.log(`Visit URL seen, visit already exists`);
        // send PUT to AQI and add visit data to activity
        fieldVisit["id"] = seenVisitUrl.GUID;
        fieldActivity["fieldVisit"] = seenVisitUrl.GUID;
        fieldActivity["LocationID"] = rowData.LocationID;
        GuidsToSave["visits"].push(seenVisitUrl.GUID);
        this.logger.log(
          `Added field visit GUID ${seenVisitUrl.GUID} to list of imported items`,
        );
      } else {
        this.logger.log(`Visit URL seen, visit does not exist`);

        // send POST to AQI and add visit data to activity
        this.logger.log("POSTED the visit");
        visitInfo = await this.fieldVisitJson(fieldVisit, rowNumber, "post");
        let visitGuid = Array.isArray(visitInfo.fieldVisit)
          ? visitInfo.fieldVisit[0]
          : visitInfo.fieldVisit;

        if (visitGuid === "partialUpload") {
          partialUpload = true;
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Partial Upload": "Issued a rollback as a partial upload was detected. Cause of partial upload: ${visitInfo.fieldVisit[1]}"}}`;
          validationErrors.push(JSON.parse(errorLog));
          return;
        }

        fieldActivity["fieldVisit"] = visitGuid;
        fieldActivity["LocationID"] = rowData.LocationID;
        GuidsToSave["visits"].push(visitGuid);
        this.logger.log(
          `Added field visit GUID ${visitGuid} to list of imported items`,
        );

        this.logger.log(`Updating the seen URL`);

        seenVisitUrl.count = 1;
        seenVisitUrl.GUID = visitGuid;
      }
    } else {
      this.logger.log(`Visit URL not seen, making GET call`);

      let visitExists = await this.aqiService.getFieldVisits(
        rowNumber,
        visitURL,
      );
      if (visitExists.count > 0) {
        this.logger.log(`Visit URL not seen, visit already exists`);

        // send PUT to AQI and add visit data to activity
        fieldVisit["id"] = visitExists.GUID;
        fieldActivity["fieldVisit"] = visitExists.GUID;
        fieldActivity["LocationID"] = rowData.LocationID;
        GuidsToSave["visits"].push(visitExists.GUID);
        this.logger.log(
          `Added field visit GUID ${visitExists.GUID} to list of imported items`,
        );
      } else {
        this.logger.log(`Visit URL not seen, visit does not exist`);

        // send POST to AQI and add visit data to activity
        visitInfo = await this.fieldVisitJson(fieldVisit, rowNumber, "post");
        let visitGuid = Array.isArray(visitInfo.fieldVisit)
          ? visitInfo.fieldVisit[0]
          : visitInfo.fieldVisit;
        if (visitGuid === "partialUpload") {
          partialUpload = true;
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Partial Upload": "Issued a rollback as a partial upload was detected. Cause of partial upload: ${visitInfo.fieldVisit[1]}"}}`;
          validationErrors.push(JSON.parse(errorLog));
          return;
        }
        fieldActivity["fieldVisit"] = visitGuid;
        fieldActivity["LocationID"] = rowData.LocationID;
        GuidsToSave["visits"].push(visitGuid);
        this.logger.log(
          `Added field visit GUID ${visitGuid} to list of imported items`,
        );
      }

      this.logger.log(`Added visist URL to seen list`);

      validationApisCalled.push(visitURL);
    }

    if (rowData.DataClassification !== "FIELD_RESULT") {
      if (validationApisCalled.some((item) => item.url === activityURL)) {
        // visit url has been called before
        let seenActivityUrl = validationApisCalled.find(
          (item) => item.url === activityURL,
        );

        if (seenActivityUrl.count > 0) {
          // send PUT to AQI
          fieldActivity["id"] = seenActivityUrl.GUID;
          specimen["activity"] = {
            id: seenActivityUrl.GUID,
            customId: rowData.ActivityName,
            startTime: rowData.ObservedDateTime,
          };
          GuidsToSave["activities"].push(seenActivityUrl.GUID);
          this.logger.log(
            `Added activity GUID ${seenActivityUrl.GUID} to list of imported items`,
          );
        } else {
          // send POST to AQI
          this.logger.log("POSTED the activity");
          activityInfo = await this.fieldActivityJson(
            fieldActivity,
            rowNumber,
            "post",
          );

          let activityGuid = Array.isArray(activityInfo.activity)
            ? activityInfo.activity[0]
            : activityInfo.activity;

          if (activityGuid === "partialUpload") {
            partialUpload = true;
            let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"PartialUpload": "Issued a rollback as a partial upload was detected. Cause of partial upload: ${activityInfo.activity[1]}"}}`;
            validationErrors.push(JSON.parse(errorLog));
            return;
          }

          specimen["activity"] = activityInfo.activity;
          GuidsToSave["activities"].push(activityInfo.activity.id);
          this.logger.log(
            `Added activity GUID ${activityInfo.activity.id} to list of imported items`,
          );

          seenActivityUrl.count = 1;
          seenActivityUrl.GUID = activityInfo.activity.id;
        }
      } else {
        let activityExists = await this.aqiService.getActivities(
          rowNumber,
          activityURL,
        );

        if (activityExists.count > 0) {
          // send PUT to AQI
          fieldActivity["id"] = activityExists.GUID;
          specimen["activity"] = {
            id: activityExists.GUID,
            customId: rowData.ActivityName,
            startTime: rowData.ObservedDateTime,
          };
          GuidsToSave["activities"].push(activityExists.GUID);
          this.logger.log(
            `Added activity GUID ${activityExists.GUID} to list of imported items`,
          );
        } else {
          // send POST to AQI
          activityInfo = await this.fieldActivityJson(
            fieldActivity,
            rowNumber,
            "post",
          );

          let activityGuid = Array.isArray(activityInfo.activity)
            ? activityInfo.activity[0]
            : activityInfo.activity;

          if (activityGuid === "partialUpload") {
            partialUpload = true;
            let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"PartialUpload": "Issued a rollback as a partial upload was detected. Cause of partial upload: ${activityInfo.activity[1]}"}}`;
            validationErrors.push(JSON.parse(errorLog));
            return;
          }

          specimen["activity"] = activityInfo.activity;
          GuidsToSave["activities"].push(activityInfo.activity.id);
          this.logger.log(
            `Added activity GUID ${activityInfo.activity.id} to list of imported items`,
          );

          validationApisCalled.push(activityURL);
        }
      }
    }

    if (
      rowData.DataClassification !== "VERTICAL_PROFILE" &&
      rowData.DataClassification !== "FIELD_RESULT" &&
      rowData.DataClassification !== "ACTIVITY_RESULT"
    ) {
      let specimenInfo: any;

      // send POST to AQI
      specimenInfo = await this.specimensJson(specimen, rowNumber, "post");
      let specimenGuid = Array.isArray(specimenInfo.specimen.id)
        ? specimenInfo.specimen.id[0]
        : specimenInfo.specimen.id;

      if (specimenGuid === "partialUpload") {
        partialUpload = true;
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"PartialUpload": "Issued a rollback as a partial upload was detected. Cause of partial upload: ${specimenInfo.specimen.id[1]}"}}`;
        validationErrors.push(JSON.parse(errorLog));
        return;
      }
      if (specimenInfo.specimen.id != "exists") {
        // response true means that the specimen already exists for that activity -- essentially skipping that post and save here
        GuidsToSave["specimens"].push(specimenInfo.specimen.id);
        this.logger.log(
          `Added specimen GUID ${specimenInfo.specimen.id} to list of imported items`,
        );
      } else {
        this.logger.log(
          `Added specimen GUID ${specimenInfo.specimen.id} to list of imported items`,
        );
      }
    }

    /*
        Use the object of the imported GUIDs to update the db table (aqi_imported_data) - this table is then used for the deletion of data
    */
    const guidsToUpdate = await this.prisma.aqi_imported_data.findMany({
      where: {
        file_name: fileName,
      },
      select: {
        aqi_imported_data_id: true,
        imported_guids: true,
      },
    });

    const updatedJson = {
      visits: Array.from(
        new Set([
          ...(guidsToUpdate[0].imported_guids["visits"] || []),
          ...(GuidsToSave["visits"] || []),
        ]),
      ),
      activities: Array.from(
        new Set([
          ...(guidsToUpdate[0].imported_guids["activities"] || []),
          ...(GuidsToSave["activities"] || []),
        ]),
      ),
      specimens: Array.from(
        new Set([
          ...(guidsToUpdate[0].imported_guids["specimens"] || []),
          ...(GuidsToSave["specimens"] || []),
        ]),
      ),
      observations: guidsToUpdate[0].aqi_imported_data_id["observations"] || [],
    };

    await this.prisma.$transaction(async (prisma) => {
      await this.prisma.aqi_imported_data.update({
        where: {
          aqi_imported_data_id: guidsToUpdate[0].aqi_imported_data_id,
        },
        data: {
          imported_guids: updatedJson,
        },
      });
    });

    return;
  }

  async insertObservations(
    fileName: string,
    originalFileName: string,
    filePath: any,
    file_submission_id: string,
    file_operation_code: string,
    uniqueMinistryContacts: any,
    fileValidationResults: any,
  ) {
    // Import Observations file after all the visits, activities and specimens have been inserted

    const observationsErrors = await this.aqiService.importObservations(
      filePath,
      "import",
      file_submission_id,
      file_operation_code,
    );
    // send the obsErrors to the rollback routine
    const fileErrors = [...fileValidationResults, ...observationsErrors];
    if (observationsErrors.length > 0) {
      await this.rollBackPartialUpload(
        [],
        fileName,
        file_submission_id,
        originalFileName,
        file_operation_code,
        uniqueMinistryContacts,
        fileErrors,
        filePath,
      );
      this.logger.warn("Deleted the partially imported data");
      rollBackHalted = false;
      return;
    }

    await this.fileSubmissionsService.updateFileStatus(
      file_submission_id,
      "SUBMITTED",
    );

    // Save the created observation GUIDs to aqi_imported
    const observationGUIDS =
      await this.aqiService.getObservationsFromFile(fileName);

    const guidsToUpdate = await this.prisma.aqi_imported_data.findMany({
      where: {
        file_name: fileName,
      },
      select: {
        aqi_imported_data_id: true,
        imported_guids: true,
      },
    });

    const importedGuids = guidsToUpdate[0].imported_guids as {
      [key: string]: any;
    };
    const finalImportedJSON = {
      ...importedGuids,
      observations: observationGUIDS,
    };

    await this.prisma.$transaction(async (prisma) => {
      await this.prisma.aqi_imported_data.update({
        where: {
          aqi_imported_data_id: guidsToUpdate[0].aqi_imported_data_id,
        },
        data: {
          imported_guids: finalImportedJSON,
        },
      });
    });

    await this.prisma.$transaction(async (prisma) => {
      const updateStatus = await this.prisma.file_submission.update({
        where: {
          submission_id: file_submission_id,
        },
        data: {
          sample_count: guidsToUpdate[0].imported_guids["activities"].length,
          results_count: observationGUIDS.length,
        },
      });
    });

    const file_error_log_data = {
      file_submission_id: file_submission_id,
      file_name: fileName,
      original_file_name: originalFileName,
      file_operation_code: file_operation_code,
      ministry_contact: uniqueMinistryContacts,
      error_log: fileValidationResults,
      create_utc_timestamp: new Date(),
    };

    await this.prisma.file_error_logs.create({
      data: file_error_log_data,
    });

    // set the aqi_obs_status record for that file submission id to false
    const aqi_obs_status = await this.prisma.aqi_obs_status.updateMany({
      where: {
        file_submission_id: file_submission_id,
      },
      data: {
        active_ind: false,
      },
    });

    fs.unlink(filePath, (err) => {
      if (err) {
        this.logger.error(`Error cleaning up tempObsFiles`, err);
      } else {
        this.logger.log(`Successfully cleaned up tempObsFiles.`);
      }
    });

    await this.notificationsService.notifyUserOfError(file_submission_id);

    return;
  }

  async cleanAndValidate(
    row: any,
    headers: any[],
    rowNumber: number,
    ministryContacts,
    csvStream,
    allNonObsErrors,
    allExistingRecords,
    originalFileName,
    fileType,
  ) {
    try {
      let rowData: Record<string, string> = {};
      this.logger.log(`Started creating object for row ${rowNumber}`);
      if (fileType == ".xlsx") {
        // Get the row values, remove the first empty cell, and map to headers
        rowData = headers
          .map((header, colNumber) => {
            const cellValue: any = row.getCell(colNumber + 1).value; // using getCell to access value with a 1-based index pattern
            let value: any;
            if (typeof cellValue === "object" && cellValue !== null) {
              if ("result" in cellValue) {
                value = cellValue.result;
              } else if ("text" in cellValue) {
                value = cellValue.text;
              } else if ("richText" in cellValue) {
                value = cellValue.richText
                  .map((part: any) => part.text)
                  .join("");
              } else {
                value = JSON.stringify(cellValue);
              }
            } else {
              value = cellValue ?? "";
            }

            return {
              [header]: String(value).replace(/\r?\n/g, " "),
            };
          })
          .reduce((acc, curr) => ({ ...acc, ...curr }), {});

        rowData = await this.cleanRowBasedOnDataClassification(rowData);
      } else if (fileType == ".csv" || fileType == ".txt") {
        headers.forEach((header) => {
          rowData[header] = String(row[header] ?? "").replace(/\r?\n/g, " ");
        });

        rowData = await this.cleanRowBasedOnDataClassification(rowData);
      }

      if (!/^Animal - .+/.test(rowData["Medium"])) {
        rowData["BiologicalLifeStage"] = "";
      }

      if (
        rowData["DataClassification"] !== "LAB" &&
        rowData["DataClassification"] !== "SURROGATE_RESULT" &&
        rowData["DataClassification"] !== "FIELD_SURVEY"
      ) {
        rowData["BiologicalLifeStage"] = "";
      }

      this.logger.log(`Finished creating object for row ${rowNumber}`);

      this.logger.log(`Sent row ${rowNumber} for validation`);
      await this.validateRowData(
        rowData,
        ministryContacts,
        csvStream,
        allNonObsErrors,
        allExistingRecords,
        originalFileName,
        rowNumber,
      );
    } catch (err) {
      this.logger.error("Error in validateRowData:", err.message, err.stack);
      throw err;
    }
  }

  async importRow(
    row: any,
    headers: any[],
    rowNumber: number,
    fileName: string,
    GuidsToSave: any,
    fileType,
    file_submission_id,
    original_file_name,
    file_operation_code,
    ministry_contacts,
    validationErrors: any[],
    filePath: string,
  ) {
    try {
      let rowData: Record<string, string> = {};
      this.logger.log(`Started creating object for row ${rowNumber}`);
      if (fileType == ".xlsx") {
        // Get the row values, remove the first empty cell, and map to headers
        rowData = headers
          .map((header, colNumber) => {
            const cellValue: any = row.getCell(colNumber + 1).value; // using getCell to access value with a 1-based index pattern
            const value =
              typeof cellValue === "object" &&
              cellValue != null &&
              "result" in cellValue
                ? cellValue.result
                : cellValue ?? "";
            return {
              [header]: String(value).replace(/\r?\n/g, " "),
            };
          })
          .reduce((acc, curr) => ({ ...acc, ...curr }), {});

        rowData = await this.cleanRowBasedOnDataClassification(rowData);
      } else if (fileType == ".csv" || fileType == ".txt") {
        headers.forEach((header) => {
          rowData[header] = String(row[header] ?? "").replace(/\r?\n/g, " ");
        });

        rowData = await this.cleanRowBasedOnDataClassification(rowData);
      }
      this.logger.log(`Finished creating object for row ${rowNumber}`);

      this.logger.log(`Sent row ${rowNumber} for import`);
      await this.insertDataNonObservations(
        rowNumber,
        rowData,
        GuidsToSave,
        fileName,
        validationErrors,
      );
      if (partialUpload) {
        await this.rollBackPartialUpload(
          GuidsToSave,
          fileName,
          file_submission_id,
          original_file_name,
          file_operation_code,
          ministry_contacts,
          validationErrors,
          filePath,
        );
        this.logger.warn("Deleted the partially imported data");
        rollBackHalted = false;
        return;
      }
      this.logger.log(`Completed import for row ${rowNumber}`);
    } catch (err) {
      this.logger.error("Error in async ops:", err.message);
      throw err;
    }
  }

  async rollBackPartialUpload(
    GuidsToSave,
    fileName,
    file_submission_id,
    originalFileName,
    file_operation_code,
    ministryContacts: any,
    validationErrors,
    filePath,
  ) {
    // get the partially imported guids
    const partiallyImportedGUIDS = await this.prisma.aqi_imported_data.findMany(
      {
        where: {
          file_name: fileName,
        },
        select: {
          aqi_imported_data_id: true,
          imported_guids: true,
        },
      },
    );

    let deleteErrors = [];

    let partiallyImportedSpecimens =
      partiallyImportedGUIDS[0].imported_guids["specimens"];
    let partiallyImportedActivitiess =
      partiallyImportedGUIDS[0].imported_guids["activities"];
    let partiallyImportedVisits =
      partiallyImportedGUIDS[0].imported_guids["visits"];

    let mergedSpecimens = [];
    let mergedActivities = [];
    let mergedVisits = [];

    if (GuidsToSave.length > 0) {
      mergedSpecimens = [
        ...partiallyImportedSpecimens,
        ...GuidsToSave.specimens,
      ];
    } else {
      mergedSpecimens = [...partiallyImportedSpecimens];
    }

    if (GuidsToSave.length > 0) {
      mergedActivities = [
        ...partiallyImportedActivitiess,
        ...GuidsToSave.activities,
      ];
    } else {
      mergedActivities = [...partiallyImportedActivitiess];
    }

    if (GuidsToSave.length > 0) {
      mergedVisits = [...partiallyImportedVisits, ...GuidsToSave.visits];
    } else {
      mergedVisits = [...partiallyImportedVisits];
    }

    // do a health check here. if fails then save these guids to imported guids, set the status of file to ROLLBACK, set an error message for that import

    let aqiStatus = await this.aqiService.healthCheck();

    if (aqiStatus != 200) {
      rollBackHalted = true;
      this.logger.warn(
        `Third party service, AQI, is currently unavailable. Rollback will be halted.`,
      );

      await this.fileSubmissionsService.updateFileStatus(
        file_submission_id,
        "ROLLBACK",
      );

      let rollbackError = [];
      let errorMessage = `{"rowNum": "N/A", "type": "ERROR", "message": {"Rollback": "Error in importing the file, rollback required. AQI is currently unavailable. Rollback will be halted until AQI is back up and running."}}`;
      rollbackError.push(JSON.parse(errorMessage));
      const file_error_log_data = {
        file_submission_id: file_submission_id,
        file_name: fileName,
        original_file_name: originalFileName,
        file_operation_code: file_operation_code,
        ministry_contact: ministryContacts,
        error_log: rollbackError,
        create_utc_timestamp: new Date(),
      };

      await this.prisma.file_error_logs.create({
        data: file_error_log_data,
      });

      let newPartialGuids = {
        visits: Array.from(new Set([...(mergedVisits || [])])),
        activities: Array.from(new Set([...(mergedActivities || [])])),
        specimens: Array.from(new Set([...(mergedSpecimens || [])])),
        observations: Array.from(new Set([])),
      };

      await this.prisma.$transaction(async (prisma) => {
        await this.prisma.aqi_imported_data.update({
          where: {
            aqi_imported_data_id:
              partiallyImportedGUIDS[0].aqi_imported_data_id,
          },
          data: {
            imported_guids: newPartialGuids,
          },
        });
      });

      await this.notificationsService.notifyUserOfError(file_submission_id);

      return;
    }

    //delete the partially imported specimens
    await this.aqiService.SpecimenDelete(mergedSpecimens, deleteErrors);

    //delete the partially imported activities
    await this.aqiService.ActivityDelete(mergedActivities, deleteErrors);

    //delete the partially imported visits
    await this.aqiService.VisitDelete(mergedVisits, deleteErrors);

    const finalErrorLogs = [...validationErrors, ...deleteErrors];

    // set an error message for a successfull rollback
    const file_error_log_data = {
      file_submission_id: file_submission_id,
      file_name: fileName,
      original_file_name: originalFileName,
      file_operation_code: file_operation_code,
      ministry_contact: [...ministryContacts],
      error_log: finalErrorLogs,
      create_utc_timestamp: new Date(),
    };

    await this.prisma.file_error_logs.create({
      data: file_error_log_data,
    });

    if (deleteErrors.length > 0) {
      this.logger.warn(`Errors encountered during rollback deletion process.`);
      await this.fileSubmissionsService.updateFileStatus(
        file_submission_id,
        "ROLLBACK ERR",
      );
    } else {
      // need to add an else here to set it to REJECTED
      await this.fileSubmissionsService.updateFileStatus(
        file_submission_id,
        "REJECTED",
      );
    }

    await this.notificationsService.notifyUserOfError(file_submission_id);

    fs.unlink(filePath, (err) => {
      if (err) {
        this.logger.error(`Error cleaning up tempObsFiles`, err);
      } else {
        this.logger.log(`Successfully cleaned up tempObsFiles.`);
      }
    });
  }

  async benchmarkImport(
    file_submission_id,
    fileName,
    originalFileName,
    endValidation,
    endObsValidation,
    endImportNonObs,
    endImportObs,
    startValidation,
    startObsValidation,
    startImportNonObs,
    startImportObs,
  ) {
    // all times in ms, divide by 1000 to make them in s
    const validationTime = (endValidation - startValidation) / 1000;
    const obsValidationTime = (endObsValidation - startObsValidation) / 1000;
    const importTime = (endImportNonObs - startImportNonObs) / 1000;
    const obsImportTime = (endImportObs - startImportObs) / 1000;
    const totalTime = Math.round(
      validationTime + obsValidationTime + importTime + obsImportTime,
    );

    const fileInfo = await this.prisma.file_submission.findFirst({
      select: {
        sample_count: true,
        results_count: true,
        submission_date: true,
        submission_status_code: true,
      },
      where: {
        submission_id: file_submission_id,
      },
    });

    await this.prisma.importer_benchmark.create({
      data: {
        submission_id: file_submission_id,
        file_name: fileName,
        original_file_name: originalFileName,
        submission_date: fileInfo.submission_date,
        submission_status_code: fileInfo.submission_status_code,
        sample_count: fileInfo.sample_count,
        results_count: fileInfo.results_count,
        local_validation_time: validationTime,
        obs_validation_time: obsValidationTime,
        local_import_time: importTime,
        obs_import_time: obsImportTime,
        total_time: totalTime,
      },
    });
  }

  async checkDelimiterErrors(file) {
    let delimiterErrors = [];
    const txtFile = readline.createInterface({
      input: file,
      crlfDelay: Infinity,
    });

    for await (const line of txtFile) {
      const trimmed = line.trim();

      // skip empty line
      if (!trimmed) continue;

      if (trimmed.includes(";")) {
        let errorLog = `{"rowNum": 1, "type": "ERROR", "message": {"File": "File is semicolon-delimited. File must be comma-delimited"}}`;
        delimiterErrors.push(JSON.parse(errorLog));
      } else if (trimmed.includes("\t")) {
        let errorLog = `{"rowNum": 1, "type": "ERROR", "message": {"File": "File is tab-delimited. File must be comma-delimited"}}`;
        delimiterErrors.push(JSON.parse(errorLog));
      } else if (trimmed.includes(" ") && !trimmed.includes(",")) {
        let errorLog = `{"rowNum": 1, "type": "ERROR", "message": {"File": "File is space-delimited. File must be comma-delimited"}}`;
        delimiterErrors.push(JSON.parse(errorLog));
      } else if (!trimmed.includes(",")) {
        let errorLog = `{"rowNum": 1, "type": "ERROR", "message": {"File": "File is not comma-delimited"}}`;
        delimiterErrors.push(JSON.parse(errorLog));
      }
    }

    return delimiterErrors;
  }

  async parseFile(
    file: Readable,
    fileName: string,
    originalFileName: string,
    file_submission_id: string,
    file_operation_code: string,
  ) {
    partialUpload = false;
    rollBackHalted = false;
    validationApisCalled = [];
    fieldVisitStartTimes = {};
    let startValidation = 0,
      endValidation = 0,
      startObsValidation = 0,
      endObsValidation = 0,
      startRejectFile = 0,
      endRejectFile = 0,
      startReportValidated = 0,
      endReportValidated = 0,
      startImportNonObs = 0,
      endImportNonObs = 0,
      startImportObs = 0,
      endImportObs = 0;

    console.time("parseFile");
    const startParseFile = performance.now();

    const path = require("path");
    const extention = path.extname(fileName);

    await this.fileSubmissionsService.updateFileStatus(
      file_submission_id,
      "INPROGRESS",
    );

    const imported_guids_data = {
      file_name: fileName,
      original_file_name: originalFileName,
      imported_guids: {
        visits: [],
        activities: [],
        specimens: [],
        observations: [],
      },
      create_utc_timestamp: new Date(),
    };

    await this.prisma.$transaction(async (prisma) => {
      await prisma.aqi_imported_data.create({
        data: imported_guids_data,
      });
    });

    const ministryContacts = new Set();

    const baseFileName = path.basename(fileName, path.extname(fileName));
    const filePath = path.join(
      "./src/tempObsFiles/",
      `obs-${baseFileName}.csv`,
    );

    const writeStream = fs.createWriteStream(`${filePath}`);

    const headers = Object.keys(obsFile);
    const csvStream = format({ headers: true, quoteColumns: true });
    csvStream.pipe(writeStream);
    csvStream.write(headers);

    if (extention == ".xlsx") {
      const BATCH_SIZE = parseInt(process.env.FILE_BATCH_SIZE);
      let batch: any[] = [];
      let batchNumber = 1;

      // set up the observation csv file for the AQI APIs
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.read(file);
      const worksheet = workbook.getWorksheet(1);

      if (worksheet === undefined) {
        this.logger.error("No worksheet found in the Excel file.");
        let errorLog = `{"rowNum": "N/A", "type": "ERROR", "message": {"File": "Incorrect file content. Please check the file and try again."}}`;

        const file_error_log_data = {
          file_submission_id: file_submission_id,
          file_name: fileName,
          original_file_name: originalFileName,
          file_operation_code: file_operation_code,
          ministry_contact: null,
          error_log: [JSON.parse(errorLog)],
          create_utc_timestamp: new Date(),
        };

        await this.prisma.file_error_logs.create({
          data: file_error_log_data,
        });

        await this.fileSubmissionsService.updateFileStatus(
          file_submission_id,
          "REJECTED",
        );
        await this.benchmarkImport(
          file_submission_id,
          fileName,
          originalFileName,
          endValidation,
          endObsValidation,
          endImportNonObs,
          endImportObs,
          startValidation,
          startObsValidation,
          startImportNonObs,
          startImportObs,
        );

        fs.unlink(filePath, (err) => {
          if (err) {
            this.logger.error(`Error cleaning up tempObsFiles`, err);
          } else {
            this.logger.log(`Successfully cleaned up tempObsFiles.`);
          }
        });

        await this.notificationsService.notifyUserOfError(file_submission_id);

        return;
      }

      const rowHeaders = (worksheet?.getRow(1).values as string[])
        .slice(1) // Remove the first empty cell
        .map((key) => key.replace(/\s+/g, "")); // Remove all whitespace from headers

      const allNonObsErrors: any[] = [];
      const allExistingRecords: any[] = [];

      // do a validation on the headers
      const headerErrors = await this.checkHeaders(
        worksheet?.getRow(1).values as string[],
        "xlsx",
      );

      if (headerErrors.length > 0) {
        // there is an error in the headers. Report to the user and reject the file
        const file_error_log_data = {
          file_submission_id: file_submission_id,
          file_name: fileName,
          original_file_name: originalFileName,
          file_operation_code: file_operation_code,
          ministry_contact: null,
          error_log: headerErrors,
          create_utc_timestamp: new Date(),
        };

        await this.prisma.file_error_logs.create({
          data: file_error_log_data,
        });

        await this.fileSubmissionsService.updateFileStatus(
          file_submission_id,
          "REJECTED",
        );
        await this.benchmarkImport(
          file_submission_id,
          fileName,
          originalFileName,
          endValidation,
          endObsValidation,
          endImportNonObs,
          endImportObs,
          startValidation,
          startObsValidation,
          startImportNonObs,
          startImportObs,
        );

        fs.unlink(filePath, (err) => {
          if (err) {
            this.logger.error(`Error cleaning up tempObsFiles`, err);
          } else {
            this.logger.log(`Successfully cleaned up tempObsFiles.`);
          }
        });

        await this.notificationsService.notifyUserOfError(file_submission_id);

        return;
      }

      console.time("Validation");
      startValidation = performance.now();
      for (let rowNumber = 2; rowNumber <= worksheet?.rowCount; rowNumber++) {
        const row = worksheet?.getRow(rowNumber);

        if (rowNumber === 1) {
          return; // Skip header row
        }

        this.logger.log(`Added ${rowNumber} to batch ${batchNumber}`);
        batch.push(row);

        if (batch.length === BATCH_SIZE) {
          this.logger.log(`Created batch ${batchNumber}`);
          this.logger.log(
            `Starting to process batch ${batchNumber} ******************`,
          );

          for (const [index, row] of batch.entries()) {
            let actualRowNumber =
              index + batchNumber * BATCH_SIZE + 1 - BATCH_SIZE;
            await this.cleanAndValidate(
              row,
              rowHeaders,
              actualRowNumber + 1,
              ministryContacts,
              csvStream,
              allNonObsErrors,
              allExistingRecords,
              fileName,
              extention,
            );
          }
          this.logger.log(
            `Finished processing batch ${batchNumber} ******************`,
          );

          batchNumber++;
          batch = [];
        }
      }

      if (batch.length > 0) {
        this.logger.log(
          `Starting to process (final) batch ${batchNumber} ******************`,
        );

        for (const [index, row] of batch.entries()) {
          let actualRowNumber =
            index + batchNumber * BATCH_SIZE + 1 - BATCH_SIZE;
          await this.cleanAndValidate(
            row,
            rowHeaders,
            actualRowNumber + 1,
            ministryContacts,
            csvStream,
            allNonObsErrors,
            allExistingRecords,
            fileName,
            extention,
          );
        }
        this.logger.log(
          `Finished processing (final) batch ${batchNumber} ******************`,
        );
      }

      console.timeEnd("Validation");
      endValidation = performance.now();

      csvStream.end();
      console.time("obsValidation");
      startObsValidation = performance.now();
      const contactsAndValidationResults = await this.finalValidationStep(
        ministryContacts,
        filePath,
        file_submission_id,
        file_operation_code,
        allNonObsErrors,
      );
      console.timeEnd("obsValidation");
      endObsValidation = performance.now();

      const hasError = contactsAndValidationResults[1].some(
        (item) => item.type === "ERROR",
      );
      const hasWarn = contactsAndValidationResults[1].some(
        (item) => item.type === "WARN",
      );

      if (hasError) {
        /*
         * If there are any errors then
         * Set the file status to 'REJECTED'
         * Save the error logs to the database table
         * Send the an email to the submitter and the ministry contact that is inside the file
         */
        console.time("RejectFile");
        startRejectFile = performance.now();
        await this.rejectFileAndLogErrors(
          file_submission_id,
          fileName,
          originalFileName,
          file_operation_code,
          contactsAndValidationResults[0], // ministry contacts
          contactsAndValidationResults[1], // validation results
        );

        fs.unlink(filePath, (err) => {
          if (err) {
            this.logger.error(`Error cleaning up tempObsFiles`, err);
          } else {
            this.logger.log(`Successfully cleaned up tempObsFiles.`);
          }
        });

        console.timeEnd("RejectFile");

        await this.notificationsService.notifyUserOfError(file_submission_id);
        endRejectFile = performance.now();
        await this.benchmarkImport(
          file_submission_id,
          fileName,
          originalFileName,
          endValidation,
          endObsValidation,
          endImportNonObs,
          endImportObs,
          startValidation,
          startObsValidation,
          startImportNonObs,
          startImportObs,
        );

        return;
      } else {
        /*
         * If there are no errors then
         * i.e. the file may have WARNINGS - if records already exist
         */
        // If there are no errors or warnings
        console.time("ReportValidated");
        startReportValidated = performance.now();
        if (file_operation_code === "VALIDATE") {
          const file_error_log_data = {
            file_submission_id: file_submission_id,
            file_name: fileName,
            original_file_name: originalFileName,
            file_operation_code: file_operation_code,
            ministry_contact: contactsAndValidationResults[0],
            error_log: contactsAndValidationResults[1],
            create_utc_timestamp: new Date(),
          };

          await this.fileSubmissionsService.updateFileStatus(
            file_submission_id,
            "VALIDATED",
          );

          await this.prisma.file_error_logs.create({
            data: file_error_log_data,
          });

          fs.unlink(filePath, (err) => {
            if (err) {
              this.logger.error(`Error cleaning up tempObsFiles`, err);
            } else {
              this.logger.log(`Successfully cleaned up tempObsFiles.`);
            }
          });
          console.timeEnd("ReportValidated");

          await this.notificationsService.notifyUserOfError(file_submission_id);
          endReportValidated = performance.now();
          await this.benchmarkImport(
            file_submission_id,
            fileName,
            originalFileName,
            endValidation,
            endObsValidation,
            endImportNonObs,
            endImportObs,
            startValidation,
            startObsValidation,
            startImportNonObs,
            startImportObs,
          );

          return;
        } else {
          const BATCH_SIZE = parseInt(process.env.FILE_BATCH_SIZE);
          let batch: any[] = [];
          let batchNumber = 1;

          console.time("ImportNonObs");
          startImportNonObs = performance.now();
          this.logger.log(`Starting the import process`);
          for (
            let rowNumber = 2;
            rowNumber <= worksheet?.rowCount;
            rowNumber++
          ) {
            const row = worksheet?.getRow(rowNumber);

            if (rowNumber === 1) {
              return; // Skip header row
            }

            this.logger.log(`Added ${rowNumber} to batch ${batchNumber}`);
            batch.push(row);
            this.logger.log(`Beginning processing row: ${rowNumber}`);

            if (batch.length === BATCH_SIZE) {
              this.logger.log(`Created batch ${batchNumber}`);
              this.logger.log(
                `Starting to process batch ${batchNumber} ******************`,
              );

              for (const [index, row] of batch.entries()) {
                let actualRowNumber =
                  index + batchNumber * BATCH_SIZE + 1 - BATCH_SIZE;

                let GuidsToSave = {
                  visits: [],
                  activities: [],
                  specimens: [],
                  observations: [],
                };
                await this.importRow(
                  row,
                  rowHeaders,
                  actualRowNumber,
                  fileName,
                  GuidsToSave,
                  extention,
                  file_submission_id,
                  originalFileName,
                  file_operation_code,
                  ministryContacts,
                  contactsAndValidationResults[1],
                  filePath,
                );

                // if a partial upload then stop processing the batch and return
                if (partialUpload) {
                  this.logger.warn(
                    `Partial upload detected, stopped processing the batch`,
                  );
                  break;
                }
              }

              // leave the for loop for row iteration
              if (partialUpload) {
                break;
              }

              this.logger.log(
                `Finished processing batch ${batchNumber} ******************`,
              );

              batchNumber++;
              batch = [];
            }
          }
          if (!partialUpload && batch.length > 0) {
            this.logger.log(
              `Starting to process (final) batch ${batchNumber} ******************`,
            );

            for (const [index, row] of batch.entries()) {
              let actualRowNumber =
                index + batchNumber * BATCH_SIZE + 1 - BATCH_SIZE;
              let GuidsToSave = {
                visits: [],
                activities: [],
                specimens: [],
                observations: [],
              };
              await this.importRow(
                row,
                rowHeaders,
                actualRowNumber,
                fileName,
                GuidsToSave,
                extention,
                file_submission_id,
                originalFileName,
                file_operation_code,
                ministryContacts,
                contactsAndValidationResults[1],
                filePath,
              );
              // if a partial upload then stop processing the batch and do the rollback
              if (partialUpload) {
                this.logger.warn(
                  `Partial upload detected, stopped processing the batch`,
                );
                break;
              }
            }

            this.logger.log(
              `Finished processing (final) batch ${batchNumber} ******************`,
            );
          }
          console.timeEnd("ImportNonObs");
          endImportNonObs = performance.now();

          if (partialUpload) {
            if (!rollBackHalted) {
              await this.fileSubmissionsService.updateFileStatus(
                file_submission_id,
                "REJECTED",
              );
            }

            await this.notificationsService.notifyUserOfError(
              file_submission_id,
            );

            return;
          }

          console.time("ImportObs");
          startImportObs = performance.now();
          this.logger.log(`Starting import of observations`);
          await this.insertObservations(
            fileName,
            originalFileName,
            filePath,
            file_submission_id,
            file_operation_code,
            contactsAndValidationResults[0],
            contactsAndValidationResults[1],
          );
          this.logger.log(`Completed import for observations`);
          console.timeEnd("ImportObs");
          endImportObs = performance.now();
        }
      }
    } else if (extention == ".csv" || extention == ".txt") {
      const allNonObsErrors: any[] = [];
      const allExistingRecords: any[] = [];
      const headersForValidation: string[] = [];
      const headers: string[] = [];
      let delimiterErrors = [];

      if (extention == ".txt") {
        delimiterErrors = await this.checkDelimiterErrors(file);
      }

      if (delimiterErrors.length > 0) {
        // there is an error in the file delimiter. Report to the user and reject the file
        const file_error_log_data = {
          file_submission_id: file_submission_id,
          file_name: fileName,
          original_file_name: originalFileName,
          file_operation_code: file_operation_code,
          ministry_contact: null,
          error_log: delimiterErrors,
          create_utc_timestamp: new Date(),
        };

        await this.prisma.file_error_logs.create({
          data: file_error_log_data,
        });

        await this.fileSubmissionsService.updateFileStatus(
          file_submission_id,
          "REJECTED",
        );
        await this.benchmarkImport(
          file_submission_id,
          fileName,
          originalFileName,
          endValidation,
          endObsValidation,
          endImportNonObs,
          endImportObs,
          startValidation,
          startObsValidation,
          startImportNonObs,
          startImportObs,
        );

        return;
      }

      let isFirstRow = true;
      file
        .pipe(
          parse({
            columns: false,
            trim: true,
          }),
        )
        .on("data", (row: string[]) => {
          if (isFirstRow) {
            isFirstRow = false;

            headers.push(...row.map((key) => key.replace(/\s+/g, "")));
            headersForValidation.push(...row);
          }
        })
        .on("end", () => {
          this.logger.log("Got the file headers");
        })
        .on("error", (err) => {
          this.logger.error(
            "Error while parsing file for headers:",
            err.message,
          );
        });

      await new Promise((f) => setTimeout(f, 1000));

      // do a validation on the headers
      const headerErrors = await this.checkHeaders(headersForValidation, "csv");

      if (headerErrors.length > 0) {
        // there is an error in the headers. Report to the user and reject the file
        const file_error_log_data = {
          file_submission_id: file_submission_id,
          file_name: fileName,
          original_file_name: originalFileName,
          file_operation_code: file_operation_code,
          ministry_contact: null,
          error_log: headerErrors,
          create_utc_timestamp: new Date(),
        };

        await this.prisma.file_error_logs.create({
          data: file_error_log_data,
        });

        await this.fileSubmissionsService.updateFileStatus(
          file_submission_id,
          "REJECTED",
        );
        await this.benchmarkImport(
          file_submission_id,
          fileName,
          originalFileName,
          endValidation,
          endObsValidation,
          endImportNonObs,
          endImportObs,
          startValidation,
          startObsValidation,
          startImportNonObs,
          startImportObs,
        );

        fs.unlink(filePath, (err) => {
          if (err) {
            this.logger.error(`Error cleaning up tempObsFiles`, err);
          } else {
            this.logger.log(`Successfully cleaned up tempObsFiles.`);
          }
        });

        await this.notificationsService.notifyUserOfError(file_submission_id);

        return;
      }

      // re-fetch the file from the temp directory for validation
      const fileStreamPath = path.join("./src/tempObsFiles/", fileName);
      const rowValidationStream = fs.createReadStream(fileStreamPath);

      const parser = parse({
        columns: headers,
        trim: true,
      });
      rowValidationStream.pipe(parser);

      const startTime = Date.now();

      // Set up the error and end handlers *before* piping
      rowValidationStream.on("error", async (err) => {
        const duration = Date.now() - startTime;
        this.logger.error(`Stream error after ${duration}ms:`, err.message);
        this.logger.error(`Name: ${err.name}`);
        this.logger.error(`Stack: ${err.stack}`);

        this.logger.error(`full error: ${err}`);
        await this.fileSubmissionsService.updateFileStatus(
          file_submission_id,
          "ERROR",
        );
        await this.notificationsService.notifyUserOfError(file_submission_id);
        return;
      });

      parser.on("error", (err) => {
        this.logger.error("Parser error:", err.message);
      });

      parser.on("end", () => {
        this.logger.log("Finished parsing file.");
      });

      console.time("Validation");
      startValidation = performance.now();
      // Pipe immediately after setting up handlers

      const BATCH_SIZE = parseInt(process.env.FILE_BATCH_SIZE);
      let batch: any[] = [];
      let rowNumber = 0;
      let batchNumber = 1;

      for await (const row of parser) {
        rowNumber++;

        if (rowNumber === 1) {
          continue;
        }

        this.logger.log(`Added ${rowNumber} to batch ${batchNumber}`);
        batch.push(row);

        if (batch.length === BATCH_SIZE) {
          this.logger.log(`Created batch ${batchNumber}`);
          this.logger.log(
            `Starting to process batch ${batchNumber} ******************`,
          );

          for (const [index, row] of batch.entries()) {
            let actualRowNumber =
              index + batchNumber * BATCH_SIZE + 1 - BATCH_SIZE;
            await this.cleanAndValidate(
              row,
              headers,
              actualRowNumber + 1,
              ministryContacts,
              csvStream,
              allNonObsErrors,
              allExistingRecords,
              fileName,
              extention,
            );
          }
          this.logger.log(
            `Finished processing batch ${batchNumber} ******************`,
          );

          batchNumber++;
          batch = [];
        }
      }

      if (batch.length > 0) {
        this.logger.log(
          `Starting to process (final) batch ${batchNumber} ******************`,
        );

        for (const [index, row] of batch.entries()) {
          let actualRowNumber =
            index + batchNumber * BATCH_SIZE + 1 - BATCH_SIZE;
          await this.cleanAndValidate(
            row,
            headers,
            actualRowNumber + 1,
            ministryContacts,
            csvStream,
            allNonObsErrors,
            allExistingRecords,
            fileName,
            extention,
          );
        }
        this.logger.log(
          `Finished processing (final) batch ${batchNumber} ******************`,
        );
      }

      this.logger.log(`✅ All done. Processed ${rowNumber} rows.`);

      console.timeEnd("Validation");
      endValidation = performance.now();

      csvStream.end();
      console.time("obsValidation");
      startObsValidation = performance.now();
      const contactsAndValidationResults = await this.finalValidationStep(
        ministryContacts,
        filePath,
        file_submission_id,
        file_operation_code,
        allNonObsErrors,
      );
      console.timeEnd("obsValidation");
      endObsValidation = performance.now();

      const hasError = contactsAndValidationResults[1].some(
        (item) => item.type === "ERROR",
      );
      const hasWarn = contactsAndValidationResults[1].some(
        (item) => item.type === "WARN",
      );

      if (hasError) {
        /*
         * If there are any errors then
         * Set the file status to 'REJECTED'
         * Save the error logs to the database table
         * Send the an email to the submitter and the ministry contact that is inside the file
         */
        console.time("RejectFile");
        startRejectFile = performance.now();
        await this.rejectFileAndLogErrors(
          file_submission_id,
          fileName,
          originalFileName,
          file_operation_code,
          contactsAndValidationResults[0],
          contactsAndValidationResults[1],
        );

        fs.unlink(filePath, (err) => {
          if (err) {
            this.logger.error(`Error cleaning up tempObsFiles`, err);
          } else {
            this.logger.log(`Successfully cleaned up tempObsFiles.`);
          }
        });
        console.timeEnd("RejectFile");
        await this.notificationsService.notifyUserOfError(file_submission_id);
        endRejectFile = performance.now();
        await this.benchmarkImport(
          file_submission_id,
          fileName,
          originalFileName,
          endValidation,
          endObsValidation,
          endImportNonObs,
          endImportObs,
          startValidation,
          startObsValidation,
          startImportNonObs,
          startImportObs,
        );

        return;
      } else {
        /*
         * If there are no errors then
         * i.e. the file may have WARNINGS - if records already exist
         */
        // If there are no errors or warnings
        console.time("ReportValidated");
        startReportValidated = performance.now();

        if (file_operation_code === "VALIDATE") {
          const file_error_log_data = {
            file_submission_id: file_submission_id,
            file_name: fileName,
            original_file_name: originalFileName,
            file_operation_code: file_operation_code,
            ministry_contact: contactsAndValidationResults[0],
            error_log: contactsAndValidationResults[1],
            create_utc_timestamp: new Date(),
          };

          await this.fileSubmissionsService.updateFileStatus(
            file_submission_id,
            "VALIDATED",
          );

          await this.prisma.file_error_logs.create({
            data: file_error_log_data,
          });

          fs.unlink(filePath, (err) => {
            if (err) {
              this.logger.error(`Error cleaning up tempObsFiles`, err);
            } else {
              this.logger.log(`Successfully cleaned up tempObsFiles.`);
            }
          });
          console.timeEnd("ReportValidated");
          endReportValidated = performance.now();
          await this.benchmarkImport(
            file_submission_id,
            fileName,
            originalFileName,
            endValidation,
            endObsValidation,
            endImportNonObs,
            endImportObs,
            startValidation,
            startObsValidation,
            startImportNonObs,
            startImportObs,
          );

          await this.notificationsService.notifyUserOfError(file_submission_id);

          return;
        } else {
          /*
           * If the local validation passed then split the file into 4 and process with the AQI API calls
           * Get unique records to prevent redundant API calls
           * Post the unique records to the API
           * Expand the returned list of object - this will be used for finding unique activities
           */

          // re-fetch the file for import purposes - cannot use previously fetched stream
          console.time("ImportNonObs");
          startImportNonObs = performance.now();
          this.logger.log(`Starting the import process`);
          const fileStreamPath = path.join("./src/tempObsFiles/", fileName);
          const rowImportStream = fs.createReadStream(fileStreamPath);

          const parser = parse({
            columns: headers,
            trim: true,
          });

          const startTime = Date.now();

          // Set up the error and end handlers *before* piping
          rowImportStream.on("error", async (err) => {
            const duration = Date.now() - startTime;
            this.logger.error(`Stream error after ${duration}ms:`, err.message);
            this.logger.error(`Name: ${err.name}`);
            this.logger.error(`Stack: ${err.stack}`);

            this.logger.error(`full error: ${err}`);
            await this.fileSubmissionsService.updateFileStatus(
              file_submission_id,
              "ERROR",
            );
            await this.notificationsService.notifyUserOfError(
              file_submission_id,
            );
            return;
          });

          parser.on("error", (err) => {
            this.logger.error("Parser error:", err.message);
          });

          parser.on("end", () => {
            this.logger.log("Finished parsing file.");
          });

          // Pipe + iterate
          rowImportStream.pipe(parser);

          const BATCH_SIZE = parseInt(process.env.FILE_BATCH_SIZE);
          let batch: any[] = [];
          let rowNumber = 0;
          let batchNumber = 1;

          for await (const row of parser) {
            rowNumber++;

            if (rowNumber === 1) {
              continue;
            }

            this.logger.log(`Added ${rowNumber} to batch ${batchNumber}`);
            batch.push(row);

            if (batch.length === BATCH_SIZE) {
              this.logger.log(`Created batch ${batchNumber}`);
              this.logger.log(
                `Starting to process batch ${batchNumber} ******************`,
              );

              for (const [index, row] of batch.entries()) {
                let actualRowNumber =
                  index + batchNumber * BATCH_SIZE + 1 - BATCH_SIZE;

                let GuidsToSave = {
                  visits: [],
                  activities: [],
                  specimens: [],
                  observations: [],
                };

                await this.importRow(
                  row,
                  headers,
                  actualRowNumber,
                  fileName,
                  GuidsToSave,
                  extention,
                  file_submission_id,
                  originalFileName,
                  file_operation_code,
                  contactsAndValidationResults[0],
                  contactsAndValidationResults[1],
                  filePath,
                );

                // if a partial upload then stop processing the batch
                if (partialUpload) {
                  this.logger.warn(
                    `Partial upload detected, stopped processing the batch`,
                  );

                  break;
                }
              }

              // leave the for loop for row iteration
              if (partialUpload) {
                this.logger.warn("Partial upload, breaking out of loop");
                break;
              }

              this.logger.log(
                `Finished processing batch ${batchNumber} ******************`,
              );

              batchNumber++;
              batch = [];
            }
          }

          if (!partialUpload && batch.length > 0) {
            this.logger.log(
              `Starting to process (final) batch ${batchNumber} ******************`,
            );

            for (const [index, row] of batch.entries()) {
              let actualRowNumber =
                index + batchNumber * BATCH_SIZE + 1 - BATCH_SIZE;
              let GuidsToSave = {
                visits: [],
                activities: [],
                specimens: [],
                observations: [],
              };

              await this.importRow(
                row,
                headers,
                actualRowNumber,
                fileName,
                GuidsToSave,
                extention,
                file_submission_id,
                originalFileName,
                file_operation_code,
                ministryContacts,
                contactsAndValidationResults[1],
                filePath,
              );
              // if a partial upload then stop processing the batch
              if (partialUpload) {
                this.logger.warn(
                  `Partial upload detected, stopped processing the batch`,
                );
                break;
              }
            }

            this.logger.log(
              `Finished processing (final) batch ${batchNumber} ******************`,
            );
          }
          console.timeEnd("ImportNonObs");
          endImportNonObs = performance.now();

          if (partialUpload) {
            if (!rollBackHalted) {
              await this.fileSubmissionsService.updateFileStatus(
                file_submission_id,
                "REJECTED",
              );
            }
            this.logger.log("Partial upload detected, leaving import process");
            await this.notificationsService.notifyUserOfError(
              file_submission_id,
            );
            return;
          }

          this.logger.log(`Starting import of observations`);

          console.time("ImportObs");
          startImportObs = performance.now();
          await this.insertObservations(
            fileName,
            originalFileName,
            filePath,
            file_submission_id,
            file_operation_code,
            contactsAndValidationResults[0],
            contactsAndValidationResults[1],
          );
          this.logger.log(`Completed import of observations`);

          console.timeEnd("ImportObs");
          endImportObs = performance.now();
        }
      }
    }

    console.timeEnd("parseFile");
    await this.benchmarkImport(
      file_submission_id,
      fileName,
      originalFileName,
      endValidation,
      endObsValidation,
      endImportNonObs,
      endImportObs,
      startValidation,
      startObsValidation,
      startImportNonObs,
      startImportObs,
    );
    partialUpload = false;
    rollBackHalted = false;
  }
}
