import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ChangeEvent, useEffect, useState } from "react";
import { DeleteRounded, Description } from "@mui/icons-material";
import _kc from "@/keycloak";
import {
  Box,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { getFileStatusCodes } from "@/common/manage-dropdowns";
import {
  deleteFile,
  downloadFile,
  downloadFileLogs,
  searchFiles,
} from "@/common/manage-files";
import { getUsers } from "@/common/admin";
import { jwtDecode, JwtPayload } from "jwt-decode";

export default function Dashboard() {
  const { open, currentItem, handleOpen, handleClose } = useHandleOpen();

  const columns = [
    {
      field: "file_name",
      headerName: "File Name",
      sortable: true,
      filterable: true,
      flex: 1.5,
      renderCell: (params: {
        row: { file_name: string; original_file_name: string };
      }) => (
        <FormControl
          style={{
            cursor: "pointer",
            textDecoration: "underline",
            color: "blue",
          }}
          onClick={() =>
            handleDownload(params.row.file_name, params.row.original_file_name)
          }
        >
          {params.row.original_file_name}
        </FormControl>
      ),
    },
    {
      field: "submission_date",
      headerName: "Submission Date",
      sortable: true,
      filterable: true,
      flex: 2,
    },
    {
      field: "submitter_user_id",
      headerName: "Submitter Username",
      sortable: true,
      filterable: true,
      flex: 2,
    },
    {
      field: "submitter_agency_name",
      headerName: "Submitter Agency",
      sortable: true,
      filterable: true,
      flex: 2,
    },
    {
      field: "submission_status_code",
      headerName: "Status",
      sortable: true,
      filterable: true,
      flex: 1.5,
    },
    {
      field: "sample_count",
      headerName: "# Samples",
      sortable: true,
      filterable: true,
      flex: 1,
    },
    {
      field: "results_count",
      headerName: "# Results",
      sortable: true,
      filterable: true,
      flex: 1,
    },
    {
      field: "delete",
      headerName: "Delete",
      flex: 0.75,
      renderCell: (params: {
        row: {
          file_name: string;
          original_file_name: string;
          submission_id: string;
          submission_status_code: string;
        };
      }) => {
        const token = localStorage.getItem("__auth_token");
        const decoded = jwtDecode<JwtPayload>(token);
        let userRoles = decoded.client_roles

        if (params.row.submission_status_code === "SUBMITTED" && userRoles.includes('Enmods Admin')) {
          return (
            <IconButton
              color="primary"
              onClick={() =>
                handleOpen(
                  params.row.original_file_name,
                  params.row.submission_id,
                  params.row.file_name,
                )
              }
            >
              <DeleteRounded />
            </IconButton>
          );
        } else {
          return (
            <IconButton
              color="primary"
              disabled
              onClick={() =>
                handleOpen(
                  params.row.original_file_name,
                  params.row.submission_id,
                  params.row.file_name,
                )
              }
            >
              <DeleteRounded />
            </IconButton>
          );
        }
      },
    },
    {
      field: "messages",
      headerName: "Messages",
      flex: 1,
      renderCell: (params: {
        row: {
          file_name: string;
          original_file_name: string;
          submission_id: string;
          submission_status_code: string;
        };
      }) => {
        if (
          params.row.submission_status_code === "VALIDATED" ||
          params.row.submission_status_code === "REJECTED" ||
          params.row.submission_status_code === "SUBMITTED"
        ) {
          return (
            <IconButton
              color="primary"
              onClick={() =>
                handleMessages(
                  params.row.submission_id,
                  params.row.original_file_name,
                )
              }
            >
              <Description />
            </IconButton>
          );
        } else {
          return (
            <IconButton
              color="primary"
              disabled
              onClick={() =>
                handleMessages(
                  params.row.submission_id,
                  params.row.original_file_name,
                )
              }
            >
              <Description />
            </IconButton>
          );
        }
      },
    },
  ];

  const [formData, setFormData] = useState({
    fileName: "",
    submissionDateTo: "",
    submissionDateFrom: "",
    submitterUsername: "",
    submitterAgency: "",
    fileStatus: "",
  });

  const handleFormInputChange = (
    key: string,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [key]: event.target.value,
    });
  };

  const [data, setData] = useState<any>({
    items: [],
    totalRows: 0,
  });

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const handlePaginationChange = (params: {
    pageSize: number;
    page: number;
  }) => {
    setTimeout(() => {
      if (params.pageSize != paginationModel.pageSize) {
        setPaginationModel({ page: 0, pageSize: params.pageSize });
      } else {
        setPaginationModel({ ...paginationModel, page: params.page });
      }
    }, 10);
  };

  const handleSearch = async (event) => {
    if (event != null) {
      event.preventDefault();
      setPaginationModel({ page: 0, pageSize: 10 });
    }

    const requestData = new FormData();
    for (var key in formData) {
      requestData.append(key, formData[key]);
    }

    requestData.append("page", paginationModel.page);
    requestData.append("pageSize", paginationModel.pageSize);

    await searchFiles(requestData).then((response) => {
      const dataValues = Object.values(response.results);
      const totalRecFound = response.count;
      setData({
        items: dataValues,
        totalRows: totalRecFound,
      });
    });
  };

  const [submissionStatusCodes, setSubmissionStatusCodes] = useState({
    items: [],
  });

  const [users, setUsers] = useState({
    items: [],
  });

  const [selectedStatusCode, setSelectedStatusCode] = useState("ALL");
  const [selectedSubmitterUserName, setSelectedSubmitterUserName] =
    useState("ALL");
  const [selectedSubmitterAgencyName, setSelectedSubmitterAgencyName] =
    useState("ALL");

  const handleStatusChange = (event) => {
    setSelectedStatusCode(event.target.value);
    handleFormInputChange("fileStatus", event);
  };

  const handleUsernameChange = (event) => {
    console.log(event.target.value);
    setSelectedSubmitterUserName(event.target.value);
    handleFormInputChange("submitterUsername", event);
  };

  const handleAgencyChange = (event) => {
    setSelectedSubmitterAgencyName(event.target.value);
    handleFormInputChange("submitterAgency", event);
  };

  const handleCloseAndSubmit = async () => {
    handleClose();
    await handleSearch(undefined);
  };

  useEffect(() => {
    async function fetchFileStatusCodes() {
      await getFileStatusCodes().then((response: any) => {
        const newSubmissionCodes: any = submissionStatusCodes.items;
        Object.keys(response).map((key) => {
          newSubmissionCodes[key] = response[key];
        });
        setSubmissionStatusCodes({
          items: newSubmissionCodes,
        });
      });
    }

    fetchFileStatusCodes();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      await getUsers().then((response: any) => {
        const newUsers: any = users.items;
        Object.keys(response).map((key) => {
          newUsers[key] = response[key];
        });
        setUsers({
          items: newUsers,
        });
      });
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    if (data.items.length > 0) {
      handleSearch(null);
    }
  }, [paginationModel]);

  return (
    <>
      <div
        style={{
          width: "90%",
          marginLeft: "4em",
        }}
      >
        <Box>
          <Typography id="pageTitle" variant="h4">
            Electronic Data Transfer - Dashboard
          </Typography>
        </Box>

        <Box sx={{ paddingTop: "50px" }}>
          <form onSubmit={handleSearch}>
            <FormControl>
              <Grid container>
                <Grid item xs={12} sx={{ paddingBottom: "20px" }}>
                  <FormLabel
                    id="file-name-label"
                    sx={{ paddingRight: "100px" }}
                  >
                    File Name
                  </FormLabel>
                  <TextField
                    id="file-name-input"
                    variant="outlined"
                    size="small"
                    sx={{ width: "650px" }}
                    onChange={(event) =>
                      handleFormInputChange("fileName", event)
                    }
                  />
                </Grid>

                <Grid item xs={1.9} sx={{ paddingBottom: "20px" }}>
                  <FormLabel id="submission-date-label">
                    Submission Date
                  </FormLabel>
                </Grid>

                <Grid item xs={4.8} sx={{ paddingBottom: "20px" }}>
                  <FormLabel
                    id="submission-date-from-label"
                    sx={{ paddingRight: "5px" }}
                  >
                    From:
                  </FormLabel>
                  <TextField
                    id="submission-date-from-input"
                    variant="outlined"
                    size="small"
                    type="date"
                    onChange={(event) =>
                      handleFormInputChange("submissionDateFrom", event)
                    }
                  />
                </Grid>

                <Grid item xs={4} sx={{ paddingBottom: "20px" }}>
                  <FormLabel
                    id="submission-date-to-label"
                    sx={{ paddingRight: "5px" }}
                  >
                    To:
                  </FormLabel>
                  <TextField
                    id="submission-date-to-input"
                    size="small"
                    type="date"
                    onChange={(event) =>
                      handleFormInputChange("submissionDateTo", event)
                    }
                  />
                </Grid>

                <Grid item xs={12} sx={{ paddingBottom: "20px" }}>
                  <FormLabel
                    id="submitting-agency-label"
                    sx={{ paddingRight: "45px" }}
                  >
                    Submitting Agency
                  </FormLabel>
                  <FormControl id="submitting-agency-input">
                    <Select
                      name="dropdown-agency"
                      variant="outlined"
                      size="small"
                      sx={{ width: "645px" }}
                      onChange={handleAgencyChange}
                      value={selectedSubmitterAgencyName}
                    >
                      <MenuItem key="ALL" value="ALL">
                        ALL
                      </MenuItem>
                      {/* TODO
                        On page load query to find all the agencies and loop through them to render in dropdown                      
                      */}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sx={{ paddingBottom: "20px" }}>
                  <FormLabel
                    id="submitting-user-label"
                    sx={{ paddingRight: "32px" }}
                  >
                    Submitter Username
                  </FormLabel>
                  <FormControl id="submitting-user-input">
                    <Select
                      name="dropdown-user"
                      variant="outlined"
                      size="small"
                      sx={{ width: "645px" }}
                      onChange={handleUsernameChange}
                      value={selectedSubmitterUserName}
                    >
                      <MenuItem key="ALL" value="ALL">
                        ALL
                      </MenuItem>
                      {users
                        ? users.items.map((option: any) => (
                            <MenuItem
                              key={option.username}
                              value={option.username}
                            >
                              {option.name}
                            </MenuItem>
                          ))
                        : ""}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sx={{ paddingBottom: "20px" }}>
                  <FormLabel
                    id="file-status-code-label"
                    sx={{ paddingRight: "135px" }}
                  >
                    Status
                  </FormLabel>
                  <FormControl id="file-status-code-input">
                    <Select
                      name="dropdown-status"
                      variant="outlined"
                      size="small"
                      sx={{ width: "645px" }}
                      onChange={handleStatusChange}
                      value={selectedStatusCode}
                    >
                      <MenuItem key="ALL" value="ALL">
                        ALL
                      </MenuItem>
                      {submissionStatusCodes
                        ? submissionStatusCodes.items.map((option: any) => (
                            <MenuItem
                              key={option.submission_status_code}
                              value={option.submission_status_code}
                            >
                              {option.submission_status_code}
                            </MenuItem>
                          ))
                        : ""}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </FormControl>
            <Box sx={{ paddingLeft: "735px" }}>
              <Button
                id="search-button"
                type="submit"
                color="primary"
                variant="contained"
                onClick={handleSearch}
              >
                Search
              </Button>
            </Box>
          </form>
        </Box>
      </div>
      <div
        id="search-result-table"
        style={{
          margin: "4em",
          paddingBottom: "30px",
        }}
      >
        <DataGrid
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          rows={data.items ? data.items : []}
          rowCount={data.totalRows ? data.totalRows : 0}
          columns={columns}
          getRowId={(row) => row["submission_id"]}
          pagination
          paginationMode="server"
          pageSizeOptions={[5, 10, 20, 50, 100]}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationChange}
          autoHeight={true}
          // onRowClick={(params) => setSelectedRow(params.row)}
          sx={{ width: "1400px", height: `${paginationModel.pageSize * 100}` }}
        />
      </div>

      <div>
        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Delete File </DialogTitle>
          <DialogContent sx={{ paddingTop: "24px" }}>
            <Typography>
              Are you sure you want to delete{" "}
              {currentItem ? currentItem.original_file_name : ""} ?
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
              onClick={() => {
                handleDelete(currentItem.file_name, currentItem.submission_id);
                handleCloseAndSubmit();
              }}
              variant="contained"
              autoFocus
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
}

