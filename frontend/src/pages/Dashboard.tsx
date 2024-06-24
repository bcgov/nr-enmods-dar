import apiService from '@/service/api-service'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { DeleteRounded, Description } from '@mui/icons-material'
import _kc from '@/keycloak'
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
} from '@mui/material'
import { FileStatusCode } from '@/types/types'
import { getFileStatusCodes } from '@/common/manage-dropdowns'
import { searchFiles } from '@/common/manage-files'

const columns = [
  {
    field: 'file_name',
    headerName: 'File Name',
    sortable: true,
    filterable: true,
    flex: 1.5,
    renderCell: (params) => (
      <FormControl
        style={{
          cursor: 'pointer',
          textDecoration: 'underline',
          color: 'blue',
        }}
        onClick={() => handleDownload(params.row.fileName)}
      >
        {params.value}
      </FormControl>
    ),
  },
  {
    field: 'submission_date',
    headerName: 'Submission Date',
    sortable: true,
    filterable: true,
    flex: 2,
  },
  {
    field: 'submitter_user_id',
    headerName: 'Submitter Username',
    sortable: true,
    filterable: true,
    flex: 2,
  },
  {
    field: 'submitter_agency_name',
    headerName: 'Submitter Agency',
    sortable: true,
    filterable: true,
    flex: 2,
  },
  {
    field: 'submission_status_code',
    headerName: 'Status',
    sortable: true,
    filterable: true,
    flex: 1.5,
  },
  {
    field: 'sample_count',
    headerName: '# Samples',
    sortable: true,
    filterable: true,
    flex: 1,
  },
  {
    field: 'results_count',
    headerName: '# Results',
    sortable: true,
    filterable: true,
    flex: 1,
  },
  {
    field: 'delete',
    headerName: 'Delete',
    flex: 0.75,
    renderCell: (params) => (
      <IconButton
        color="primary"
        onClick={() => handleDelete(params.row.fileName)}
      >
        <DeleteRounded />
      </IconButton>
    ),
  },
  {
    field: 'messages',
    headerName: 'Messages',
    flex: 1,
    renderCell: (params) => (
      <IconButton
        color="primary"
        onClick={() => handleMessages(params.row.fileName)}
      >
        <Description />
      </IconButton>
    ),
  },
]

