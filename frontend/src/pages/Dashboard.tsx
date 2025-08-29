import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { DeleteRounded, Description } from "@mui/icons-material";
import _kc from "@/keycloak";
import Select from "react-select";
import {
  Alert,
  Box,
  FormControl,
  FormLabel,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { getFileStatusCodes } from "@/common/manage-dropdowns";
import {
  deleteFile,
  downloadFile,
  downloadFileLogs,
  getAgencies,
  searchFiles,
  updateFileStatus,
} from "@/common/manage-files";
import { getAqiStatus, getUsers } from "@/common/admin";
import { jwtDecode, JwtPayload } from "jwt-decode";
import UserService from "@/service/user-service";

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
        const token: any = localStorage.getItem("__auth_token");
        const decoded = jwtDecode<JwtPayload>(token);
        let userRoles = decoded.client_roles;

        if (
          params.row.submission_status_code === "SUBMITTED" &&
          (userRoles.includes("Enmods Admin") ||
            userRoles.includes("Enmods Delete"))
        ) {
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
          params.row.submission_status_code === "SUBMITTED" ||
          params.row.submission_status_code === "ERROR" ||
          params.row.submission_status_code === "ROLLBACK"
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
    submitterUsername: [],
    submitterAgency: [],
    fileStatus: [],
  });

  const handleFormInputChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (name: string, selectedOptions: any) => {
    const selectedValues = selectedOptions
      ? selectedOptions.map((option: any) => option.value)
      : [];
    handleFormInputChange(name, selectedValues);
  };

  const handleClearSearch = () => {
    setFormData({
      fileName: "",
      submissionDateTo: "",
      submissionDateFrom: "",
      submitterUsername: [],
      submitterAgency: [],
      fileStatus: [],
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

  const [aqiOutage, setAqiOutage] = useState(false);

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

    // before sending the formdata, add the organization guid to the body
    var JWT = jwtDecode(UserService.getToken()?.toString());

    requestData.append("organization_guid", JWT.bceid_business_guid || null);
    requestData.append("roles", JWT.client_roles || null);

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

  const [users, setUsers] = useState({
    items: [],
  });

  const [agencies, setAgencies] = useState({
    items: [],
  });

  const userOptions = users.items.map((user) => ({
    value: user.username,
    label:
      user.username +
      ` (${user.guidUsername?.endsWith("idir") ? "IDIR" : "BCEID"})`,
  }));

  const agencyOptions = agencies.items.map((agency) => ({
    value: agency.submitter_agency_name,
    label: agency.submitter_agency_name,
  }));

  const handleCloseAndSubmit = async () => {
    handleClose();
    await handleSearch(undefined);
  };

  const [submissionStatusCodes, setSubmissionStatusCodes] = useState({
    items: [],
  });

  const statusOptions = submissionStatusCodes.items.map((status) => ({
    value: status.submission_status_code,
    label: status.description,
  }));

  const setupDelete = async (submission_id: string) => {
    const prevData = data.items;
    let newData = prevData.map((row: any) =>
      row.submission_id === submission_id
        ? { ...row, ["submission_status_code"]: "DEL QUEUED" }
        : row,
    );

    // update the status in the backend here
    await handleFileStatus(submission_id, "DEL QUEUED");
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
        const token = localStorage.getItem("__auth_token");
        const decoded = jwtDecode<JwtPayload>(token);
        const currentOrg = decoded?.bceid_business_name || null;
        const isAdmin = decoded?.client_roles.includes("Enmods Admin") ? true : false

        Object.keys(response).map((key) => {
          newUsers[key] = response[key];
        });

        const filtered = newUsers.filter((user) => {
          const { company } = user;

          if (currentOrg) {
            return Array.isArray(company)
              ? company.includes(currentOrg)
              : company === currentOrg;
          } else {
            return typeof company === "string";
          }
        });

        setUsers({
          items: isAdmin ? newUsers : filtered,
        });
      });
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchAgencies() {
      await getAgencies().then((response: any) => {
        const newAgencies: any = agencies.items;
        const token = localStorage.getItem("__auth_token");
        const decoded = jwtDecode<JwtPayload>(token);
        const currentOrg = decoded?.bceid_business_name || null;
        const isAdmin = decoded?.client_roles.includes("Enmods Admin") ? true : false

        Object.keys(response).map((key) => {
          newAgencies[key] = response[key];
        });

        console.log(newAgencies[0])

        const filtered = newAgencies[0].filter(agency => {
          const { submitter_agency_name } = agency

          if (currentOrg){
            return submitter_agency_name === currentOrg
          }else{
            return !submitter_agency_name.includes(" ")
          }
        })

        setAgencies({
          items: isAdmin ? newAgencies[0] : filtered,
        });
      });
    }

    fetchAgencies();
  }, []);

  useEffect(() => {
    if (data.items.length > 0) {
      handleSearch(null);
    }
  }, [paginationModel]);

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
      <div
        style={{
          width: "90%",
          marginLeft: "4em",
        }}
      >
        <Box>
          <Typography id="pageTitle" variant="h4">
            Dashboard
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
                    name="fileName"
                    variant="outlined"
                    size="small"
                    sx={{ width: "650px" }}
                    value={formData.fileName}
                    onChange={(e) =>
                      handleFormInputChange("fileName", e.target.value)
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
                    name="submissionDateFrom"
                    variant="outlined"
                    size="small"
                    type="date"
                    value={formData.submissionDateFrom}
                    onChange={(e) =>
                      handleFormInputChange(
                        "submissionDateFrom",
                        e.target.value,
                      )
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
                    name="submissionDateTo"
                    size="small"
                    type="date"
                    value={formData.submissionDateTo}
                    onChange={(e) =>
                      handleFormInputChange("submissionDateTo", e.target.value)
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
                  <FormControl>
                    <Select
                      isMulti
                      name="submitterAgency"
                      options={agencyOptions}
                      styles={{
                        container: (provided) => ({
                          ...provided,
                          width: "645px",
                        }),
                      }}
                      value={agencyOptions.filter((option) =>
                        formData.submitterAgency.includes(option.value),
                      )}
                      onChange={(selectedOptions) =>
                        handleMultiSelectChange(
                          "submitterAgency",
                          selectedOptions,
                        )
                      }
                    />
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
                      isMulti
                      name="submitterUsername"
                      options={userOptions}
                      styles={{
                        container: (provided) => ({
                          ...provided,
                          width: "645px",
                        }),
                      }}
                      value={userOptions.filter((option) =>
                        formData.submitterUsername.includes(option.value),
                      )}
                      onChange={(selectedOptions) =>
                        handleMultiSelectChange(
                          "submitterUsername",
                          selectedOptions,
                        )
                      }
                    />
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
                      isMulti
                      name="submitterUsername"
                      options={statusOptions}
                      styles={{
                        container: (provided) => ({
                          ...provided,
                          width: "645px",
                        }),
                      }}
                      value={statusOptions.filter((option) =>
                        formData.fileStatus.includes(option.value),
                      )}
                      onChange={(selectedOptions) =>
                        handleMultiSelectChange("fileStatus", selectedOptions)
                      }
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </FormControl>
            <Box sx={{ paddingLeft: "550px" }}>
              <Button
                id="search-button"
                type="submit"
                color="primary"
                variant="contained"
                onClick={handleClearSearch}
              >
                Clear Search
              </Button>
              <Button
                id="search-button"
                type="submit"
                color="primary"
                variant="contained"
                sx={{ ml: 5 }}
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
                setupDelete(currentItem.submission_id);
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

async function handleFileStatus(submission_id: string, newStatus: string) {
  await updateFileStatus(submission_id, { submission_status_code: newStatus });
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
