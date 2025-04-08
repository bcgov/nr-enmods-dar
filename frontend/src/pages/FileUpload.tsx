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
import Papa from "papaparse"

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

  async function getRowCount(file: any): Promise<number> {
    if (file.name.endsWith(".xlsx")){
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)
      const worksheet = workbook.worksheets[0]
      return worksheet.rowCount
    }else if (file.name.endsWith(".csv")){
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (!event.target?.result) return reject
          const csvText = event.target.result as string;
          const { data } = Papa.parse(csvText)
          resolve(data.length)
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsText(file)
      })
    }
    return 0
  }

  const handleFileSelect = async (files) => {
    if (!files) return;

    const selectedFilesForValidation = Array.from(files);
    const invalidFiles = selectedFilesForValidation.filter((file: any) =>
      file.name.includes(" "),
    );

    if (invalidFiles.length > 0) {
      confirm(
        "File names cannot contain spaces. Please rename the following files and try again:\n" +
          invalidFiles.map((file: any) => file.name).join("\n"),
      );
      return;
    }

    // check for max number of rows
    for (const file of selectedFilesForValidation){
      const rowCount = await getRowCount(file)

      if (rowCount > 10000){
        confirm(
          "File contains more than 10,000 rows. Make sure file has at most 10,000 rows and try again:\n" +
            file.name + `, rows found: ${rowCount}`,
        );
        return;
      }
    }

    setFiles(files);
    selectedFiles = Array.from(files);

    checkedItems.items = selectedFiles.map((index) => true);
    fileStatusCodes.items = selectedFiles.map((index) => null);
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
      const formData = new FormData();
      var JWT = jwtDecode(UserService.getToken()?.toString());
      formData.append("file", file);
      formData.append("operation", "VALIDATE");
      // formData.append("file_row_count", rowCount)
      formData.append("userID", JWT.idir_username); // TODO: This will need to be updated based on BCeID
      formData.append("orgGUID", JWT.idir_user_guid); // TODO: This will need to be updated based on BCeID and company GUID
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

  const validateAllFiles = (files) => {
    if (files) {
      Object.entries(files).forEach(async ([key, value], index) => {
        // const rowCount = await getRowCount(value)
        const formData = new FormData();
        var JWT = jwtDecode(UserService.getToken()?.toString());
        formData.append("file", value);
        formData.append("operation", "VALIDATE");
        // formData.append("file_row_count", rowCount)
        formData.append("userID", JWT.idir_username); // TODO: This will need to be updated based on BCeID
        formData.append("orgGUID", JWT.idir_user_guid); // TODO: This will need to be updated based on BCeID and company GUID
        formData.append("token", UserService.getToken()?.toString());

        await insertFile(formData).then(async (response) => {
          const newStatusCodes = fileStatusCodes.items;
          newStatusCodes[index] = response.submission_status_code;
          setFileStatusCodes({
            items: newStatusCodes,
          });
        });
      });
    }
  };

  const submitFile = async (file: string | Blob, index: number) => {
    if (file) {
      // const rowCount = await getRowCount(file)
      const formData = new FormData();
      var JWT = jwtDecode(UserService.getToken()?.toString());
      formData.append("file", file);
      formData.append("operation", "IMPORT");
      // formData.append("file_row_count", rowCount)
      formData.append("userID", JWT.idir_username); // TODO: This will need to be updated based on BCeID
      formData.append("orgGUID", JWT.idir_user_guid); // TODO: This will need to be updated based on BCeID and company GUID
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
    if (files) {
      Object.entries(files).forEach(async ([key, value], index) => {
        // const rowCount = await getRowCount(value)
        const formData = new FormData();
        var JWT = jwtDecode(UserService.getToken()?.toString());
        formData.append("file", value);
        formData.append("operation", "IMPORT");
        // formData.append("file_row_count", rowCount)
        formData.append("userID", JWT.idir_username); // TODO: This will need to be updated based on BCeID
        formData.append("orgGUID", JWT.idir_user_guid); // TODO: This will need to be updated based on BCeID and company GUID
        formData.append("token", UserService.getToken()?.toString());

        await insertFile(formData).then(async (response) => {
          const newStatusCodes = fileStatusCodes.items;
          newStatusCodes[index] = response.submission_status_code;
          setFileStatusCodes({
            items: newStatusCodes,
          });
        });
      });
    }
  };

  const [expandList, setExpandList] = useState(true);
  const handleExpandList = () => {
    setExpandList(!expandList);
  };

  const [checkedItems, setCheckedItems] = useState({
    master: true,
    items: [],
  });

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

  useEffect(() =>{
    setFiles(null);
    setCurrentItem(null)
    setCheckedItems({
      master: true,
      items: [],
    });
    selectedFiles = []
  }, [])

  return (
    <>
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
              This screen allows an authorized user to upload EMS samples and
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
                  {selectedFiles.length > 0 && selectedFiles.length <= 10 ? (
                    <label>{selectedFiles.length + " files selected"}</label>
                  ) : selectedFiles.length > 10 ? (
                    <label>
                      {"Cannot select more than 10 files. " +
                        selectedFiles.length +
                        " files selected"}
                    </label>
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
                <List sx={{ height: "100dvh", overflow: "auto" }}>
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
                                label="Receive Email Conformation"
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

                <div className="all-file-action">
                  <Box sx={{ paddingTop: "20px" }}>
                    {files && selectedFiles.length > 0 ? (
                      <ButtonGroup variant="text" style={{ color: "black" }}>
                        <Button
                          id={"all-files-validate"}
                          variant="contained"
                          color="secondary"
                          onClick={() => {
                            validateAllFiles(files);
                          }}
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
                        >
                          Submit All
                        </Button>
                      </ButtonGroup>
                    ) : (
                      ""
                    )}
                  </Box>
                </div>
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
