import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { useEffect, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import {
  DeleteRounded,
  UploadFile,
  ExpandMore,
  ChevronRight,
} from "@mui/icons-material";
import "@/index.css";
import { jwtDecode } from "jwt-decode";
import { insertFile } from "@/common/manage-files";
import UserService from "@/service/user-service";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import { getAqiStatus } from "@/common/admin";

const fileTypes = ["xlsx", "csv", "txt"];
let selectedFiles: any[] = [];

function FileUpload() {
  const [files, setFiles] = useState(null);
  const [fileStatusCodes, setFileStatusCodes] = useState({
    items: [],
  });

  const [open, setOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const handleOpen = (index: number) => {
    setCurrentItem(selectedFiles[index]);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setCurrentItem(null);
  };

  const [disabledButtons, setDisabledButtons] = useState<boolean[]>(
    Array((files ?? []).length).fill(false),
  );

  const [checkedItems, setCheckedItems] = useState({
    master: true,
    items: [],
  });

  const [anyButtonClicked, setAnyButtonClicked] = useState(false);
  const [globalButtonClicked, setGlobalButtonClicked] = useState(false);

  async function getRowCount(file: any): Promise<number> {
    if (file.name.endsWith(".xlsx")) {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      return worksheet.rowCount;
    } else if (file.name.endsWith(".csv")) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (!event.target?.result) return reject;
          const csvText = event.target.result as string;
          const { data } = Papa.parse(csvText);
          resolve(data.length);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    }
    return 0;
  }

  const handleFileSelect = async (newFiles: FileList | File[]) => {
    if (!newFiles) return;

    // Convert to array and filter out files with spaces in the name
    const newFilesArray = Array.from(newFiles).filter(
      (file: File) => !file.name.includes(" "),
    );

    if (newFilesArray.length !== Array.from(newFiles).length) {
      confirm(
        "File names cannot contain spaces. Please rename the following files and try again:\n" +
          Array.from(newFiles)
            .filter((file: File) => file.name.includes(" "))
            .map((file: File) => file.name)
            .join("\n"),
      );
      return;
    }

    // Check for max number of rows
    for (const file of newFilesArray) {
      const rowCount = await getRowCount(file);
      if (rowCount > 10002) {
        confirm(
          "File contains more than 10,000 rows. Make sure file has at most 10,000 rows and try again:\n" +
            file.name +
            `, rows found: ${rowCount}`,
        );
        return;
      }
    }

    // Merge with existing files, avoiding duplicates by name+size
    const existingFiles = selectedFiles || [];
    const mergedFiles = [
      ...existingFiles,
      ...newFilesArray.filter(
        (newFile) =>
          !existingFiles.some(
            (existingFile) =>
              existingFile.name === newFile.name &&
              existingFile.size === newFile.size,
          ),
      ),
    ];

    if (mergedFiles.length > 10) {
      console.log("jere");
      confirm(
        `Cannot select more than 10 files. ${newFilesArray.length} selected`,
      );
      return;
    }

    setFiles(mergedFiles);
    selectedFiles = mergedFiles;

    checkedItems.items = mergedFiles.map(() => true);
    fileStatusCodes.items = mergedFiles.map(() => null);
  };

  const deleteFile = (file: string | Blob) => {
    const index = selectedFiles.indexOf(file);
    selectedFiles.splice(index, 1);
    checkedItems.items.splice(index, 1);
    fileStatusCodes.items.splice(index, 1);
    setOpen(false);
  };

  const validateFile = async (file: string | Blob, index: number) => {
    if (file) {
      // const rowCount = await getRowCount(file)

      const updated = [...disabledButtons];
      updated[index] = true;
      setDisabledButtons(updated);
      setAnyButtonClicked(true);

      const formData = new FormData();
      let orgGUID = null,
        agency = null,
        userId = null;
      var JWT = jwtDecode(UserService.getToken()?.toString());

      if (JWT.identity_provider === "bceidboth") {
        orgGUID = JWT.bceid_business_guid;
        agency = JWT.bceid_business_name;
        userId = JWT.bceid_username;
      } else {
        agency = JWT.idir_username;
        userId = JWT.idir_username;
      }

      formData.append("file", file);
      formData.append("operation", "VALIDATE");
      // formData.append("file_row_count", rowCount)
      formData.append("dataSubmitterEmail", JWT.email);
      formData.append("userID", userId);
      formData.append("orgGUID", orgGUID);
      formData.append("agency", agency);
      formData.append("notification", checkedItems.items[index]);
      formData.append("token", UserService.getToken()?.toString());

      await insertFile(formData).then((response) => {
        const newStatusCodes = fileStatusCodes.items;
        newStatusCodes[index] = response.submission_status_code;
        setFileStatusCodes({
          items: newStatusCodes,
        });
      });
    }
  };

  const validateAllFiles = async (files) => {
    setAnyButtonClicked(true);
    setGlobalButtonClicked(true);

    if (files) {
      // Convert to array to maintain order and process sequentially
      const filesArray = Array.from(files);
      
      for (let index = 0; index < filesArray.length; index++) {
        const value = filesArray[index];
        // const rowCount = await getRowCount(value)
        const formData = new FormData();
        let orgGUID = null,
          agency = null,
          userId = null;
        var JWT = jwtDecode(UserService.getToken()?.toString());
        if (JWT.identity_provider === "bceidboth") {
          orgGUID = JWT.bceid_business_guid;
          agency = JWT.bceid_business_name;
          userId = JWT.bceid_username;
        } else {
          agency = JWT.idir_username;
          userId = JWT.idir_username;
        }

        formData.append("file", value);
        formData.append("operation", "VALIDATE");
        // formData.append("file_row_count", rowCount)
        formData.append("dataSubmitterEmail", JWT.email);
        formData.append("userID", userId);
        formData.append("orgGUID", orgGUID);
        formData.append("agency", agency);
        formData.append("notification", checkedItems.items[index]);
        formData.append("token", UserService.getToken()?.toString());

        const response = await insertFile(formData);
        const newStatusCodes = fileStatusCodes.items;
        newStatusCodes[index] = response.submission_status_code;
        setFileStatusCodes({
          items: newStatusCodes,
        });
      }
    }
  };

  const submitFile = async (file: string | Blob, index: number) => {
    if (file) {
      // const rowCount = await getRowCount(file)

      const updated = [...disabledButtons];
      updated[index] = true;
      setDisabledButtons(updated);
      setAnyButtonClicked(true);

      const formData = new FormData();
      let orgGUID = null,
        agency = null,
        userId = null;
      var JWT = jwtDecode(UserService.getToken()?.toString());

      if (JWT.identity_provider === "bceidboth") {
        orgGUID = JWT.bceid_business_guid;
        agency = JWT.bceid_business_name;
        userId = JWT.bceid_username;
      } else {
        agency = JWT.idir_username;
        userId = JWT.idir_username;
      }

      // let agency = JWT.bceid_business_name || JWT.
      formData.append("file", file);
      formData.append("operation", "IMPORT");
      // formData.append("file_row_count", rowCount)
      formData.append("dataSubmitterEmail", JWT.email);
      formData.append("userID", userId);
      formData.append("orgGUID", orgGUID);
      formData.append("agency", agency);
      formData.append("notification", checkedItems.items[index]);
      formData.append("token", UserService.getToken()?.toString());

      await insertFile(formData).then((response) => {
        const newStatusCodes = fileStatusCodes.items;
        newStatusCodes[index] = response.submission_status_code;
        setFileStatusCodes({
          items: newStatusCodes,
        });
      });
    }
  };

  const submitAllFiles = async (files: any) => {
    setAnyButtonClicked(true);
    setGlobalButtonClicked(true);

    if (files) {
      // Convert to array to maintain order and process sequentially
      const filesArray = Array.from(files);
      
      for (let index = 0; index < filesArray.length; index++) {
        const value = filesArray[index];
        // const rowCount = await getRowCount(value)
        const formData = new FormData();
        let orgGUID = null,
          agency = null,
          userId = null;
        var JWT = jwtDecode(UserService.getToken()?.toString());
        if (JWT.identity_provider === "bceidboth") {
          orgGUID = JWT.bceid_business_guid;
          agency = JWT.bceid_business_name;
          userId = JWT.bceid_username;
        } else {
          agency = JWT.idir_username;
          userId = JWT.idir_username;
        }

        formData.append("file", value);
        formData.append("operation", "IMPORT");
        // formData.append("file_row_count", rowCount)
        formData.append("dataSubmitterEmail", JWT.email);
        formData.append("userID", userId);
        formData.append("orgGUID", orgGUID);
        formData.append("agency", agency);
        formData.append("notification", checkedItems.items[index]);
        formData.append("token", UserService.getToken()?.toString());

        const response = await insertFile(formData);
        const newStatusCodes = fileStatusCodes.items;
        newStatusCodes[index] = response.submission_status_code;
        setFileStatusCodes({
          items: newStatusCodes,
        });
      }
    }
  };

  const [expandList, setExpandList] = useState(true);
  const handleExpandList = () => {
    setExpandList(!expandList);
  };

  const [aqiOutage, setAqiOutage] = useState(false);

  const handleMasterCheckboxChange = (event: { target: { checked: any } }) => {
    const isChecked = event.target.checked;
    setCheckedItems({
      master: isChecked,
      items: checkedItems.items.map(() => isChecked),
    });
  };

  const handleCheckboxChange =
    (index: number) => (event: { target: { checked: any } }) => {
      const newItems = [...checkedItems.items];
      newItems[index] = event.target.checked;
      setCheckedItems({
        master: newItems.every((item) => item),
        items: newItems,
      });
    };

  const fileSizeError = () => {
    confirm("File size error \nFile cannot be larger than 10MB.");
  };

  useEffect(() => {
    setFiles(null);
    setCurrentItem(null);
    setCheckedItems({
      master: true,
      items: [],
    });
    selectedFiles = [];
  }, []);

  useEffect(() => {
    async function AQIHealthcheck() {
      await getAqiStatus().then((response: any) => {
        if (response) {
          setAqiOutage(true);
        } else {
          setAqiOutage(false);
        }
      });
    }
    AQIHealthcheck();
  });

  return (
    <>
      <div style={{ width: "100%", marginLeft: "4em" }}>
        {aqiOutage && (
          <Alert severity="error">
            AQI is currently down. All files uploaded will be put in the queue
            and processed when AQI is back up and running.
          </Alert>
        )}
      </div>
      <div>
        <div style={{ marginLeft: "4em", width: "100%" }}>
          <Box sx={{ width: "1200px" }}>
            <Typography id="pageTitle" variant="h4">
              File Upload
            </Typography>
            <Typography
              id="pageSubTitle"
              variant="h6"
              component="h2"
              gutterBottom
            >
              This screen allows an authorized user to upload EnMoDS samples and
              results.
            </Typography>
          </Box>

          <div>
            <FileUploader
              classes="custom-file-upload"
              fileOrFiles
              multiple={true}
              types={fileTypes}
              handleChange={handleFileSelect}
              name="file"
              hoverTitle="Click to browse for files to upload"
              maxSize={10}
              onSizeError={fileSizeError}
              children={
                <label id="file-upload" className="upload-container">
                  <div className="upload-children">
                    <span>
                      <UploadFile width="32" height="32" fontSize="large" />
                    </span>
                    <span style={{ fontSize: 30 }}>
                      Upload or drop files right here
                    </span>
                    <div style={{ fontSize: 15, textAlign: "center" }}>
                      Accepted file types: .xlsx, .csv
                    </div>
                  </div>
                </label>
              }
            />
          </div>

          <div className="file-drop-list">
            <Grid container>
              <Grid item xs={6}>
                <Button
                  id="file-list-dropdown"
                  sx={{ color: "black" }}
                  onClick={handleExpandList}
                >
                  {expandList ? <ExpandMore /> : <ChevronRight />}
                  {selectedFiles.length > 0 ? (
                    <label>{selectedFiles.length + " files selected"}</label>
                  ) : (
                    <label>{"0 files selected"}</label>
                  )}
                </Button>
              </Grid>

              {expandList &&
              selectedFiles.length > 0 &&
              selectedFiles.length <= 10 ? (
                <Grid item xs={6}>
                  <FormControlLabel
                    id="select-all-text"
                    sx={{ float: "right" }}
                    value="end"
                    control={
                      <Checkbox
                        id="select-all-checkbox"
                        checked={checkedItems.master}
                        onChange={handleMasterCheckboxChange}
                        color="secondary"
                      />
                    }
                    label="Select All"
                    labelPlacement="end"
                    className={"selectAllEmailCheckbox"}
                  />
                </Grid>
              ) : (
                ""
              )}
            </Grid>

            {expandList && (
              <div className="file-list">
                <List sx={{ height: "40vh", overflow: "auto" }}>
                  {selectedFiles.length > 0 && selectedFiles.length <= 10
                    ? selectedFiles.map((file, index) => (
                        <ListItem key={index}>
                          <Grid container>
                            <Grid item xs={5}>
                              <ListItemText
                                id={"selected-file-" + index}
                                key="test1"
                                primary={file.name}
                                secondary={
                                  (file.size / (1024 * 1024)).toFixed(2) + "MB"
                                }
                              ></ListItemText>
                            </Grid>
                            <Grid item xs={3}>
                              <ButtonGroup
                                variant="text"
                                sx={{ float: "right", paddingTop: "10px" }}
                              >
                                {fileStatusCodes.items[index] == "ACCEPTED" ? (
                                  <Button>
                                    <Typography color={"black"}>
                                      Accepted
                                    </Typography>
                                  </Button>
                                ) : fileStatusCodes.items[index] ==
                                  "REJECTED" ? (
                                  <Button>
                                    <Typography color={"black"}>
                                      Rejected
                                    </Typography>
                                  </Button>
                                ) : fileStatusCodes.items[index] == "QUEUED" ? (
                                  <Button>
                                    <Typography color={"black"}>
                                      Queued
                                    </Typography>
                                  </Button>
                                ) : fileStatusCodes.items[index] ==
                                  "INPROGRESS" ? (
                                  <Button>
                                    <Typography color={"black"}>
                                      In Progress
                                    </Typography>
                                  </Button>
                                ) : (
                                  ""
                                )}

                                {fileStatusCodes.items[index] == "ACCEPTED" ||
                                fileStatusCodes.items[index] == "REJECTED" ||
                                fileStatusCodes.items[index] == "INPROGRESS" ||
                                fileStatusCodes.items[index] == "QUEUED" ? (
                                  ""
                                ) : (
                                  <Button
                                    id={"delete-file-" + index}
                                    style={{
                                      color: "black",
                                      outline: "none !important",
                                    }}
                                    onClick={() => {
                                      handleOpen(index);
                                    }}
                                  >
                                    <DeleteRounded />
                                  </Button>
                                )}
                              </ButtonGroup>
                            </Grid>
                            <Grid item xs={4}>
                              <FormControlLabel
                                id={"selected-file-" + index + "-text"}
                                sx={{ float: "right", paddingTop: "10px" }}
                                control={
                                  <Checkbox
                                    id={"selected-file-" + index + "-checkbox"}
                                    color="secondary"
                                    checked={checkedItems.items[index]}
                                    onChange={handleCheckboxChange(index)}
                                  />
                                }
                                label="Receive Email Confirmation"
                                labelPlacement="end"
                                className={
                                  `emailCheckbox emailCheckbox-` + index
                                }
                              />
                            </Grid>
                            <Grid item xs={9}>
                              <Box>
                                {fileStatusCodes.items[index] == "ACCEPTED" ? (
                                  <Typography>ACCEPTED</Typography>
                                ) : fileStatusCodes.items[index] ==
                                  "REJECTED" ? (
                                  <Typography>REJECTED</Typography>
                                ) : fileStatusCodes.items[index] ==
                                  "INPROGRESS" ? (
                                  <Typography>IN PROGRESS</Typography>
                                ) : fileStatusCodes.items[index] ==
                                  "SUBMITTED" ? (
                                  <Typography>SUBMITTED</Typography>
                                ) : (
                                  ""
                                )}
                              </Box>
                            </Grid>
                            <Grid item xs={3}>
                              <ButtonGroup
                                variant="text"
                                style={{
                                  color: "black",
                                  float: "right",
                                  paddingBottom: "10px",
                                }}
                              >
                                <Button
                                  id={"selected-file-" + index + "-validate"}
                                  variant="contained"
                                  color="secondary"
                                  onClick={() => {
                                    validateFile(file, index);
                                  }}
                                  disabled={
                                    disabledButtons[index] ||
                                    globalButtonClicked
                                  }
                                >
                                  Validate
                                </Button>
                                <Button
                                  id={"selected-file-" + index + "-submit"}
                                  variant="contained"
                                  color="secondary"
                                  onClick={() => {
                                    submitFile(file, index);
                                  }}
                                  disabled={
                                    disabledButtons[index] ||
                                    globalButtonClicked
                                  }
                                >
                                  Submit
                                </Button>
                              </ButtonGroup>
                            </Grid>

                            <Grid item xs={12}>
                              <Divider variant="fullWidth" />
                            </Grid>
                          </Grid>
                        </ListItem>
                      ))
                    : ""}
                </List>

                <Dialog open={open} onClose={handleClose}>
                  <DialogTitle>Delete File </DialogTitle>
                  <DialogContent sx={{ paddingTop: "24px" }}>
                    <Typography>
                      Are you sure you want to delete{" "}
                      {currentItem ? currentItem.name : ""}
                    </Typography>
                  </DialogContent>
                  <DialogActions sx={{ paddingBottom: "24px" }}>
                    <Button
                      onClick={handleClose}
                      variant="contained"
                      color="primary"
                      sx={{
                        backgroundColor: "gray",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "darkgray",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="secondary"
                      onClick={() => deleteFile(currentItem)}
                      variant="contained"
                      autoFocus
                    >
                      Confirm
                    </Button>
                  </DialogActions>
                </Dialog>
              </div>
            )}

            {expandList && (
              <div className="all-file-action" style={{ height: "auto"}}>
                <Box sx={{ padding: "10px" }}>
                  {files && selectedFiles.length > 0 ? (
                    <ButtonGroup variant="text" style={{ color: "black" }}>
                      <Button
                        id={"all-files-validate"}
                        variant="contained"
                        color="secondary"
                        onClick={() => {
                          validateAllFiles(files);
                        }}
                        disabled={anyButtonClicked}
                      >
                        Validate All
                      </Button>
                      <Button
                        id={"all-files-submit"}
                        variant="contained"
                        color="secondary"
                        onClick={() => {
                          submitAllFiles(files);
                        }}
                        disabled={anyButtonClicked}
                      >
                        Submit All
                      </Button>
                    </ButtonGroup>
                  ) : (
                    ""
                  )}
                </Box>
              </div>
            )}

            {!expandList && (
              <div style={{ height: "100dvh", overflow: "auto" }}></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default FileUpload;
