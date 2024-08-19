import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig, post } from "axios";
import { FileSubmissionsService } from "src/file_submissions/file_submissions.service";
import { FieldActivities, FieldSpecimens, FieldVisits } from "src/types/types";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import * as XLSX from "xlsx";
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
  SamplingContextTag: ""
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
          'samplingLocation': {
            'id': locID[0].aqi_locations_id,
            'custom_id': param,
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
          'project': { 'id': projectID[0].aqi_projects_id, 'customId': param },
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
          'collectionMethod': {
            'id': cmID[0].aqi_collection_methods_id,
            'customId': param,
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
        return { 'medium': { 'id': mediumID[0].aqi_mediums_id, 'customId': param } };
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
          'depth': {
            'value': param[1],
            'unit': { 'id': duID[0].aqi_units_id, 'customId': param[0] },
          },
        };
      case "TAGS":
        let returnTags: any = []
        for (const tag of param){
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
          returnTags.push({'id': tagID[0].aqi_context_tags_id, 'name': tag});
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
            'attributeId': eaID[0].aqi_extended_attributes_id,
            'customId': param[0],
            'number': +param[1],
          };
        } else if (param[0] == "Specimen Tissue Type") {
          return {
            'attributeId': eaID[0].aqi_extended_attributes_id,
            'customId': param[0],
            'dropDownListItem': { 'customId': param[1] },
          };
        } else {
          return {
            'attributeId': eaID[0].aqi_extended_attributes_id,
            'customId': param[0],
            'text': param[1],
          };
        }
    }
  }

  async postFieldVisits(visitData: any) {
    let postData: any = {};
    const visitAndLocId = [];
    const extendedAttribs = { extendedAttributes: [] };
    for (const row of visitData) {
      let locationCustomID = row.LocationID;
      let projectCustomID = row.Project;
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
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EAMinistryContact,
          row.MinistryContact,
        ]),
      );
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EASamplingAgency,
          row.SamplingAgency,
        ]),
      );

      Object.assign(postData, extendedAttribs);
      Object.assign(postData, { startTime: row.FieldVisitStartTime });
      Object.assign(postData, { endTime: row.FieldVisitEndTime });
      Object.assign(postData, { participants: row.FieldVisitParticipants });
      Object.assign(postData, { notes: row.FieldVisitComments });
      Object.assign(postData, { planningStatus: row.PlanningStatus });

      let currentVisitAndLoc: any = {};

      Object.assign(currentVisitAndLoc, {
        samplingLocation: postData.samplingLocation,
      });
      Object.assign(currentVisitAndLoc, {
        fieldVisit: await this.aqiService.fieldVisits(postData),
      });
      visitAndLocId.push(currentVisitAndLoc);
      break;
    }

    return visitAndLocId;
  }

  async postFieldActivities(visitInfo: any, activityData: any) {
    let postData = {};
    let activityId = [];
    const extendedAttribs = { extendedAttributes: [] };
    const sampleContextTags = {'samplingContextTags': []}

    for (const [index, activity] of activityData.entries()) {
      let collectionMethodCustomID = activity.CollectionMethod;
      let mediumCustomID = activity.Medium;
      let depthUnitCustomID = activity.DepthUnit;
      let depthUnitValue = activity.DepthUpper;
      let sampleContextTagCustomIds = activity.SamplingContextTag

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
      Object.assign(
        postData,
        await this.queryCodeTables("DEPTH_UNIT", [
          depthUnitCustomID,
          depthUnitValue,
        ]),
      );

      if (sampleContextTagCustomIds != null) {
        let tagsToLookup = sampleContextTagCustomIds.split(', ');
        sampleContextTags['samplingContextTags'] = await this.queryCodeTables("TAGS", tagsToLookup)
      }

      console.log(sampleContextTags);

      // get the EA custom id (Depth Lower and Depth Upper) and find the GUID
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          "Depth Lower",
          activity.DepthLower,
        ]),
      );

      Object.assign(postData, { type: activity.ActivityType });
      Object.assign(postData, extendedAttribs);
      Object.assign(postData, sampleContextTags)
      Object.assign(postData, { startTime: activity.ObservedDateTime });
      Object.assign(postData, { endTime: activity.ObservedDateTimeEnd });
      Object.assign(postData, {
        samplingLocation: visitInfo[index].samplingLocation,
      });
      Object.assign(postData, {
        fieldVisit: { id: visitInfo[index].fieldVisit },
      });
      Object.assign(postData, { customId: activity.ActivityName });

      let currentActivity = {};
      Object.assign(currentActivity, {
        activity: {
          id: await this.aqiService.fieldActivities(postData),
          customId: activity.ActivityName,
          startTime: activity.ObservedDateTime,
        },
      });
      activityId.push(currentActivity);
      break;
    }
    return activityId;
  }

  async postFieldSpecimens(activityInfo: any, specimenData: any) {
    let postData = {};
    const extendedAttribs = { extendedAttributes: [] };
    for (const [index, specimen] of specimenData.entries()) {
      let EAWorkOrderNumberCustomID = "Work Order Number";
      let EATissueType = "Specimen Tissue Type";
      let EALabArrivalTemp = "Specimen Lab Arrival Temperature (°C)";
      let mediumCustomID = specimen.Medium;
      let FieldFiltered = specimen.FieldFiltered;
      let FieldFilterComment = specimen.FieldFilterComment;

      Object.assign(
        postData,
        await this.queryCodeTables("MEDIUM", mediumCustomID),
      );
      // get the EA custom id (EA Work Order Number, FieldFiltered, FieldFilterComment, FieldPreservative, EALabReportID, SpecimenName) and find the GUID
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EAWorkOrderNumberCustomID,
          specimen.WorkOrderNumber,
        ]),
      );
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EATissueType,
          specimen.TissueType,
        ]),
      );
      extendedAttribs["extendedAttributes"].push(
        await this.queryCodeTables("EXTENDED_ATTRIB", [
          EALabArrivalTemp,
          specimen.LabArrivalTemperature,
        ]),
      );

      if (FieldFiltered == "TRUE") {
        Object.assign(postData, { filtered: "true" });
        Object.assign(postData, { filtrationComment: FieldFilterComment });
      } else {
        Object.assign(postData, { filtered: "false" });
      }
      Object.assign(postData, { preservative: specimen.FieldPreservative });
      Object.assign(postData, { name: specimen.SpecimenName });
      Object.assign(postData, { activity: activityInfo[index].activity });
      Object.assign(postData, extendedAttribs);

      await this.aqiService.fieldSpecimens(postData)
      break;
    }
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

  async parseFile(file: string, fileName: string) {
    const path = require("path");
    const extention = path.extname(fileName);
    if (extention == ".xlsx") {
      const workbook = XLSX.read(file, { type: "binary" });
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

      const allFieldVisits = this.filterFile<FieldVisits>(
        allRecords,
        Object.keys(visits),
        fieldVisitCustomAttributes,
      );
      const allFieldActivities = this.filterFile<FieldActivities>(
        allRecords,
        Object.keys(activities),
        fieldActivityCustomAttrib,
      );
      const allSpecimens = this.filterFile<FieldSpecimens>(
        allRecords,
        Object.keys(specimens),
        null,
      );

      let visitInfo = await this.postFieldVisits(allFieldVisits);
      let activityInfo = await this.postFieldActivities(
        visitInfo,
        allFieldActivities,
      );
      await this.postFieldSpecimens(activityInfo, allSpecimens);
    }
  }
}
