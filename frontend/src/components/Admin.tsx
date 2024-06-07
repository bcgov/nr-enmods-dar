// import apiService from '@/service/api-service'
import type { GridRenderCellParams } from '@mui/x-data-grid'
import {
  Link,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
} from '@mui/material'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import { useState } from 'react'
// import { useState } from 'react'
// import type { AxiosResponse } from '~/axios'

export default function Admin() {
  const [open, setOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  // const [data, setData] = useState<any>([])
  const [data] = useState([
    {
      id: 1,
      name: 'Michael Tennant',
      username: 'mtennant',
      email: 'michael@email.com',
      company: 'Salus Systems',
      role: 'Admin',
    },
    {
      id: 2,
      name: 'Test tester',
      username: 'ttester',
      email: 'test@email.com',
      company: 'Test Company',
      role: 'Data Submitter',
    },
    {
      id: 3,
      name: 'Harold Ackerman',
      username: 'hackerman',
      email: 'hackerman@email.com',
      company: 'Test Company',
      role: 'Operational Staff',
    },
  ])

  const handleRevoke = (id: number) => {
    setSelectedUserId(id)
    setOpen(true)
  }

  const handleConfirmRevoke = () => {
    console.log('Revoke user with id:', selectedUserId)
    setOpen(false)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedUserId(null)
  }

  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'username',
      headerName: 'User Name',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'email',
      headerName: 'Email',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'company',
      headerName: 'Company/Agency',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'role',
      headerName: 'User Role',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'revoke',
      headerName: '',
      sortable: false,
      filterable: false,
      flex: 1,
      minWidth: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Link
          href="#"
          onClick={(event) => {
            event.preventDefault()
            handleRevoke(params.row.id)
          }}
          style={{ color: 'blue', cursor: 'pointer' }}
        >
          Revoke
        </Link>
      ),
    },
  ]

  return (
    <div
      style={{
        minHeight: '45em',
        maxHeight: '45em',
        width: '100%',
        marginLeft: '4em',
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
        getRowId={(row) => row['id']}
        style={{ minWidth: 920 }}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Revoke User Privileges</DialogTitle>
        <DialogContent sx={{ paddingTop: '24px' }}>
          <Typography>
            Are you sure you want to revoke access for this user?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ paddingBottom: '24px' }}>
          <Button
            onClick={handleClose}
            variant="contained"
            color="primary"
            sx={{
              backgroundColor: 'gray',
              color: 'white',
              '&:hover': {
                backgroundColor: 'darkgray',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            color="secondary"
            onClick={handleConfirmRevoke}
            variant="contained"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
