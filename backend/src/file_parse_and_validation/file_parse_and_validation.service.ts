import { Injectable, Logger } from "@nestjs/common";
import { AxiosInstance } from "axios";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";
import {
  FieldActivities,
  FieldSpecimens,
  FieldVisits,
  ObservationFile,
  Observations,
} from "src/types/types";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import ExcelJS from "exceljs";
import fs from "fs";
import { PrismaService } from "nestjs-prisma";
import { PassThrough, Readable } from "stream";
import csv from "csv-parser";
import fastcsv from "fast-csv";
import csvParser from "csv-parser";

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
  FieldFilterComment: "",
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
  FieldComment: "",
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
  "Source Of Rounded Value": "",
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
  "EA_Upload File Name": "",
};

@Injectable()
export class FileParseValidateService {
  private readonly logger = new Logger(FileParseValidateService.name);
  private axiosInstance: AxiosInstance;

  constructor(
    private prisma: PrismaService,
    private readonly fileSubmissionsService: FileSubmissionsService,
    private readonly aqiService: AqiApiService,
  ) {}

  async getQueuedFiles() {
    return this.fileSubmissionsService.findByCode("QUEUED");
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
        return {
          samplingLocation: {
            id: locID[0].aqi_locations_id,
            custom_id: param,
          },
        };
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
      // case "DEPTH_UNIT":
      //   if (
      //     param[0] == "m" ||
      //     param[0] == "Metre" ||
      //     param[0] == "metre" ||
      //     param[0] == "Meter" ||
      //     param[0] == "meter"
      //   ) {
      //     param[0] = "metre";
      //   }

      //   if (param[0] == "ft" || param[0] == "Feet" || param[0] == "feet") {
      //     param[0] = "feet";
      //   }

      //   let duID = await this.prisma.aqi_units.findMany({
      //     where: {
      //       custom_id: {
      //         equals: param[0],
      //       },
      //     },
      //     select: {
      //       aqi_units_id: true,
      //     },
      //   });
      //   return {
      //     depth: {
      //       value: param[1],
      //       unit: { id: duID[0].aqi_units_id, customId: param[0] },
      //     },
      //   };
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

  async fieldVisitJson(visitData: any, apiType: string) {
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
        fieldVisit: await this.aqiService.fieldVisits(postData),
      });
    } else if (apiType == "put") {
      const GUIDtoUpdate = visitData.id;
      await this.aqiService.putFieldVisits(GUIDtoUpdate, postData);
      Object.assign(currentVisitAndLoc, {
        fieldVisit: GUIDtoUpdate,
      });
    }
    return currentVisitAndLoc;
  }

  async fieldActivityJson(activityData: any, apiType: string) {
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
          id: await this.aqiService.fieldActivities(postData),
          customId: activityData.ActivityName,
          startTime: activityData.ObservedDateTime,
        },
      });
    } else if (apiType === "put") {
      const GUIDtoUpdate = activityData.id;
      await this.aqiService.putFieldActivities(GUIDtoUpdate, postData);
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

  async specimensJson(specimenData: any, apiType: string) {
    let postData: any = {};
    const extendedAttribs = { extendedAttributes: [] };

    let EAWorkOrderNumberCustomID = "Work Order Number";
    let EATissueType = "Specimen Tissue Type";
    let EALabArrivalTemp = "Specimen Lab Arrival Temperature (°C)";
    let mediumCustomID = specimenData.Medium;
    let FieldFiltered = specimenData.FieldFiltered;
    let FieldFilterComment = specimenData.FieldFilterComment;
    let analyzingAgencyCustomID = specimenData.AnalyzingAgency;

    Object.assign(
      postData,
      await this.queryCodeTables("MEDIUM", mediumCustomID),
    );
    Object.assign(
      postData,
      await this.queryCodeTables("LABS", analyzingAgencyCustomID),
    );

    // get the EA custom id (EA Work Order Number, FieldFiltered, FieldFilterComment, FieldPreservative, EALabReportID, SpecimenName) and find the GUID
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

    if (FieldFiltered == "TRUE") {
      Object.assign(postData, { filtered: "true" });
      Object.assign(postData, { filtrationComment: FieldFilterComment });
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
          id: await this.aqiService.fieldSpecimens(postData),
          customId: specimenData.SpecimenName,
          startTime: specimenData.ObservedDateTime,
        },
      });
    } else if (apiType === "put") {
      const GUIDtoUpdate = specimenData.id;
      await this.aqiService.putSpecimens(GUIDtoUpdate, postData);
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
    const obsToWrite: ObservationFile[] = [];

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
        const newAnalysisMethod = `"${lookupResult.method_id};${lookupResult.method_name};${lookupResult.method_context}"`;
        newObs["Lab: Analysis Method"] = newAnalysisMethod;
      }
    }

    const resultUnitLookup = newObs["Result Unit"];
    if (resultUnitLookup) {
      const resultLookUpResult = await this.prisma.aqi_units_xref.findFirst({
        where: {
          edt_unit_xref: {
            equals: resultUnitLookup,
          },
        },
        select: {
          aqi_units_code: true,
        },
      });

      if (resultLookUpResult) {
        const newResultUnit = resultLookUpResult;
        newObs["Result Unit"] = newResultUnit.aqi_units_code;
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
        } else if (
          row["DataClassification"] == "LAB" ||
          row["DataClassification"] == "FIELD_RESULT"
        ) {
          if (row["QCType"] == "") {
            Object.assign(filteredObj, { ActivityType: "SAMPLE_ROUTINE" });
          } else {
            Object.assign(filteredObj, { ActivityType: `${row["QCType"]}` });
          }
        } else if (row["DataClassification"] == "SURROGATE_RESULT") {
          if (row["QCType"] == "") {
            Object.assign(filteredObj, { ActivityType: "SPIKE" });
          }
        }
      } else {
        Object.assign(filteredObj, customAttributes);
      }
    }

    return filteredObj;
  }

  getUniqueWithCounts(data: any[]) {
    const seen = new Map();
    const duplicateDetails = [];

    data.forEach((obj, index) => {
      const item = JSON.stringify(obj);

      if (seen.has(item)) {
        const existingEntry = seen.get(item);
        existingEntry.positions.push(index);
        existingEntry.count++;
      } else {
        seen.set(item, { rec: obj, count: 1, positions: [index] });
      }
    });

    seen.forEach((value) => {
      if (value.count >= 1) {
        duplicateDetails.push(value);
      }
    });

    return duplicateDetails;
  }

  expandList(data: any[]) {
    const expandedList: any[] = [];

    data.forEach(({ rec, positions }) => {
      positions.forEach((position) => {
        expandedList[position] = rec;
      });
    });

    return expandedList;
  }

  async localValidation(rowNumber: number, rowData: any): Promise<any[]> {
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
    ];

    const unitFields = "ResultUnit";

    // check all datetimes
    dateTimeFields.forEach((field) => {
      if (rowData.hasOwnProperty(field) && rowData[field]) {
        const valid = isoDateTimeRegex.test(rowData[field]);
        if (!valid) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"${field}": "${rowData[field]} is not valid ISO DateTime"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      } else if (rowData.hasOwnProperty(field) && !rowData[field]) {
        if (field == "FieldVisitStartTime" || field == "ObservedDateTime") {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"${field}": "Cannot be empty"}}`;
          errorLogs.push(JSON.parse(errorLog));
        } else if (
          field == "AnalyzedDateTime" &&
          (rowData["DataClassification"] == "LAB" ||
            rowData["DataClassification"] == "SURROGATE_RESULT")
        ) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"${field}": "Cannot be empty for data classification ${rowData["DataClassification"]}"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    });

    // check all numerical fields
    numericalFields.forEach((field) => {
      if (rowData.hasOwnProperty(field)) {
        const valid =
          numberRegex.test(rowData[field]) &&
          !isNaN(parseFloat(rowData[field]));
        if (rowData[field] !== "" && !valid) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"${field}": "${rowData[field]} is not valid number"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    });

    // check all unit fields
    if (rowData.hasOwnProperty(unitFields)) {
      if (rowData[unitFields]) {
        const present = await this.aqiService.databaseLookup(
          "aqi_units_xref",
          rowData[unitFields],
        );

        if (!present) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"${unitFields}": "${rowData[unitFields]} not found in EnMoDS Units"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    } else if (rowData.hasOwnProperty(unitFields)) {
      let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"${unitFields}": Cannot be empty"}}`;
      errorLogs.push(JSON.parse(errorLog));
    }

    if (rowData.hasOwnProperty("Depth Unit")) {
      if (rowData["Depth Upper"]) {
        if (rowData["Depth Unit"] != "metre") {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Depth_Unit": "${rowData["Depth Unit"]} is not valid unit for Depth. Only 'Metre' is allowed"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    }

    if (rowData.hasOwnProperty("SamplingAgency")) {
      if (rowData["SamplingAgency"] == "") {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Sampling Agency": "Cannot be empty"}}`;
        errorLogs.push(JSON.parse(errorLog));
      } else {
        const present = await this.aqiService.databaseLookup(
          "aqi_sampling_agency",
          rowData.SamplingAgency,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Sampling Agency": "${rowData.SamplingAgency} not found in EnMoDS Sampling Agency"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    }

    if (rowData.hasOwnProperty("Project")) {
      const present = await this.aqiService.databaseLookup(
        "aqi_projects",
        rowData.Project,
      );
      if (!present) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Project": "${rowData.Project} not found in EnMoDS Projects"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    if (rowData.hasOwnProperty("LocationID")) {
      if (rowData["LocationID"] == "") {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Location_ID": "Cannot be empty"}}`;
        errorLogs.push(JSON.parse(errorLog));
      } else {
        const present = await this.aqiService.databaseLookup(
          "aqi_locations",
          rowData.LocationID,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Location_ID": "${rowData.LocationID} not found in EnMoDS Locations"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    }

    if (rowData.hasOwnProperty("Preservative")) {
      const present = await this.aqiService.databaseLookup(
        "aqi_preservatives",
        rowData.Preservative,
      );
      if (!present) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Preservative": "${rowData.Preservative} not found in EnMoDS Preservatives"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    if (rowData.hasOwnProperty("FieldDeviceType")) {
      if (
        (rowData["DataClassification"] == "FIELD_RESULT" ||
          rowData["DataClassification"] == "ACTIVITY_RESULT" ||
          rowData["DataClassification"] == "FIELD_SURVEY" ||
          rowData["DataClassification"] == "VERTICAL_PROFILE") &&
        rowData["FieldDeviceType"] == ""
      ) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Field Device Type": "Cannot be empty when data classification is ${rowData["DataClassification"]}"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    if (rowData.hasOwnProperty("SamplingConextTag")) {
      const present = await this.aqiService.databaseLookup(
        "aqi_context_tags",
        rowData.SamplingConextTag,
      );
      if (!present) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Sampling_Context_Tag": "${rowData.SamplingConextTag} not found in EnMoDS Sampling Context Tags"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    if (rowData.hasOwnProperty("CollectionMethod")) {
      if (
        (rowData["DataClassification"] == "LAB" ||
          rowData["DataClassification"] == "SURROGATE_RESULT") &&
        rowData["CollectionMethod"] == ""
      ) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"CollectionMethod": "Cannot be empty when Data Classification is ${rowData["DataClassification"]}"}}`;
        errorLogs.push(JSON.parse(errorLog));
      } else {
        if (rowData["CollectionMethod"] != "") {
          const present = await this.aqiService.databaseLookup(
            "aqi_collection_methods",
            rowData.CollectionMethod,
          );
          if (!present) {
            let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"CollectionMethod": "${rowData.CollectionMethod} not found in EnMoDS Collection Methods"}}`;
            errorLogs.push(JSON.parse(errorLog));
          }
        }
      }
    }

    if (rowData.hasOwnProperty("Medium")) {
      if (rowData["Medium"] == "") {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Medium": "Cannot be empty"}}`;
        errorLogs.push(JSON.parse(errorLog));
      } else {
        const present = await this.aqiService.databaseLookup(
          "aqi_mediums",
          rowData.Medium,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Medium": "${rowData.Medium} not found in EnMoDS Mediums"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    }

    if (rowData.hasOwnProperty("ObservedPropertyID")) {
      if (rowData["ObservedPropertyID"] == "") {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Observed_Property_ID": "Cannot be empty"}}`;
        errorLogs.push(JSON.parse(errorLog));
      } else {
        const present = await this.aqiService.databaseLookup(
          "aqi_observed_properties",
          rowData.ObservedPropertyID,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Observed_Property_ID": "${rowData.ObservedPropertyID} not found in EnMoDS Observed Properties"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    }

    if (
      rowData.hasOwnProperty("DetectionCondition") &&
      rowData.DetectionCondition
    ) {
      const present = await this.aqiService.databaseLookup(
        "aqi_detection_conditions",
        rowData.DetectionCondition.toUpperCase().replace(/ /g, "_"),
      );
      if (!present) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Detection_Condition": "${rowData.DetectionCondition} not found in EnMoDS Detection Conditions"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    if (rowData.hasOwnProperty("Fraction") && rowData.Fraction) {
      const present = await this.aqiService.databaseLookup(
        "aqi_sample_fractions",
        rowData.Fraction.toUpperCase(),
      );
      if (!present) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Fraction": "${rowData.Fraction} not found in EnMoDS Fractions"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    if (rowData.hasOwnProperty("DataClassification")) {
      if (rowData["DataClassification"] == "") {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Data Classification": "Cannot be empty"}}`;
        errorLogs.push(JSON.parse(errorLog));
      } else {
        const present = await this.aqiService.databaseLookup(
          "aqi_data_classifications",
          rowData.DataClassification,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Data Classification": "${rowData.DataClassification} not found in EnMoDS Data Classesifications"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (
        rowData["CompositeStat"] != "" &&
        rowData["DataClassification"] != "LAB"
      ) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Data Classification": "Must be LAB when Composite Stat is porvided."}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    if (rowData.hasOwnProperty("AnalyzingAgency")) {
      if (
        (rowData["DataClassification"] == "LAB" ||
          rowData["DataClassification"] == "SURROGATE_RESULT") &&
        rowData["AnalyzingAgency"] == ""
      ) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Analyzing Agency": "Cannot be empty when Data Classification is ${rowData["DataClassification"]}"}}`;
        errorLogs.push(JSON.parse(errorLog));
      } else {
        const present = await this.aqiService.databaseLookup(
          "aqi_laboratories",
          rowData.AnalyzingAgency,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Analyzing_Agency": "${rowData.AnalyzingAgency} not found in EnMoDS Agencies"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    }

    if (rowData.hasOwnProperty("ResultStatus")) {
      const present = await this.aqiService.databaseLookup(
        "aqi_result_status",
        rowData.ResultStatus,
      );
      if (!present) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Result_Status": "${rowData.ResultStatus} not found in EnMoDS Result Statuses"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    if (rowData.hasOwnProperty("ResultGrade")) {
      const present = await this.aqiService.databaseLookup(
        "aqi_result_grade",
        rowData.ResultGrade,
      );
      if (!present) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Result_Grade": "${rowData.ResultGrade} not found in EnMoDS Result Grades"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    if (rowData.hasOwnProperty("TissueType")) {
      if (rowData["Medium"] == "Animal - Fish" && rowData["TissueType"] == "") {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"TissueType": "Cannot be empty when Medium is Animal - Fish"}}`;
        errorLogs.push(JSON.parse(errorLog));
      } else if (rowData["TissueType"]) {
        const present = await this.aqiService.databaseLookup(
          "aqi_tissue_types",
          rowData.TissueType,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"TissueType": "${rowData.TissueType} not found in EnMoDS Tissue Types"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }
    }

    if (rowData.hasOwnProperty("SpecimenName")) {
      if (rowData["CompositeStat"] != "" && rowData["SpecimenName"] == "") {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Specimen Name": "Cannot be empty when Composite Stat is present."}}`;
        errorLogs.push(JSON.parse(errorLog));
      } else if (
        rowData["Medium"] == "Animal - Fish" &&
        rowData["SpecimenName"] == ""
      ) {
        let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Specimen Name": "Cannot be empty when Medium is Animal - Fish"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    // check if the visit already exists -- check if visit timetsamp for that location already exists

    const visitExists = await this.aqiService.AQILookup("aqi_field_visits", [
      rowData.LocationID,
      rowData.FieldVisitStartTime,
    ]);
    if (visitExists !== null && visitExists !== undefined) {
      existingGUIDS["visit"] = visitExists;
      let errorLog = `{"rowNum": ${rowNumber}, "type": "WARN", "message": {"Visit": "Visit for Location ${rowData.LocationID} at Start Time ${rowData.FieldVisitStartTime} already exists in EnMoDS Field Visits"}}`;
      errorLogs.push(JSON.parse(errorLog));
    }

    // check if the activity already exits -- check if the activity name for that given visit and location already exists
    const activityExists = await this.aqiService.AQILookup(
      "aqi_field_activities",
      [rowData.ActivityName, rowData.ObservedDateTime, rowData.LocationID],
    );
    if (activityExists !== null && activityExists !== undefined) {
      existingGUIDS["activity"] = activityExists;
      let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Activity": "Activity Name ${rowData.ActivityName} for Field Visit at Start Time ${rowData.FieldVisitStartTime} already exists in EnMoDS Activities"}}`;
      errorLogs.push(JSON.parse(errorLog));
    }

    // check if the specimen already exists -- check if the specimen name for that given visit and location already exists
    const specimenExists = await this.aqiService.AQILookup("aqi_specimens", [
      rowData.SpecimenName,
      rowData.ObservedDateTime,
      rowData.ActivityName,
      rowData.LocationID,
    ]);
    if (specimenExists !== null && specimenExists !== undefined) {
      existingGUIDS["specimen"] = specimenExists;
      let errorLog = `{"rowNum": ${rowNumber}, "type": "ERROR", "message": {"Specimen": "Specimen Name ${rowData.SpecimenName} for that Acitivity at Start Time ${rowData.ObservedDateTime} already exists in EnMoDS Specimen"}}`;
      errorLogs.push(JSON.parse(errorLog));
    }

    if (Object.keys(existingGUIDS).length > 0) {
      existingRecords.push({ rowNum: rowNumber, existingGUIDS: existingGUIDS });
    }

    return new Promise((resolve) => {
      setTimeout(() => resolve([errorLogs, existingRecords]), 5000);
    });
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

    fs.createReadStream(observationFilePath)
      .pipe(csv())
      .on("headers", (headers) => {
        // First check: if the number of columns is correct
        if (headers.length !== Object.keys(obsFile).length) {
          let errorLog = `{"rowNum": "N/A", "type": "ERROR", "message": {"ObservationFile": "Invalid number of columns. Expected 40, got ${headers.length}"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }

        // Second-Third check:
        if (
          !Object.keys(obsFile).every(
            (header, rowNumber) => header === headers[rowNumber],
          )
        ) {
          let errorLog = `{"rowNum": "N/A", "type": "ERROR", "message": {"ObservationFile": "Headers do not match expected names or order. You can find the expected format here: https://bcenv-enmods-test.aqsamples.ca/import"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      });

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

  async parseFile(
    file: Readable,
    fileName: string,
    originalFileName: string,
    file_submission_id: string,
    file_operation_code: string,
  ) {
    const path = require("path");
    const extention = path.extname(fileName);
    if (extention == ".xlsx") {
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.read(file);
      const worksheet = workbook.getWorksheet(1);

      const headers = (worksheet.getRow(1).values as string[])
        .slice(1) // Remove the first empty cell
        .map((key) => key.replace(/\s+/g, "")); // Remove all whitespace from headers

      // set up the observation csv file for the AQI APIs
      const baseFileName = path.basename(fileName, path.extname(fileName));
      const filePath = path.join(
        "./src/tempObsFiles/",
        `obs-${baseFileName}.csv`,
      );
      const writeStream = fs.createWriteStream(`${filePath}`);
      const allNonObsErrors: any[] = [];
      const allExistingRecords: any[] = [];

      writeStream.write(Object.keys(obsFile).join(",") + "\n");

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
      let isFirstRow = true;

      worksheet.eachRow(async (row, rowNumber) => {
        if (rowNumber === 1) {
          return; // Skip header row
        }

        // Get the row values, remove the first empty cell, and map to headers
        const rowData: Record<string, string> = headers
          .map((header, colNumber) => {
            const cellValue = row.getCell(colNumber + 1).value; // using getCell to access value with a 1-based index pattern
            return {
              [header]: String(cellValue ?? ""),
            };
          })
          .reduce((acc, curr) => ({ ...acc, ...curr }), {});

        const fieldVisitCustomAttributes: Partial<FieldVisits> = {
          PlanningStatus: "DONE",
        };

        /*
         * From the input file get all the atrributes and values for each sub section - Visits, Activities, Specimens and Observations
         */
        const fieldVisit = this.filterFile<FieldVisits>(
          rowData,
          Object.keys(visits),
          fieldVisitCustomAttributes,
        );

        ministryContacts.add(fieldVisit.MinistryContact); // getting the ministry contacts (this will result in a unique list at the end of all rows)

        if (
          rowData.DataClassification == "VERTICAL_PROFILE" ||
          rowData.DataClassification == "FIELD_RESULT"
        ) {
          rowData.SpecimenName = "";
          rowData.ActivityName = "";
        }

        const observation = this.filterFile<Observations>(
          rowData,
          Object.keys(observations),
          null,
        );

        const obsRecord = await this.formulateObservationFile(
          observation,
          originalFileName,
        );

        if (isFirstRow) {
          writeStream.write(Object.values(obsRecord).join(","));
          isFirstRow = false;
        } else {
          writeStream.write("\n" + Object.values(obsRecord).join(","));
        }

        /*
         * Do the local validation for each section here - if passed then go to the API calls - else create the message/file/email for the errors
         */

        const recordLocalValidationResults = await this.localValidation(
          rowNumber,
          rowData,
        );

        allNonObsErrors.push(...recordLocalValidationResults[0]);
        allExistingRecords.push(...recordLocalValidationResults[1]);
      });

      await new Promise((f) => setTimeout(f, 5000));

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

      const hasError = fileValidationResults.some(
        (item) => item.type === "ERROR",
      );
      const hasWarn = fileValidationResults.some(
        (item) => item.type === "WARN",
      );

      if (hasError) {
        /*
         * If there are any errors then
         * Set the file status to 'REJECTED'
         * Save the error logs to the database table
         * Send the an email to the submitter and the ministry contact that is inside the file
         */
        await this.rejectFileAndLogErrors(
          file_submission_id,
          fileName,
          originalFileName,
          file_operation_code,
          uniqueMinistryContacts,
          fileValidationResults,
        );
        return;
      } else {
        /*
         * If there are no errors then
         * i.e. the file may have WARNINGS - if records already exist
         */
        // If there are no errors or warnings
        await this.fileSubmissionsService.updateFileStatus(
          file_submission_id,
          "VALIDATED",
        );

        if (file_operation_code === "VALIDATE") {
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

          return;
        } else {
          /*
           * If the local validation passed then split the file into 4 and process with the AQI API calls
           * Get unique records to prevent redundant API calls
           * Post the unique records to the API
           * Expand the returned list of object - this will be used for finding unique activities
           */
          for (
            let rowNumber = 2;
            rowNumber <= worksheet.rowCount;
            rowNumber++
          ) {
            const row = worksheet.getRow(rowNumber);
            let GuidsToSave = {
              visits: [],
              activities: [],
              specimens: [],
              observations: [],
            };
            // Get the row values, remove the first empty cell, and map to headers
            const rowData: Record<string, string> = headers
              .map((header, colNumber) => {
                const cellValue = row.getCell(colNumber + 1).value; // using getCell to access value with a 1-based index pattern
                return {
                  [header]: String(cellValue ?? ""),
                };
              })
              .reduce((acc, curr) => ({ ...acc, ...curr }), {});

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

            if (
              rowData.DataClassification == "VERTICAL_PROFILE" ||
              rowData.DataClassification == "FIELD_RESULT"
            ) {
              specimen.SpecimenName = "";
              fieldActivity.ActivityName == "";
            }

            /*
             * for each of the components (visits, activities, specimens):
             * make a DB call to see if that record already exists
             * If exists - do a PUT with the respective object to the respective API
             * Otherwise - do a POST with the respective object to the respective API; save the record into the db table (for future use) and save the GUID to the db table
             */

            let visitExists = await this.aqiService.AQILookup(
              "aqi_field_visits",
              [rowData.LocationID, rowData.FieldVisitStartTime],
            );
            let visitInfo: any;

            if (visitExists !== null && visitExists !== undefined) {
              // send PUT to AQI and add visit data to activity
              fieldVisit["id"] = visitExists;
              await this.fieldVisitJson(fieldVisit, "put");
              fieldActivity["fieldVisit"] = visitExists;
              fieldActivity["LocationID"] = rowData.LocationID;
              GuidsToSave["visits"].push(visitExists);
            } else {
              // send POST to AQI and add visit data to activity
              visitInfo = await this.fieldVisitJson(fieldVisit, "post");

              // insert the visit record in the db table
              try {
                await this.prisma.$transaction(async (prisma) => {
                  await prisma.aqi_field_visits.create({
                    data: {
                      aqi_field_visits_id: visitInfo.fieldVisit,
                      aqi_field_visit_start_time: visitInfo.startTime,
                      aqi_location_custom_id:
                        visitInfo.samplingLocation.custom_id,
                    },
                  });
                });
                this.logger.log("Visit record inserted in db successfully.");
                fieldActivity["fieldVisit"] = visitInfo.fieldVisit;
                fieldActivity["LocationID"] = rowData.LocationID;
                GuidsToSave["visits"].push(visitInfo.fieldVisit);
              } catch (err) {
                this.logger.error(
                  `Error inserting visit record in db: ${err.message}`,
                );
              }
            }

            if (rowData.DataClassification !== "FIELD_RESULT") {
              let activityExists = await this.aqiService.AQILookup(
                "aqi_field_activities",
                [
                  rowData.ActivityName,
                  rowData.ObservedDateTime,
                  rowData.LocationID,
                ],
              );
              let activityInfo: any;

              if (activityExists !== null && activityExists !== undefined) {
                // send PUT to AQI
                fieldActivity["id"] = activityExists;
                await this.fieldActivityJson(fieldActivity, "put");
                specimen["activity"] = {
                  id: activityExists,
                  customId: rowData.ActivityName,
                  startTime: rowData.ObservedDateTime,
                };
                GuidsToSave["activities"].push(activityExists);
              } else {
                // send POST to AQI
                activityInfo = await this.fieldActivityJson(
                  fieldActivity,
                  "post",
                );

                // insert the activity record in the db table
                try {
                  await this.prisma.$transaction(async (prisma) => {
                    await prisma.aqi_field_activities.create({
                      data: {
                        aqi_field_activities_id: activityInfo.activity.id,
                        aqi_field_activities_start_time:
                          activityInfo.activity.startTime,
                        aqi_field_activities_custom_id:
                          activityInfo.activity.customId,
                        aqi_location_custom_id: rowData.LocationID,
                        aqi_field_visit_start_time:
                          activityInfo.activity.startTime,
                        create_user_id: "VMANAWAT", //TODO: need to update this to the user who submitted the file
                        create_utc_timestamp: new Date(),
                        update_user_id: "VMANAWAT", // TODO: need to update this to the user who submitted the file
                        update_utc_timestamp: new Date(),
                      },
                    });
                  });

                  this.logger.log(
                    "Activity record inserted in db successfully.",
                  );
                  specimen["activity"] = activityInfo.activity;
                  GuidsToSave["activities"].push(activityInfo.activity.id);
                } catch (err) {
                  this.logger.error(
                    `Error inserting activity record in db: ${err.message}`,
                  );
                }
              }
            }

            if (
              rowData.DataClassification !== "VERTICAL_PROFILE" &&
              rowData.DataClassification !== "FIELD_RESULT"
            ) {
              let specimenExists = await this.aqiService.AQILookup(
                "aqi_specimens",
                [
                  rowData.SpecimenName,
                  rowData.ObservedDateTime,
                  rowData.ActivityName,
                  rowData.LocationID,
                ],
              );
              let specimenInfo: any;

              if (specimenExists !== null && specimenExists !== undefined) {
                // send PUT to AQI
                specimen["id"] = specimenExists;
                await this.specimensJson(specimen, "put");
                GuidsToSave["specimens"].push(specimenExists);
              } else {
                // send POST to AQI
                specimenInfo = await this.specimensJson(specimen, "post");

                // insert the specimen record in the db table
                try {
                  await this.prisma.$transaction(async (prisma) => {
                    await this.prisma.aqi_specimens.create({
                      data: {
                        aqi_specimens_id: specimenInfo.specimen.id,
                        aqi_specimens_custom_id: specimenInfo.specimen.customId,
                        aqi_field_activities_start_time:
                          specimenInfo.specimen.startTime,
                        aqi_field_activities_custom_id: rowData.ActivityName,
                        aqi_location_custom_id: rowData.LocationID,
                      },
                    });
                  });
                  this.logger.log(
                    "Specimen record inserted in db successfully.",
                  );
                  GuidsToSave["specimens"].push(specimenInfo.specimen.id);
                } catch (err) {
                  this.logger.error(
                    `Error inserting specimen record in db: ${err.message}`,
                  );
                }
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
              observations:
                guidsToUpdate[0].aqi_imported_data_id["observations"] || [],
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
          }

          // Import Observations file after all the visits, activities and specimens have been inserted

          await this.aqiService.importObservations(
            filePath,
            "import",
            file_submission_id,
            file_operation_code,
          );

          await this.fileSubmissionsService.updateFileStatus(
            file_submission_id,
            "SUBMITTED",
          );

          // Save the created observation GUIDs to aqi_imported
          const observationGUIDS =
            await this.aqiService.getObservationsFromFile(originalFileName);

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
                sample_count:
                  guidsToUpdate[0].imported_guids["activities"].length,
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

          return;
        }
      }
    } else if (extention == ".csv") {
      const headers: string[] = [];
      let rowNumber = 1;

      // Create a pass-through stream to reuse the same input stream
      const headerPassThrough = new PassThrough();
      const rowValidationPassThrough = new PassThrough();
      const rowImportPassThrough = new PassThrough();

      file.pipe(headerPassThrough);
      file.pipe(rowValidationPassThrough);
      file.pipe(rowImportPassThrough);

      headerPassThrough.pipe(csv()).on("headers", (csvHeaders) => {
        headers.push(...csvHeaders.map((key) => key.replace(/\s+/g, "")));
      });

      await new Promise((f) => setTimeout(f, 1000));

      // set up the observation csv file for the AQI APIs
      const baseFileName = path.basename(fileName, path.extname(fileName));
      const filePath = path.join(
        "./src/tempObsFiles/",
        `obs-${baseFileName}.csv`,
      );
      const writeStream = fs.createWriteStream(`${filePath}`);
      const allNonObsErrors: any[] = [];
      const allExistingRecords: any[] = [];

      writeStream.write(Object.keys(obsFile).join(",") + "\n");

      // await this.fileSubmissionsService.updateFileStatus(
      //   file_submission_id,
      //   "INPROGRESS",
      // );

      // const imported_guids_data = {
      //   file_name: fileName,
      //   original_file_name: originalFileName,
      //   imported_guids: {
      //     visits: [],
      //     activities: [],
      //     specimens: [],
      //     observations: [],
      //   },
      //   create_utc_timestamp: new Date(),
      // };

      // await this.prisma.$transaction(async (prisma) => {
      //   await prisma.aqi_imported_data.create({
      //     data: imported_guids_data,
      //   });
      // });

      const ministryContacts = new Set();
      let isFirstRow = true;
      console.log(headers);

      rowValidationPassThrough
        .pipe(csvParser({ headers: true }))
        .on("data", row => {
          try {
            rowNumber++;
            console.log(rowNumber);
          } catch (err) {
            console.error(`Error on row ${rowNumber}:`, err.message);
          }
        })
        .on("end", () => {
          console.log(`Processing completed.`);
        })
        .on("error", (error) => {
          console.error(`Error Processing:`, error);
        });

      await new Promise((f) => setTimeout(f, 2000));
    }
  }
}
