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
import { FileStatusCode } from '@/types/types';
import { getFileStatusCodes } from '@/common/manage-dropdowns'

const columns = [
  {
    field: 'fileName',
    headerName: 'Filen Name',
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
    field: 'submissionDate',
    headerName: 'Submission Date',
    sortable: true,
    filterable: true,
    flex: 2,
  },
  {
    field: 'submitterUsername',
    headerName: 'Submitter Username',
    sortable: true,
    filterable: true,
    flex: 2,
  },
  {
    field: 'submitterAgency',
    headerName: 'Submitter Agency',
    sortable: true,
    filterable: true,
    flex: 2,
  },
  {
    field: 'fileStatus',
    headerName: 'Status',
    sortable: true,
    filterable: true,
    flex: 1.5,
  },
  {
    field: 'samples',
    headerName: '# Samples',
    sortable: true,
    filterable: true,
    flex: 1,
  },
  {
    field: 'results',
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
  const handleSearch = () => {
    console.log('SEARCH HERE')
  }

  const [data, setData] = useState<any>([
    {
      fileName: 'testFileGUI.txt',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'VALIDATED',
      samples: 12,
      results: 12,
    },
    {
      fileName: 'test2.csv',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'IN PROGRESS',
      samples: 12,
      results: 12,
    },
    {
      fileName: 'test3.xlsx',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'ACCEPTED',
      samples: 12,
      results: 12,
    },
    {
      fileName: 'test4.txt',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'REJECTED',
      samples: 12,
      results: 12,
    },
    {
      fileName: 'test5.xlsx',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'VALIDATED',
      samples: 12,
      results: 12,
    },
    {
      fileName: 'test6.xlsx',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'VALIDATED',
      samples: 12,
      results: 12,
    },
    {
      fileName: 'test7.xlsx',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'VALIDATED',
      samples: 12,
      results: 12,
    },
    {
      fileName: 'test8.xlsx',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'VALIDATED',
      samples: 12,
      results: 12,
    },
    {
      fileName: 'test9.xlsx',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'VALIDATED',
      samples: 12,
      results: 12,
    },
    {
      fileName: 'test10.xlsx',
      submissionDate: '2024-06-19',
      submitterUsername: 'VMANAWAT',
      submitterAgency: 'SALUSSYSTEMS',
      fileStatus: 'VALIDATED',
      samples: 12,
      results: 12,
    },
  ])

  const [submissionStatusCodes, setSubmissionStatusCodes] = useState({
    items: []
  })

  const [selectedStatusCode, setSelectedStatusCode] = useState('ALL')

  const handleStatusChange = (event) => {
    console.log(event.target.value)
    setSelectedStatusCode(event.target.value)
  }

  useEffect(() => {
    async function fetchFileStatusCodes() {
      await getFileStatusCodes().then((response) => {
        const newSubmissionCodes = submissionStatusCodes.items
        Object.keys(response).map(key => {
          newSubmissionCodes[key] = response[key]
        })
        setSubmissionStatusCodes({
          items: newSubmissionCodes
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
          <FormControl>
            <Grid container>
              <Grid item xs={12} sx={{ paddingBottom: '20px' }}>
                <FormLabel sx={{ paddingRight: '100px' }}>File Name</FormLabel>
                <TextField
                  id="outlined-basic"
                  variant="outlined"
                  size="small"
                  sx={{ width: '520px' }}
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
                />
              </Grid>

              <Grid item xs={4} sx={{ paddingBottom: '20px' }}>
                <FormLabel sx={{ paddingRight: '5px' }}>To:</FormLabel>
                <TextField
                  id="outlined-basic"
                  variant="outlined"
                  size="small"
                  type="date"
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
                    <MenuItem key="ALL" value="ALL">ALL</MenuItem>
                    {submissionStatusCodes ? (
                      submissionStatusCodes.items.map(option => (
                        <MenuItem key={option.submission_status_code} value={option.submission_status_code}>
                          {option.submission_status_code}
                        </MenuItem>
                      ))
                    ) : ''}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button color="primary" variant="contained" onClick={handleSearch}>
            Search
          </Button>
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
          rows={data}
          columns={columns}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          getRowId={(row) => row['fileName']}
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
