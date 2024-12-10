import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";
import {
  FieldActivities,
  FieldSpecimens,
  FieldVisits,
  ObservationFile,
  Observations,
} from "src/types/types";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import * as XLSX from "xlsx";
import * as path from "path";
import * as csvWriter from "csv-writer";
import fs from "fs";
import csv from "csv-parser";
import { PrismaService } from "nestjs-prisma";

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
  ActivityType: "SAMPLE_ROUTINE",
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
    const visitAndLocId = [];
    for (const row of visitData) {
      let postData: any = {};
      const extendedAttribs = { extendedAttributes: [] };

      let locationCustomID = row.rec.LocationID;
      let projectCustomID = row.rec.Project;
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

      if (row.rec.MinistryContact != "") {
        extendedAttribs["extendedAttributes"].push(
          await this.queryCodeTables("EXTENDED_ATTRIB", [
            EAMinistryContact,
            row.rec.MinistryContact,
          ]),
        );
      }

      if (row.rec.SamplingAgency != "") {
        extendedAttribs["extendedAttributes"].push(
          await this.queryCodeTables("EXTENDED_ATTRIB", [
            EASamplingAgency,
            row.rec.SamplingAgency,
          ]),
        );
      }

      Object.assign(postData, extendedAttribs);
      Object.assign(postData, { startTime: row.rec.FieldVisitStartTime });
      Object.assign(postData, { endTime: row.rec.FieldVisitEndTime });
      Object.assign(postData, { participants: row.rec.FieldVisitParticipants });
      Object.assign(postData, { notes: row.rec.FieldVisitComments });
      Object.assign(postData, { planningStatus: row.rec.PlanningStatus });

      let currentVisitAndLoc: any = {};
      Object.assign(currentVisitAndLoc, {
        samplingLocation: postData.samplingLocation,
      });

      if (apiType === "post") {
        Object.assign(currentVisitAndLoc, {
          fieldVisit: await this.aqiService.fieldVisits(postData),
        });
        visitAndLocId.push({
          rec: currentVisitAndLoc,
          count: row.count,
          positions: row.positions,
        });
      } else if (apiType === "put") {
        const GUIDtoUpdate = row.rec.id;
        await this.aqiService.putFieldVisits(GUIDtoUpdate, postData);
        Object.assign(currentVisitAndLoc, {
          fieldVisit: GUIDtoUpdate,
        });
        visitAndLocId.push({
          rec: currentVisitAndLoc,
          count: row.count,
          positions: row.positions,
        });
      }
    }

    return visitAndLocId;
  }

  async fieldActivityJson(activityData: any, apiType: string) {
    let activityId = [];

    for (const row of activityData) {
      let postData: any = {};
      const extendedAttribs = { extendedAttributes: [] };
      const sampleContextTags = { samplingContextTags: [] };

      let collectionMethodCustomID = row.rec.CollectionMethod;
      let mediumCustomID = row.rec.Medium;
      let depthUnitCustomID =
        row.rec.DepthUnit == ""
          ? null
          : row.rec.DepthUnit == "m" || row.rec.DepthUnit == "Metre"
            ? "Metre"
            : row.rec.DepthUnit == "ft" || row.rec.DepthUnit == "Feet"
              ? "Feet"
              : row.rec.DepthUnit;
      let depthUnitValue = row.rec.DepthUpper;
      let sampleContextTagCustomIds =
        row.rec.SamplingContextTag == "" ? null : row.rec.SamplingContextTag;

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

      // // get the depth unit custom id from object and find depth unit GUID
      // if (depthUnitCustomID != null || depthUnitValue != "") {
      //   Object.assign(
      //     postData,
      //     await this.queryCodeTables("DEPTH_UNIT", [
      //       depthUnitCustomID,
      //       depthUnitValue,
      //     ]),
      //   );
      // }

      if (sampleContextTagCustomIds != null) {
        let tagsToLookup = sampleContextTagCustomIds.split(", ");
        sampleContextTags["samplingContextTags"] = await this.queryCodeTables(
          "TAGS",
          tagsToLookup,
        );
      }

      // get the EA custom id (Depth Lower and Depth Upper) and find the GUID
      if (row.rec.DepthLower != "") {
        extendedAttribs["extendedAttributes"].push(
          await this.queryCodeTables("EXTENDED_ATTRIB", [
            "Depth Lower",
            row.rec.DepthLower,
          ]),
        );
      }

      Object.assign(postData, { type: row.rec.ActivityType });
      Object.assign(postData, extendedAttribs);
      Object.assign(postData, sampleContextTags);
      Object.assign(postData, { startTime: row.rec.ObservedDateTime });
      Object.assign(postData, { endTime: row.rec.ObservedDateTimeEnd });
      Object.assign(postData, {
        samplingLocation: row.rec.samplingLocation,
      });
      Object.assign(postData, {
        fieldVisit: { id: row.rec.fieldVisit },
      });
      Object.assign(postData, { customId: row.rec.ActivityName });

      let currentActivity: any = {};

      if (apiType === "post") {
        Object.assign(currentActivity, {
          activity: {
            id: await this.aqiService.fieldActivities(postData),
            customId: row.rec.ActivityName,
            startTime: row.rec.ObservedDateTime,
          },
        });
        activityId.push({
          rec: currentActivity,
          count: row.count,
          positions: row.positions,
        });
      } else {
        const GUIDtoUpdate = row.rec.id;
        await this.aqiService.putFieldActivities(GUIDtoUpdate, postData);
        Object.assign(currentActivity, {
          activity: {
            id: GUIDtoUpdate,
            customId: row.rec.ActivityName,
            startTime: row.rec.ObservedDateTime,
          },
        });
        activityId.push({
          rec: currentActivity,
          count: row.count,
          positions: row.positions,
        });
      }
    }
    return activityId;
  }

  async specimensJson(specimenData: any, apiType: string) {
    let specimenIds = [];
    for (const row of specimenData) {
      let postData = {};
      const extendedAttribs = { extendedAttributes: [] };

      let EAWorkOrderNumberCustomID = "Work Order Number";
      let EATissueType = "Specimen Tissue Type";
      let EALabArrivalTemp = "Specimen Lab Arrival Temperature (°C)";
      let mediumCustomID = row.rec.Medium;
      let FieldFiltered = row.rec.FieldFiltered;
      let FieldFilterComment = row.rec.FieldFilterComment;
      let analyzingAgencyCustomID = row.rec.AnalyzingAgency;

      Object.assign(
        postData,
        await this.queryCodeTables("MEDIUM", mediumCustomID),
      );
      Object.assign(
        postData,
        await this.queryCodeTables("LABS", analyzingAgencyCustomID),
      );

      // get the EA custom id (EA Work Order Number, FieldFiltered, FieldFilterComment, FieldPreservative, EALabReportID, SpecimenName) and find the GUID
      if (row.rec.WorkOrderNumber != "") {
        extendedAttribs["extendedAttributes"].push(
          await this.queryCodeTables("EXTENDED_ATTRIB", [
            EAWorkOrderNumberCustomID,
            row.rec.WorkOrderNumber,
          ]),
        );
      }
      if (row.rec.TissueType != "") {
        extendedAttribs["extendedAttributes"].push(
          await this.queryCodeTables("EXTENDED_ATTRIB", [
            EATissueType,
            row.rec.TissueType,
          ]),
        );
      }
      if (row.rec.LabArrivalTemperature != "") {
        extendedAttribs["extendedAttributes"].push(
          await this.queryCodeTables("EXTENDED_ATTRIB", [
            EALabArrivalTemp,
            row.rec.LabArrivalTemperature,
          ]),
        );
      }

      if (FieldFiltered == "TRUE") {
        Object.assign(postData, { filtered: "true" });
        Object.assign(postData, { filtrationComment: FieldFilterComment });
      } else {
        Object.assign(postData, { filtered: "false" });
      }

      if (row.rec.FieldPreservative != "") {
        Object.assign(postData, { preservative: row.rec.FieldPreservative });
      }

      Object.assign(postData, { name: row.rec.SpecimenName });
      Object.assign(postData, { activity: row.rec.activity });
      Object.assign(postData, extendedAttribs);

      let currentSpecimen: any = {};

      if (apiType === "post") {
        Object.assign(currentSpecimen, {
          specimen: {
            id: await this.aqiService.fieldSpecimens(postData),
            customId: row.rec.SpecimenName,
            startTime: row.rec.ObservedDateTime,
          },
        });
        specimenIds.push({
          rec: currentSpecimen,
          count: row.count,
          positions: row.positions,
        });
      } else if (apiType === "put") {
        const GUIDtoUpdate = row.rec.id;
        await this.aqiService.putSpecimens(GUIDtoUpdate, postData);
        Object.assign(currentSpecimen, {
          specimen: {
            id: GUIDtoUpdate,
            customId: row.rec.SpecimenName,
            startTime: row.rec.ObservedDateTime,
          },
        });
        specimenIds.push({
          rec: currentSpecimen,
          count: row.count,
          positions: row.positions,
        });
      }
    }
    return specimenIds;
  }

  async formulateObservationFile(
    observationData: any,
    fileName: string,
    originalFileName: string,
  ) {
    const obsToWrite: ObservationFile[] = [];

    for (const source of observationData) {
      const sourceKeys = Object.keys(source);
      const targetKeys = Object.keys(obsFile);

      const newObs = {} as ObservationFile;

      for (let i = 0; i < sourceKeys.length; i++) {
        const sourceKey = sourceKeys[i];
        const targetKey = targetKeys[i];

        if (targetKey !== undefined) {
          newObs[targetKey] = source[sourceKey];
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
          const newAnalysisMethod = `${lookupResult.method_id};${lookupResult.method_name};${lookupResult.method_context}`;
          newObs["Lab: Analysis Method"] = newAnalysisMethod
            .replace(/^"|"$/g, "")
            .replace(/"/g, "");
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
      obsToWrite.push(newObs);
    }

    const baseFileName = path.basename(fileName, path.extname(fileName));
    const filePath = path.join("src/tempObsFiles/", `obs-${baseFileName}.csv`);
    const headers = Object.keys(obsToWrite[0]).map((key) => ({
      id: key,
      title: key,
    }));

    const writer = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: headers,
      alwaysQuote: false,
    });

    await writer.writeRecords(obsToWrite);
    return filePath;
  }

  filterFile<T>(data: any[], keys, customAttributes): Partial<T>[] {
    return data.map((row) => {
      const filteredObj: Partial<T> = {};
      keys.forEach((key) => {
        if (row.hasOwnProperty(key)) {
          filteredObj[key] = `${row[key]}`;
        }
      });

      if (customAttributes) {
        Object.assign(filteredObj, customAttributes);
      }

      return filteredObj;
    });
  }

  getUniqueWithCounts(data: any[]) {
    // const map = new Map<
    //   string,
    //   { rec: any; count: number; positions: number[] }
    // >();

    // data.forEach((obj, index) => {
    //   const key = JSON.stringify(obj);
    //   if (map.has(key)) {
    //     const entry = map.get(key)!;
    //     entry.count++;
    //     entry.positions.push(index);
    //   } else {
    //     map.set(key, { rec: obj, count: 1, positions: [index] });
    //   }
    // });
    // const dupeCount = Array.from(map.values());
    // return dupeCount;
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

  async localValidation(
    allRecords,
    observaionFilePath,
    fileSubmissionId,
    fileOperationCode,
  ) {
    let errorLogs = [];
    let existingRecords = [];
    for (const [index, record] of allRecords.entries()) {
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

      const unitFields = ["ResultUnit"];

      // check all datetimes
      dateTimeFields.forEach((field) => {
        if (record.hasOwnProperty(field) && record[field]) {
          const valid = isoDateTimeRegex.test(record[field]);
          if (!valid) {
            let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"${field}": "${record[field]} is not valid ISO DateTime"}}`;
            errorLogs.push(JSON.parse(errorLog));
          } else if (record.hasOwnProperty(field) && !record[field]) {
            let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"${field}": "Cannot be empty"}}`;
            errorLogs.push(JSON.parse(errorLog));
          }
        } else if (record.hasOwnProperty(field) && !record[field]) {
          if (
            field == "FieldVisitStartTime" ||
            field == "ObservedDateTime" ||
            field == "AnalyzedDateTime"
          ) {
            let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"${field}": "Cannot be empty"}}`;
            errorLogs.push(JSON.parse(errorLog));
          }
        }
      });

      // check all numerical fields
      numericalFields.forEach((field) => {
        if (record.hasOwnProperty(field)) {
          const valid =
            numberRegex.test(record[field]) &&
            !isNaN(parseFloat(record[field]));
          if (record[field] !== "" && !valid) {
            let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"${field}": "${record[field]} is not valid number"}}`;
            errorLogs.push(JSON.parse(errorLog));
          }
        }
      });

      // check all unit fields
      unitFields.forEach(async (field) => {
        if (record.hasOwnProperty(field) && record[field]) {
          const present = await this.aqiService.databaseLookup(
            "aqi_units_xref",
            record[field],
          );
          if (!present) {
            let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"${field}": "${record[field]} not found in AQI Units"}}`;
            errorLogs.push(JSON.parse(errorLog));
          }
        } else if (record.hasOwnProperty(field) && !record[field]) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"${field}": Cannot be empty"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      });

      if (record.hasOwnProperty("Project")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_projects",
          record.Project,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Project": "${record.Project} not found in AQI Projects"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("LocationID")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_locations",
          record.LocationID,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Location_ID": "${record.LocationID} not found in AQI Locations"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("Preservative")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_preservatives",
          record.Preservative,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Preservative": "${record.Preservative} not found in AQI Preservatives"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("SamplingConextTag")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_context_tags",
          record.SamplingConextTag,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Sampling_Context_Tag": "${record.SamplingConextTag} not found in AQI Sampling Context Tags"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("CollectionMethod")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_collection_methods",
          record.CollectionMethod,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Collection_Method": "${record.CollectionMethod} not found in AQI Collection Methods"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("Medium")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_mediums",
          record.Medium,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Medium": "${record.Medium} not found in AQI Mediums"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("ObservedPropertyID")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_observed_properties",
          record.ObservedPropertyID,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Observed_Property_ID": "${record.ObservedPropertyID} not found in AQI Observed Properties"}}`;
          errorLogs.push(JSON.parse(errorLog));
          errorLog += `ERROR: Row ${index + 2} Observed Property ID ${record.ObservedPropertyID} not found in AQI Observed Properties\n`;
        }
      }

      if (
        record.hasOwnProperty("DetectionCondition") &&
        record.DetectionCondition
      ) {
        const present = await this.aqiService.databaseLookup(
          "aqi_detection_conditions",
          record.DetectionCondition.toUpperCase().replace(/ /g, "_"),
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Detection_Condition": "${record.DetectionCondition} not found in AQI Detection Conditions"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("Fraction") && record.Fraction) {
        const present = await this.aqiService.databaseLookup(
          "aqi_sample_fractions",
          record.Fraction.toUpperCase(),
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Fraction": "${record.Fraction} not found in AQI Fractions"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("DataClassification")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_data_classifications",
          record.DataClassification,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Data_Classification": "${record.DataClassification} not found in AQI Data Classesifications"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("AnalyzingAgency")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_laboratories",
          record.AnalyzingAgency,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Analyzing_Agency": "${record.AnalyzingAgency} not found in AQI Agencies"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("ResultStatus")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_result_status",
          record.ResultStatus,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Result_Status": "${record.ResultStatus} not found in AQI Result Statuses"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      if (record.hasOwnProperty("ResultGrade")) {
        const present = await this.aqiService.databaseLookup(
          "aqi_result_grade",
          record.ResultGrade,
        );
        if (!present) {
          let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": {"Result_Grade": "${record.ResultGrade} not found in AQI Result Grades"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      }

      // check if the visit already exists -- check if visit timetsamp for that location already exists

      const visitExists = await this.aqiService.AQILookup("aqi_field_visits", [
        record.LocationID,
        record.FieldVisitStartTime,
      ]);
      if (visitExists !== null && visitExists !== undefined) {
        existingGUIDS["visit"] = visitExists;
        let errorLog = `{"rowNum": ${index + 2}, "type": "WARN", "message": {"Visit": "Visit for Location ${record.LocationID} at Start Time ${record.FieldVisitStartTime} already exists in AQI Field Visits"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }

      // check if the activity already exits -- check if the activity name for that given visit and location already exists
      const activityExists = await this.aqiService.AQILookup(
        "aqi_field_activities",
        [record.ActivityName, record.FieldVisitStartTime, record.LocationID],
      );
      if (activityExists !== null && activityExists !== undefined) {
        existingGUIDS["activity"] = activityExists;
        let errorLog = `{"rowNum": ${index + 2}, "type": "WARN", "message": {"Activity": "Activity Name ${record.ActivityName} for Field Visit at Start Time ${record.FieldVisitStartTime} already exists in AQI Activities"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }

      // check if the specimen already exists -- check if the specimen name for that given visit and location already exists
      const specimenExists = await this.aqiService.AQILookup("aqi_specimens", [
        record.SpecimenName,
        record.ObservedDateTime,
        record.ActivityName,
        record.LocationID,
      ]);
      if (specimenExists !== null && specimenExists !== undefined) {
        existingGUIDS["specimen"] = specimenExists;
        let errorLog = `{"rowNum": ${index + 2}, "type": "WARN", "message": {"Specimen": "Specimen Name ${record.SpecimenName} for that Acitivity at Start Time ${record.ObservedDateTime} already exists in AQI Specimen"}}`;
        errorLogs.push(JSON.parse(errorLog));
      }

      if (Object.keys(existingGUIDS).length > 0) {
        existingRecords.push({ rowNum: index, existingGUIDS: existingGUIDS });
      }
    }

    /*
     * Do an initial validation on the observation file. This will check the file has the right number of columns, the header names are correct and the order of the headers are right
     * Do a dry run of the observations
     */

    fs.createReadStream(observaionFilePath)
      .pipe(csv())
      .on("headers", (headers) => {
        // First check: if the number of columns is correct
        if (headers.length !== Object.keys(obsFile).length + 1) {
          let errorLog = `{"rowNum": "N/A", "type": "ERROR", "message": {"ObservationFile": "Invalid number of columns. Expected 40, got ${headers.length}"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }

        // Second-Third check:
        if (
          !Object.keys(obsFile).every(
            (header, index) => header === headers[index],
          )
        ) {
          let errorLog = `{"rowNum": "N/A", "type": "ERROR", "message": {"ObservationFile": "Headers do not match expected names or order. You can find the expected format here: https://bcenv-enmods-test.aqsamples.ca/import"}}`;
          errorLogs.push(JSON.parse(errorLog));
        }
      });

    const observationsErrors = await this.aqiService.importObservations(
      observaionFilePath,
      "dryrun",
      fileSubmissionId,
      fileOperationCode,
    );

    const finalErrorLog = this.aqiService.mergeErrorMessages(
      errorLogs,
      observationsErrors,
    );

    return [finalErrorLog, existingRecords];
  }

  async rejectFileAndLogErrors(
    file_submission_id: string,
    fileName: string,
    originalFileName: string,
    file_operation_code: string,
    ministryContacts: any[],
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

  async saveAQIInsertedElements(
    file_submission_id: string,
    fileName: string,
    originalFileName: string,
    visitInfo: any[],
    activityInfo: any[],
    specimenInfo: any[],
  ) {
    let importedGUIDS = {};

    const visitGUIDS = visitInfo.map((visit) => visit.rec.fieldVisit);
    const activityGUIDS = activityInfo.map(
      (activity) => activity.rec.activity.id,
    );
    const specimenGUIDS = specimenInfo.map(
      (specimen) => specimen.rec.specimen.id,
    );

    const observationGUIDS =
      await this.aqiService.getObservationsFromFile(originalFileName);

    importedGUIDS["observations"] = observationGUIDS;
    importedGUIDS["specimens"] = specimenGUIDS;
    importedGUIDS["activities"] = activityGUIDS;
    importedGUIDS["visits"] = visitGUIDS;

    const imported_guids_data = {
      file_name: fileName,
      original_file_name: originalFileName,
      imported_guids: importedGUIDS,
      create_utc_timestamp: new Date(),
    };

    await this.prisma.$transaction(async (prisma) => {
      await prisma.aqi_imported_data.create({
        data: imported_guids_data,
      });
    });

    //Update the number of samples and results imported from the file
    await this.prisma.$transaction(async (prisma) => {
      const updateStatus = await this.prisma.file_submission.update({
        where: {
          submission_id: file_submission_id,
        },
        data: {
          sample_count: activityGUIDS.length,
          results_count: observationGUIDS.length,
        },
      });
    });
  }

  async parseFile(
    file: string,
    fileName: string,
    originalFileName: string,
    file_submission_id: string,
    file_operation_code: string,
  ) {
    const path = require("path");
    const extention = path.extname(fileName);
    if (extention == ".xlsx") {
      const workbook = XLSX.read(file, { type: "buffer" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      const headers = (jsonData[0] as string[]).map((key) =>
        key.replace(/\s+/g, ""),
      );

      const allRecords = jsonData.slice(1).map((row) => {
        return headers.reduce(
          (obj, key, index) => {
            obj[key] = String(row[index]);
            return obj;
          },
          {} as Record<string, any>,
        );
      });

      const fieldVisitCustomAttributes: Partial<FieldVisits> = {
        PlanningStatus: "DONE",
      };

      const fieldActivityCustomAttrib: Partial<FieldActivities> = {
        ActivityType: "SAMPLE_ROUTINE",
      };

      /*
       * From the input file get all the atrributes and values for each sub section - Visits, Activities, Specimens and Observations
       */
      const allFieldVisits = this.filterFile<FieldVisits>(
        allRecords,
        Object.keys(visits),
        fieldVisitCustomAttributes,
      );

      let allFieldActivities = this.filterFile<FieldActivities>(
        allRecords,
        Object.keys(activities),
        fieldActivityCustomAttrib,
      );
      let allSpecimens = this.filterFile<FieldSpecimens>(
        allRecords,
        Object.keys(specimens),
        null,
      );

      const allObservations = this.filterFile<Observations>(
        allRecords,
        Object.keys(observations),
        null,
      );

      const ObsFilePath = await this.formulateObservationFile(
        allObservations,
        fileName,
        originalFileName,
      );

      const uniqueMinistryContacts = Array.from(
        new Set(allRecords.map((rec) => rec.MinistryContact)),
      );
      /*
       * Do the local validation for each section here - if passed then go to the API calls - else create the message/file/email for the errors
       */

      await this.fileSubmissionsService.updateFileStatus(
        file_submission_id,
        "INPROGRESS",
      );

      const localValidationResults = await this.localValidation(
        allRecords,
        ObsFilePath,
        file_submission_id,
        file_operation_code,
      );

      if (localValidationResults[0].some((item) => item.type === "ERROR")) {
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
          localValidationResults[0],
        );
        return;
      } else {
        /*
         * If there are no errors then
         * Check to see if there are any WARNINGS
         * If WARNINGS
         * Proceed with the PATCH logic
         */
        if (localValidationResults[0].some((item) => item.type === "WARN")) {
          let visitInfo = [],
            expandedVisitInfo = [];
          let activityInfo = [],
            expandedActivityInfo = [];
          let specimenInfo = [];

          // Get three seprated lists for the existing GUIDS for visits, acticities and specimens
          const {
            existingVisitGUIDS,
            existingActivityGUIDS,
            existingSpecimenGUIDS,
          } = localValidationResults[1].reduce(
            (acc, { existingGUIDS }) => {
              if (existingGUIDS.visit != null) {
                acc.existingVisitGUIDS.push(existingGUIDS.visit);
              }

              if (existingGUIDS.activity != null) {
                acc.existingActivityGUIDS.push(existingGUIDS.activity);
              }

              if (existingGUIDS.specimen != null) {
                acc.existingSpecimenGUIDS.push(existingGUIDS.specimen);
              }
              return acc;
            },
            {
              existingVisitGUIDS: [] as string[],
              existingActivityGUIDS: [] as string[],
              existingSpecimenGUIDS: [] as string[],
            },
          );

          // If the visit to import already exists, add the corresponding GUID to each record object
          if (existingVisitGUIDS.length > 0) {
            // Do a PUT to update the existing visit record
            const allVisitsWithGUIDS = allFieldVisits.map((visit, index) => {
              return {
                id: existingVisitGUIDS[index],
                ...visit,
              };
            });

            // Find the unique records with the visit GUIDS and send a PUT request with that data
            const uniqueVisitsWithIDsAndCounts =
              this.getUniqueWithCounts(allVisitsWithGUIDS);
            visitInfo = await this.fieldVisitJson(
              uniqueVisitsWithIDsAndCounts,
              "put",
            );
            // Expand the returned list for potential relational computation for activities
            expandedVisitInfo = this.expandList(visitInfo);
          } else {
            // If visits don't already exist --> Do a POST to insert a new visit record. Keep track of the newly inserted GUIDs for potential activity insertions
            const uniqueVisitsWithCounts =
              this.getUniqueWithCounts(allFieldVisits);
            visitInfo = await this.fieldVisitJson(
              uniqueVisitsWithCounts,
              "post",
            );
            // Expand the returned list for potential relational computation for activities
            expandedVisitInfo = this.expandList(visitInfo);
          }

          // If the activity to import already exists, add the corresponding GUID to each record object
          if (existingActivityGUIDS.length > 0) {
            // Do a PUT to update the existing activity record
            const allActivitiesWithGUIDS = allFieldActivities.map(
              (activity, index) => {
                return {
                  id: existingActivityGUIDS[index],
                  ...activity,
                };
              },
            );

            // Find the unique records with the activity GUIDS and send a PUT request with that data
            const uniqueActivitiesWithIDsAndCounts = this.getUniqueWithCounts(
              allActivitiesWithGUIDS,
            );
            activityInfo = await this.fieldActivityJson(
              uniqueActivitiesWithIDsAndCounts,
              "put",
            );
            // Expand the returned list for potential relational computation for specimen
            expandedActivityInfo = this.expandList(activityInfo);
          } else {
            // If the activities don't already exist --> Do a POST to insert a new activity record. Keep track of the newly inserted GUIDs for potential specimen insertions
            allFieldActivities = allFieldActivities.map((obj2, index) => {
              const obj1 = expandedVisitInfo[index];
              return { ...obj2, ...obj1 };
            });

            const uniqueActivitiesWithCounts =
              this.getUniqueWithCounts(allFieldActivities);
            activityInfo = await this.fieldActivityJson(
              uniqueActivitiesWithCounts,
              "post",
            );
            // Expand the returned list for potential relational computation for specimen
            expandedActivityInfo = this.expandList(activityInfo);
          }

          // If the specimen to import already exists, add the corresponding GUID to each record object
          if (existingSpecimenGUIDS.length > 0) {
            // Do a PUT to update the existing specimen record
            const allSpecimensWithGUIDS = allSpecimens.map(
              (specimen, index) => {
                return {
                  id: existingSpecimenGUIDS[index],
                  ...specimen,
                };
              },
            );

            // Find the unique records with the specimen GUIDS and send a PUT request with that data
            const uniqueSpecimensWithIDsAndCounts = this.getUniqueWithCounts(
              allSpecimensWithGUIDS,
            );
            specimenInfo = await this.specimensJson(
              uniqueSpecimensWithIDsAndCounts,
              "put",
            );
          } else {
            //If the specimens don't already exist --> Do a POST to insert a new specimen record. Keep track of the newly inserted GUIDs for potential observation insertions
            allSpecimens = allSpecimens.map((obj2, index) => {
              const obj1 = expandedActivityInfo[index];
              return { ...obj2, ...obj1 };
            });
            const uniqueSpecimensWithCounts =
              this.getUniqueWithCounts(allSpecimens);
            specimenInfo = await this.specimensJson(
              uniqueSpecimensWithCounts,
              "post",
            );
          }

          // Import the observations
          await this.aqiService.importObservations(
            ObsFilePath,
            "import",
            file_submission_id,
            file_operation_code,
          );

          // Update file submission status
          await this.fileSubmissionsService.updateFileStatus(
            file_submission_id,
            "SUBMITTED",
          );

          // Save the created GUIDs to aqi_inserted_elements
          await this.saveAQIInsertedElements(
            file_submission_id,
            fileName,
            originalFileName,
            visitInfo,
            activityInfo,
            specimenInfo,
          );

          // Create a record for the file log
          const file_error_log_data = {
            file_submission_id: file_submission_id,
            file_name: fileName,
            original_file_name: originalFileName,
            file_operation_code: file_operation_code,
            ministry_contact: uniqueMinistryContacts,
            error_log: localValidationResults[0],
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
        } else {
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
              error_log: localValidationResults[0],
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
            const uniqueVisitsWithCounts =
              this.getUniqueWithCounts(allFieldVisits);
            let visitInfo = await this.fieldVisitJson(
              uniqueVisitsWithCounts,
              "post",
            );
            let expandedVisitInfo = this.expandList(visitInfo);

            /*
             * Merge the expanded visitInfo with allFieldActivities
             * Collapse allFieldActivities with a dupe count
             * Post the unique records to the API
             * Expand the returned list of object - this will be used for finding unique specimens
             */

            allFieldActivities = allFieldActivities.map((obj2, index) => {
              const obj1 = expandedVisitInfo[index];
              return { ...obj2, ...obj1 };
            });

            const uniqueActivitiesWithCounts =
              this.getUniqueWithCounts(allFieldActivities);
            let activityInfo = await this.fieldActivityJson(
              uniqueActivitiesWithCounts,
              "post",
            );
            let expandedActivityInfo = this.expandList(activityInfo);

            /*
             * Merge the expanded activityInfo with allSpecimens
             * Collapse allSpecimens with a dupe count
             * Post the unique records to the API
             */
            allSpecimens = allSpecimens.map((obj2, index) => {
              const obj1 = expandedActivityInfo[index];
              return { ...obj2, ...obj1 };
            });
            const uniqueSpecimensWithCounts =
              this.getUniqueWithCounts(allSpecimens).filter(item => item.rec.SpecimenName !== "");

            let specimenInfo = await this.specimensJson(
              uniqueSpecimensWithCounts,
              "post",
            );

            await this.aqiService.importObservations(
              ObsFilePath,
              "import",
              file_submission_id,
              file_operation_code,
            );

            await this.fileSubmissionsService.updateFileStatus(
              file_submission_id,
              "SUBMITTED",
            );

            // Save the created GUIDs to aqi_inserted_elements
            await this.saveAQIInsertedElements(
              file_submission_id,
              fileName,
              originalFileName,
              visitInfo,
              activityInfo,
              specimenInfo,
            );

            const file_error_log_data = {
              file_submission_id: file_submission_id,
              file_name: fileName,
              original_file_name: originalFileName,
              file_operation_code: file_operation_code,
              ministry_contact: uniqueMinistryContacts,
              error_log: localValidationResults[0],
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
      }
    }
  }
}