function useHandleOpen() {
  const [open, setOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState({});

  const handleOpen = (
    original_file_name: string,
    submission_id: string,
    file_name: string,
  ) => {
    setCurrentItem({ original_file_name, submission_id, file_name });
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setCurrentItem(null);
  };

  return { open, currentItem, handleOpen, handleClose };
}

async function handleDownload(
  fileName: string,
  originalFileName: string,
): Promise<void> {
  const fileMimeType = getMimeType(fileName);
  await downloadFile(fileName).then((response: any) => {
    const fileBuffer = new Uint8Array(response.data);
    const blob = new Blob([fileBuffer], { type: fileMimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = originalFileName;
    document.body.appendChild(link); // Append link to body
    link.click(); // Click the link
    document.body.removeChild(link); // Clean up
  });
}

async function handleMessages(
  submission_id: string,
  original_file_name: string,
): Promise<void> {
  const fileNameParts = original_file_name.split(".");
  const fileName =
    fileNameParts.length > 1
      ? fileNameParts.slice(0, -1).join(".")
      : original_file_name;

  const errorMessages: any = await downloadFileLogs(submission_id);
  const blob = new Blob([errorMessages], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}_logs.txt`;
  document.body.appendChild(link); // Append link to body
  link.click(); // Click the link
  document.body.removeChild(link); // Clean up
}

async function handleDelete(
  fileName: string,
  submission_id: string,
): Promise<void> {
  let deleted = false;
  await deleteFile(fileName, submission_id);
}

function getMimeType(fileName: string) {
  const fileNameParts = fileName.split(".");
  const ext = fileNameParts.length > 1 ? fileNameParts.pop() || "" : "";

  switch (ext) {
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "csv":
      return "text/csv";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}
