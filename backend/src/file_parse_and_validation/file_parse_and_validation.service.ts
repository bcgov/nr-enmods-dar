import { Injectable, Logger } from "@nestjs/common";
import axios, { all, AxiosInstance, AxiosRequestConfig, post } from "axios";
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
import { PrismaService } from "nestjs-prisma";
import { assert } from "console";

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
      visitAndLocId.push({ rec: currentVisitAndLoc, count: row.count });
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
      activityId.push({ rec: currentActivity, count: row.count });
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

  async formulateObservationFile(
    observationData: any,
    activityInfo: any,
    fileName: string,
  ) {
    for (const [index, observation] of observationData.entries()) {
      observation["ActivityID"] = activityInfo[index].activity.id;
    }

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
    const filePath = path.join("src/tempObsFiles/", `temp-${baseFileName}.csv`);
    const headers = Object.keys(obsToWrite[0]).map((key) => ({
      id: key,
      title: key,
    }));

    const writer = csvWriter.createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    await writer.writeRecords(obsToWrite);

    await this.aqiService.importObservations(
      `src/tempObsFiles/temp-${baseFileName}.csv`,
    );
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
    const map = new Map<string, number>();

    data.forEach((visit) => {
      const key = JSON.stringify(visit);
      map.set(key, (map.get(key) || 0) + 1);
    });

    const dupeCount = Array.from(map.entries()).map(([key, count]) => ({
      rec: JSON.parse(key),
      count,
    }));

    return dupeCount;
  }

  localValidation(visits, activities, specimens, observations){
    // do validation for visits
    for (const visit of visits) {
      assert(visit.FieldVisitStartTime != null || visit.FieldVisitStartTime != '')
      assert(visit.FieldVisitEndTime != null || visit.FieldVisitEndTime != '')
    }

  }

  async parseFile(file: string, fileName: string) {
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


      /*
       * Do the local validation for each section here - if passed then go to the API calls - else create the message/file/email for the errors
       */

      const localValidationResults = this.localValidation(allFieldVisits, allFieldActivities, allSpecimens, allObservations)

      // /*
      //  * Get unique records to prevent redundant API calls
      //  * Post the unique records to the API
      //  * Expand the returned list of object - this will be used for finding unique activities
      //  */
      // const uniqueVisitsWithCounts = this.getUniqueWithCounts(allFieldVisits);
      // let visitInfo = await this.postFieldVisits(uniqueVisitsWithCounts);
      // let expandedVisitInfo = visitInfo.flatMap((visit) =>
      //   Array(visit.count).fill(visit.rec),
      // );

      // /*
      //  * Merge the expanded visitInfo with allFieldActivities
      //  * Collapse allFieldActivities with a dupe count
      //  * Post the unique records to the API
      //  * Expand the returned list of object - this will be used for finding unique specimens
      //  */

      // allFieldActivities = allFieldActivities.map((obj2, index) => {
      //   const obj1 = expandedVisitInfo[index];
      //   return { ...obj2, ...obj1 };
      // });

      // const uniqueActivitiesWithCounts =
      //   this.getUniqueWithCounts(allFieldActivities);
      // let activityInfo = await this.postFieldActivities(
      //   uniqueActivitiesWithCounts,
      // );
      // let expandedActivityInfo = activityInfo.flatMap((activity) =>
      //   Array(activity.count).fill(activity.rec),
      // );

      // /*
      //  * Merge the expanded activityInfo with allSpecimens
      //  * Collapse allSpecimens with a dupe count
      //  * Post the unique records to the API
      //  */
      // allSpecimens = allSpecimens.map((obj2, index) => {
      //   const obj1 = expandedActivityInfo[index];
      //   return { ...obj2, ...obj1 };
      // });
      // const uniqueSpecimensWithCounts = this.getUniqueWithCounts(allSpecimens);
      // await this.postFieldSpecimens(uniqueSpecimensWithCounts);
      // await this.formulateObservationFile(
      //   allObservations,
      //   expandedActivityInfo,
      //   fileName,
      // );
    }
  }
}