export default function Dashboard() {

  const [formData, setFormData] = useState({
    fileName: '',
    submissionDateTo: '',
    submissionDateFrom: '',
    submitterUsername: '',
    submitterAgency: '',
    fileStatus: '',
  })

  const handleFormInputChange = (key, event) => {
    setFormData({
      ...formData,
      [key]: event.target.value,
    });
  }

  const [data, setData] = useState<any>({
    items: []
  })

  const handleSearch = async (event) => {
    event.preventDefault();
    const requestData = new FormData();
    for (var key in formData) {
      requestData.append(key, formData[key])
    }

    await searchFiles(requestData).then((response) => {
      const dataValues = Object.values(response.results)
      console.log(dataValues)
      setData({
        items: dataValues,
      })
    })

    console.log(data.items)
  }

  const [submissionStatusCodes, setSubmissionStatusCodes] = useState({
    items: [],
  })

  const [selectedStatusCode, setSelectedStatusCode] = useState('ALL')

  const handleStatusChange = (event) => {
    setSelectedStatusCode(event.target.value)
    handleFormInputChange('fileStatus', event)
  }

  useEffect(() => {
    async function fetchFileStatusCodes() {
      await getFileStatusCodes().then((response) => {
        const newSubmissionCodes = submissionStatusCodes.items
        Object.keys(response).map((key) => {
          newSubmissionCodes[key] = response[key]
        })
        setSubmissionStatusCodes({
          items: newSubmissionCodes,
        })
      })
    }
    // console.log('getAllUsers')
    // console.log('getAllAgencies')

    fetchFileStatusCodes()
    // apiService
    //   .getAxiosInstance()
    //   .get('/v1/users')
    //   .then((response: AxiosResponse) => {
    //     const users = []
    //     for (const user of response.data) {
    //       const userDto = {
    //         id: user.id,
    //         name: user.name,
    //         email: user.email,
    //       }
    //       users.push(userDto)
    //     }
    //     setData(users)
    //   })
    //   .catch((error) => {
    //     console.error(error)
    //   })
  }, [])
  const [selectedRow, setSelectedRow] = useState<null | any[]>(null)

  const handleClose = () => {
    setSelectedRow(null)
  }

  return (
    <>
      <div
        style={{
          width: '90%',
          marginLeft: '4em',
        }}
      >
        <Box>
          <Typography variant="h4">
            Electronic Data Transfer - Dashboard
          </Typography>
        </Box>

        <Box sx={{ paddingTop: '50px' }}>
          <form onSubmit={handleSearch}>
            <FormControl>
              <Grid container>
                <Grid item xs={12} sx={{ paddingBottom: '20px' }}>
                  <FormLabel sx={{ paddingRight: '100px' }}>
                    File Name
                  </FormLabel>
                  <TextField
                    id="outlined-basic"
                    variant="outlined"
                    size="small"
                    sx={{ width: '520px' }}
                    onChange={(event) => handleFormInputChange('fileName', event)}
                  />
                </Grid>

                <Grid item xs={3} sx={{ paddingBottom: '20px' }}>
                  <FormLabel>Submission Date</FormLabel>
                </Grid>

                <Grid item xs={5} sx={{ paddingBottom: '20px' }}>
                  <FormLabel sx={{ paddingRight: '5px' }}>From:</FormLabel>
                  <TextField
                    id="outlined-basic"
                    variant="outlined"
                    size="small"
                    type="date"
                    onChange={(event) => handleFormInputChange('submisstionDateTo', event)}
                  />
                </Grid>

                <Grid item xs={4} sx={{ paddingBottom: '20px' }}>
                  <FormLabel sx={{ paddingRight: '5px' }}>To:</FormLabel>
                  <TextField
                    id="outlined-basic"
                    variant="outlined"
                    size="small"
                    type="date"
                    onChange={(event) => handleFormInputChange('submissionDateFrom', event)}
                  />
                </Grid>

                <Grid item xs={12} sx={{ paddingBottom: '20px' }}>
                  <FormLabel sx={{ paddingRight: '45px' }}>
                    Submitting Agency
                  </FormLabel>
                  <FormControl>
                    <Select
                      id="outlined-basic"
                      variant="outlined"
                      size="small"
                      sx={{ width: '515px' }}
                      onChange={(event) => handleFormInputChange('submitterAgency', event)}
                    >
                      <MenuItem>ALL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sx={{ paddingBottom: '20px' }}>
                  <FormLabel sx={{ paddingRight: '32px' }}>
                    Submitter Username
                  </FormLabel>
                  <FormControl>
                    <Select
                      id="outlined-basic"
                      variant="outlined"
                      size="small"
                      sx={{ width: '515px' }}
                      onChange={(event) => handleFormInputChange('submitterUsername', event)}
                    >
                      <MenuItem>ALL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sx={{ paddingBottom: '20px' }}>
                  <FormLabel sx={{ paddingRight: '135px' }}>Status</FormLabel>
                  <FormControl>
                    <Select
                      id="outlined-basic"
                      variant="outlined"
                      size="small"
                      sx={{ width: '515px' }}
                      onChange={handleStatusChange}
                      value={selectedStatusCode}
                    >
                      <MenuItem key="ALL" value="ALL">
                        ALL
                      </MenuItem>
                      {submissionStatusCodes
                        ? submissionStatusCodes.items.map((option) => (
                            <MenuItem
                              key={option.submission_status_code}
                              value={option.submission_status_code}
                            >
                              {option.submission_status_code}
                            </MenuItem>
                          ))
                        : ''}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type='submit'
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
        style={{
          margin: '4em',
          paddingBottom: '30px',
        }}
      >
        <DataGrid
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          experimentalFeatures={{ ariaV7: true }}
          checkboxSelection={false}
          rows={data.items ? data.items : []}
          columns={columns}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          getRowId={(row) => row['submission_id']}
          // onRowClick={(params) => setSelectedRow(params.row)}
          sx={{ width: '1200px' }}
        />
        <Dialog open={!!selectedRow} onClose={handleClose}>
          <DialogTitle>Row Details</DialogTitle>
          <DialogContent>
            <Table>
              <TableBody>
                {selectedRow &&
                  Object.entries(selectedRow).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>{value}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" color="secondary" onClick={handleClose}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  )
}

function handleDownload(fileName: any): void {
  console.log(fileName)
}

function handleDelete(fileName: any): void {
  console.log(fileName)
}

function handleMessages(fileName: any): void {
  console.log(fileName)
}
