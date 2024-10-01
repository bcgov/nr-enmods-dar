import { Injectable, Logger } from "@nestjs/common";
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
      case "DEPTH_UNIT":
        if (
          param[0] == "m" ||
          param[0] == "Metre" ||
          param[0] == "metre" ||
          param[0] == "Meter" ||
          param[0] == "meter"
        ) {
          param[0] = "metre";
        }

        if (param[0] == "ft" || param[0] == "Feet" || param[0] == "feet") {
          param[0] = "feet";
        }

        let duID = await this.prisma.aqi_units.findMany({
          where: {
            custom_id: {
              equals: param[0],
            },
          },
          select: {
            aqi_units_id: true,
          },
        });
        return {
          depth: {
            value: param[1],
            unit: { id: duID[0].aqi_units_id, customId: param[0] },
          },
        };
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

  async postFieldVisits(visitData: any) {
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

      Object.assign(currentVisitAndLoc, {
        fieldVisit: await this.aqiService.fieldVisits(postData),
      });
      visitAndLocId.push({ rec: currentVisitAndLoc, count: row.count, positions: row.positions });
    }

    return visitAndLocId;
  }

  async postFieldActivities(activityData: any) {
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
      // get the depth unit custom id from object and find depth unit GUID
      if (depthUnitCustomID != null || depthUnitValue != "") {
        Object.assign(
          postData,
          await this.queryCodeTables("DEPTH_UNIT", [
            depthUnitCustomID,
            depthUnitValue,
          ]),
        );
      }

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

      let currentActivity = {};
      Object.assign(currentActivity, {
        activity: {
          id: await this.aqiService.fieldActivities(postData),
          customId: row.rec.ActivityName,
          startTime: row.rec.ObservedDateTime,
        },
      });
      activityId.push({ rec: currentActivity, count: row.count, positions: row.positions });
    }
    return activityId;
  }

  async postFieldSpecimens(specimenData: any) {
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

      await this.aqiService.fieldSpecimens(postData);
    }
  }

  async formulateObservationFile(observationData: any, fileName: string) {
    const obsToWrite: ObservationFile[] = [];

    observationData.map((source) => {
      const sourceKeys = Object.keys(source);
      const targetKeys = Object.keys(obsFile);

      const newObs = {} as ObservationFile;

      sourceKeys.forEach((sourceKey, i) => {
        const targetKey = targetKeys[i];
        if (targetKey !== undefined) {
          newObs[targetKey] = source[sourceKey];
        }
      });
      obsToWrite.push(newObs);
    });

    const baseFileName = path.basename(fileName, path.extname(fileName));
    const filePath = path.join("src/tempObsFiles/", `obs-${baseFileName}.csv`);
    const headers = Object.keys(obsToWrite[0]).map((key) => ({
      id: key,
      title: key,
    }));

    const writer = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: headers,
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
    const map = new Map<string, {rec: any, count: number, positions: number[]}>();

    data.forEach((obj, index) => {
      const key = JSON.stringify(obj);
      if (map.has(key)) {
        const entry = map.get(key)!;
        entry.count++;
        entry.positions.push(index);
      } else {
        map.set(key, { rec: obj, count: 1, positions: [index] });
      }
    })
    const dupeCount = Array.from(map.values());
    return dupeCount;
  }

  expandList (data: any[]) {
    const expandedList: any[] = [];
    
    data.forEach(({rec, positions}) => {
      positions.forEach(position => {
        expandedList[position] = rec
      })
    })

    return expandedList;
  }

  async localValidation(allRecords, observaionFilePath) {
    let errorLogs = [];
    for (const [index, record] of allRecords.entries()) {
      const isoDateTimeRegex =
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(:(\d{2})(\.\d+)?)?(Z|([+-]\d{2}:\d{2}))?$/;

      const numberRegex = /^-?\d+(\.\d+)?$/;

      const dateTimeFields = [
        "FieldVisitStartTime",
        "FieldVisitEndTime",
        "ObservedDateTime",
        "ObservedDateTimeEnd",
        "AnalyzedDateTime",
      ];

      const numericalFields = [
        "DepthUpper",
        "DepthLower",
        "ResultValue",
        "MethodDetectionLimit",
        "MethodReportingLimit",
      ];

      const unitFields = ["DepthUnit", "ResultUnit"];

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
            "aqi_units",
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
      if (visitExists) {
        let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": Visit for Location ${record.LocationID} at Start Time ${record.FieldVisitStartTime} already exists in AQI Field Visits}`;
        errorLogs.push(JSON.parse(errorLog));
      }

      // check if the activity already exits -- check if the activity name for that given visit and location already exists
      const activityExists = await this.aqiService.AQILookup(
        "aqi_field_activities",
        [record.ActivityName, record.FieldVisitStartTime, record.LocationID],
      );
      if (activityExists) {
        let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": Activity Name ${record.ActivityName} for Field Visit at Start Time ${record.FieldVisitStartTime} already exists in AQI Activities}`;
        errorLogs.push(JSON.parse(errorLog));
      }

      // check if the specimen already exists -- check if the specimen name for that given visit and location already exists
      const specimenExists = await this.aqiService.AQILookup("aqi_specimens", [
        record.SpecimenName,
        record.ObservedDateTime,
        record.ActivityName,
        record.LocationID,
      ]);
      if (specimenExists) {
        let errorLog = `{"rowNum": ${index + 2}, "type": "ERROR", "message": Specimen Name ${record.SpecimenName} for that Acitivity at Start Time ${record.ObservedDateTime} already exists in AQI Specimen}`;
        errorLogs.push(JSON.parse(errorLog));
      }
    }

    // Do a dry run of the observations
    const observationsErrors = await this.aqiService.importObservations(
      observaionFilePath,
      "dryrun",
    );

    const finalErrorLog = this.aqiService.mergeErrorMessages(
      errorLogs,
      observationsErrors,
    );

    return finalErrorLog;
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
      );

      const uniqueMinistryContacts = Array.from(new Set(allRecords.map(rec => rec.MinistryContact)))
      /*
       * Do the local validation for each section here - if passed then go to the API calls - else create the message/file/email for the errors
       */

      // await this.fileSubmissionsService.updateFileStatus(
      //   file_submission_id,
      //   "INPROGRESS",
      // );

      const localValidationResults = await this.localValidation(
        allRecords,
        ObsFilePath,
      );

      if (localValidationResults.some((item) => item.type === "ERROR")) {
        /*
         * Set the file status to 'REJECTED'
         * Save the error logs to the database table
         * Send the an email to the submitter and the ministry contact that is inside the file
         */
        await this.fileSubmissionsService.updateFileStatus(
          file_submission_id,
          "REJECTED",
        );

        const file_error_log_data = {
          file_submission_id: file_submission_id,
          file_name: fileName,
          original_file_name: originalFileName,
          file_operation_code: file_operation_code,
          ministry_contact: uniqueMinistryContacts.join(', '),
          error_log: localValidationResults,
          create_utc_timestamp: new Date(),
        };

        await this.prisma.file_error_logs.create({
          data: file_error_log_data,
        });
        return;
      } else if (!(await localValidationResults).includes("ERROR")) {
        await this.fileSubmissionsService.updateFileStatus(
          file_submission_id,
          "VALIDATED",
        );

        if (file_operation_code === "VALIDATE") {
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
          let visitInfo = await this.postFieldVisits(uniqueVisitsWithCounts);
          let expandedVisitInfo = this.expandList(visitInfo)

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
          let activityInfo = await this.postFieldActivities(
            uniqueActivitiesWithCounts,
          );
          let expandedActivityInfo = this.expandList(activityInfo)
          
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
            this.getUniqueWithCounts(allSpecimens);
          await this.postFieldSpecimens(uniqueSpecimensWithCounts);

          await this.aqiService.importObservations(ObsFilePath, "");
        }
      }
    }
  }
}
