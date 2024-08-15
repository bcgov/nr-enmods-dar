import { Injectable } from "@nestjs/common";
import { CreateFileSubmissionDto } from "./dto/create-file_submission.dto";
import { UpdateFileSubmissionDto } from "./dto/update-file_submission.dto";
import { PrismaService } from "nestjs-prisma";
import { FileResultsWithCount } from "src/interface/fileResultsWithCount";
import { file_submission } from "@prisma/client";
import { FileInfo, FieldVisits, FieldActivities } from "src/types/types";
import { AqiApiService } from "src/aqi_api/aqi_api.service";
import { randomUUID } from "crypto";
import * as XLSX from "xlsx";

// Create a new object with only the subset keys
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
  FieldVisitStartTime: "",
  FieldVisitEndTime: "",
  ActivityType: "SAMPLE_ROUTINE"
};

function filterData<T>(data: any[], keys, customAttributes): Partial<T>[] {
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

@Injectable()
export class FileSubmissionsService {
  constructor(
    private prisma: PrismaService, 
    private readonly aqiService: AqiApiService) {}

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
        return {"project": {"id": projectID[0].aqi_projects_id, "customId": param}}
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
        return {"collectionMethod": {"id": cmID[0].aqi_collection_methods_id, "customId": param}}
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
        return {"medium": {"id": mediumID[0].aqi_mediums_id, "customId": param}}
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
        return {"depth": {"value": param[1], "unit": {"id": duID[0].aqi_units_id, "customId": param[0]}}}
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
        return {"attributeId": eaID[0].aqi_extended_attributes_id, "customId": param[0], 'text': param[1]}
    }
  }

  async postFieldVisits(visitData: any) {
    let postData: any = {}
    const visitAndLocId = []
    const extendedAttribs = {'extendedAttributes': []}
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
        await this.queryCodeTables("PROJECT", projectCustomID)
      );
      // get the EA custom id (Ministry Contact and Sampling Agency) and find the GUID
      extendedAttribs['extendedAttributes'].push(await this.queryCodeTables("EXTENDED_ATTRIB", [EAMinistryContact, row.MinistryContact]))
      extendedAttribs['extendedAttributes'].push(await this.queryCodeTables("EXTENDED_ATTRIB", [EASamplingAgency, row.SamplingAgency]))
      
      Object.assign(postData, extendedAttribs)
      Object.assign(postData, {'startTime': row.FieldVisitStartTime})
      Object.assign(postData, {'endTime': row.FieldVisitEndTime})
      Object.assign(postData, {'participants': row.FieldVisitParticipants})
      Object.assign(postData, {'notes': row.FieldVisitComments})
      Object.assign(postData, {'planningStatus': row.PlanningStatus})

      let currentVisitAndLoc: any = {}

      Object.assign(currentVisitAndLoc, {'samplingLocation': postData.samplingLocation})
      Object.assign(currentVisitAndLoc, {'fieldVisit': await this.aqiService.fieldVisits(postData)})
      visitAndLocId.push(currentVisitAndLoc)
      break
    }

    return visitAndLocId;
  }

  async postFieldActivities(visitInfo: any, activityData: any) {
    let postData = {}
    const extendedAttribs = {'extendedAttributes': []}
    for (const [index,activity] of activityData.entries()){
      let collectionMethodCustomID = activity.CollectionMethod
      let mediumCustomID = activity.Medium
      let depthUnitCustomID = activity.DepthUnit
      let depthUnitValue = activity.DepthUpper

      // get the collection method custom id from object and find collection method GUID
      Object.assign(postData, await this.queryCodeTables("COLLECTION_METHODS", collectionMethodCustomID))
      // get the medium custom id from object and find medium GUID
      Object.assign(postData, await this.queryCodeTables("MEDIUM", mediumCustomID))
      // get the depth unit custom id from object and find depth unit GUID
      Object.assign(postData, await this.queryCodeTables("DEPTH_UNIT", [depthUnitCustomID, depthUnitValue]))

      // get the EA custom id (Depth Lower and Depth Upper) and find the GUID
      extendedAttribs['extendedAttributes'].push(await this.queryCodeTables("EXTENDED_ATTRIB", ["Depth Lower", activity.DepthLower]))
      
      Object.assign(postData, {'type': activity.ActivityType})
      Object.assign(postData, extendedAttribs)
      Object.assign(postData, {'startTime': activity.FieldVisitStartTime})
      Object.assign(postData, {'endTime': activity.FieldVisitEndTime})
      Object.assign(postData, {'samplingLocation': visitInfo[index].samplingLocation})
      Object.assign(postData, {'fieldVisit': {'id': visitInfo[index].fieldVisit}})

      await this.aqiService.fieldActivities(postData)
      break
    }
  }

  async parseFile(file: Express.Multer.File) {
    const path = require("path");
    const extention = path.extname(file.originalname);
    if (extention == ".xlsx") {
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
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
        ActivityType: 'SAMPLE_ROUTINE',
      };

      const allFieldVisits = filterData<FieldVisits>(
        allRecords,
        Object.keys(visits),
        fieldVisitCustomAttributes,
      );
      const allFieldActivities = filterData<FieldActivities>(
        allRecords,
        Object.keys(activities),
        fieldActivityCustomAttrib,
      );

      let visitInfo = await this.postFieldVisits(allFieldVisits);
      let activityIDs = await this.postFieldActivities(visitInfo, allFieldActivities);
    }
  }

  async create(body: any, file: Express.Multer.File) {
    const createFileSubmissionDto = new CreateFileSubmissionDto();
    /*
      TODO:
      - Create a record in the S3 bucket for this file, use the newly created file GUID when inserting the file to the db and for future reference
      - Create a new record in the file_submissions table with the submission_status_code set to INPROGRESS and the file_submission_id as the GUID from the S3 bucket
      - Begin the validation process
        - Do the location validation: if pass continue to AQI API validation, if fail then update file_submissions_status_code to REJECTED and return
        - Do the AQI API validation: if pass continue to set file_submission_status_code to VALIDATED and return, if fail then update file_submissions_status_code to REJECTED and return
    */

    // Call to function that makes API call to save file in the S3 bucket via COMS
    // let comsSubmissionID = await saveToS3(body.token, file);
    // const path = require('path');
    // const extention = path.extname(file.originalname)
    // const baseName = path.basename(file.originalname, extention)
    // const newFileName = `${baseName}-${comsSubmissionID}${extention}`

    // // Creating file DTO and inserting it in the database with the file GUID from the S3 bucket
    // createFileSubmissionDto.submission_id = comsSubmissionID;
    // createFileSubmissionDto.filename = newFileName;;
    // createFileSubmissionDto.submission_date = new Date();
    // createFileSubmissionDto.submitter_user_id = body.userID;
    // createFileSubmissionDto.submission_status_code = (
    //   await this.prisma.submission_status_code.findUnique({
    //     where: { submission_status_code: "INPROGRESS" },
    //   })
    // ).submission_status_code;
    // createFileSubmissionDto.submitter_agency_name = "SALUSSYSTEMS"; // TODO: change this once BCeID is set up
    // createFileSubmissionDto.sample_count = 0;
    // createFileSubmissionDto.result_count = 0;
    // createFileSubmissionDto.organization_guid = body.orgGUID; // TODO: change this once BCeID is set up
    // createFileSubmissionDto.create_user_id = body.userID;
    // createFileSubmissionDto.create_utc_timestamp = new Date();
    // createFileSubmissionDto.update_user_id = body.userID;
    // createFileSubmissionDto.update_utc_timestamp = new Date();

    // const newFilePostData: Prisma.file_submissionCreateInput = {
    //   submission_id: createFileSubmissionDto.submission_id,
    //   file_name: createFileSubmissionDto.filename,
    //   submission_date: createFileSubmissionDto.submission_date,
    //   submitter_user_id: createFileSubmissionDto.submitter_user_id,
    //   submission_status: { connect: { submission_status_code: "INPROGRESS" } },
    //   submitter_agency_name: createFileSubmissionDto.submitter_agency_name,
    //   sample_count: createFileSubmissionDto.sample_count,
    //   results_count: createFileSubmissionDto.result_count,
    //   active_ind: createFileSubmissionDto.active_ind,
    //   error_log: createFileSubmissionDto.error_log,
    //   organization_guid: createFileSubmissionDto.organization_guid,
    //   create_user_id: createFileSubmissionDto.create_user_id,
    //   create_utc_timestamp: createFileSubmissionDto.create_utc_timestamp,
    //   update_user_id: createFileSubmissionDto.update_user_id,
    //   update_utc_timestamp: createFileSubmissionDto.update_utc_timestamp,
    // };

    // const newFile = await this.prisma.$transaction([
    //   this.prisma.file_submission.create({ data: newFilePostData }),
    // ]);

    this.parseFile(file);

    // return newFile[0];
    return null;
  }

  findAll() {
    return `This action returns all fileSubmissions`;
  }

  async findBySearch(body: any): Promise<FileResultsWithCount<FileInfo>> {
    let records: FileResultsWithCount<FileInfo> = { count: 0, results: [] };

    let limit: number = +body.pageSize;
    let offset: number = body.page * limit;

    const whereClause = {
      file_name: {},
      submission_date: {},
      submitter_user_id: {},
      submitter_agency_name: {},
      submission_status_code: {},
    };

    if (body.fileName) {
      whereClause.file_name = {
        contains: body.fileName,
      };
    }

    if (body.submissionDateFrom) {
      whereClause.submission_date = {
        gte: new Date(body.submissionDateFrom),
      };
    }

    if (body.submissionDateTo) {
      whereClause.submission_date = {
        ...whereClause.submission_date,
        lte: new Date(body.submissionDateTo),
      };
    }

    if (body.submitterUsername && body.submitterUsername != "ALL") {
      whereClause.submitter_user_id = {
        contains: body.submitterUsername,
      };
    }

    if (body.submitterAgency && body.submitterAgency != "ALL") {
      whereClause.submitter_agency_name = {
        contains: body.submitterAgency,
      };
    }

    if (body.fileStatus && body.fileStatus != "ALL") {
      whereClause.submission_status_code = {
        equals: body.fileStatus,
      };
    }

    const selectColumns = {
      submission_id: true,
      file_name: true,
      submission_date: true,
      submitter_user_id: true,
      submitter_agency_name: true,
      submission_status_code: true,
      sample_count: true,
      results_count: true,
    };

    const [results, count] = await this.prisma.$transaction([
      this.prisma.file_submission.findMany({
        take: limit,
        skip: offset,
        select: selectColumns,
        where: whereClause,
        orderBy: {
          create_utc_timestamp: "desc",
        },
      }),

      this.prisma.file_submission.count({
        where: whereClause,
      }),
    ]);

    records = { ...records, count, results };
    return records;
  }

  async findOne(
    fileName: string,
  ): Promise<FileResultsWithCount<file_submission>> {
    let records: FileResultsWithCount<file_submission> = {
      count: 0,
      results: [],
    };
    /*
      TODO: 
      - Find the file_submission record with the submission_id = id
      - Grab the file from the S3 bucket
      - Do the initial validation first (validate the fields in the file that are not in the AQI API). if failed, set the submission_status_code to FAILED, populate the error_log column and return with the error message.
      - Once the initial validation has passed, then call the AQI API on the rest of the fields. If failed, set the submission_status_code to FAILED, populate error_log column and return with error message.
      - Once the AQI API call is done, then update the submission_status_code field in the database to PASSED. If failed, set the submission_status_code to FAILED, populate error_log column and return with error message.
    */

    const query = {
      where: {
        file_name: {
          contains: fileName,
        },
      },
    };

    const [results, count] = await this.prisma.$transaction([
      this.prisma.file_submission.findMany(query),

      this.prisma.file_submission.count({
        where: query.where,
      }),
    ]);

    records = { ...results, count, results };
    return records;
  }

  update(id: number, updateFileSubmissionDto: UpdateFileSubmissionDto) {
    return `This action updates a #${id} fileSubmission`;
  }

  remove(id: number) {
    return `This action removes a #${id} fileSubmission`;
  }
}

async function saveToS3(token: any, file: Express.Multer.File) {
  const path = require("path");
  let fileGUID = null;
  const originalFileName = file.originalname;
  const guid = randomUUID();
  const extention = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, extention);
  const newFileName = `${baseName}-${guid}${extention}`;

  const axios = require("axios");

  let config = {
    method: "put",
    maxBodyLength: Infinity,
    url: `${process.env.COMS_URI}/v1/object?bucketId=${process.env.COMS_BUCKET_ID}`,
    headers: {
      "Content-Disposition": 'attachment; filename="' + newFileName + '"',
      "x-amz-meta-complaint-id": "23-000076",
      "Content-Type": file.mimetype,
      Authorization: "Bearer " + token,
    },
    data: file.buffer,
  };

  await axios.request(config).then((response) => {
    fileGUID = response.data.id;
  });

  return fileGUID;
}
