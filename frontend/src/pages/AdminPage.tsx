// import apiService from '@/service/api-service'
import _kc from '@/keycloak'
import type { GridRenderCellParams } from '@mui/x-data-grid'
import {
  Link,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  Tabs,
  Tab,
} from '@mui/material'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import { useState } from 'react'
import { Box } from '@mui/system'
// import { useState } from 'react'
// import type { AxiosResponse } from '~/axios'

export default function AdminPage() {
  const [open, setOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedTab, setSelectedTab] = useState(0)

  // const [data, setData] = useState<any>([])
  const [userData] = useState([
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

  const [companyData] = useState([
    {
      id: 'pqr123',
      name: 'Salus Systems',
      email: 'salus@email.com',
    },
    {
      id: 'asd321',
      name: 'Test Company',
      email: 'testtester@email.com',
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

  const userColumns = [
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

  const companyColumns = [
    {
      field: 'id',
      headerName: 'Company/Agency ID',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 280,
    },
    {
      field: 'name',
      headerName: 'Company/Agency Name',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 280,
    },
    {
      field: 'email',
      headerName: 'Email',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 240,
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

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: number,
  ): void => {
    setSelectedTab(newValue)
  }

  return (
    <div
      style={{
        minHeight: '45em',
        maxHeight: '45em',
        width: '100%',
        marginLeft: '4em',
      }}
    >
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        aria-label="admin tabs"
      >
        <Tab
          label="Users"
          style={{
            color: selectedTab === 0 ? 'black' : 'lightgray',
          }}
        />
        <Tab
          label="Company"
          style={{
            color: selectedTab === 1 ? 'black' : 'lightgray',
          }}
        />
      </Tabs>
      <Box
        role="tabpanel"
        hidden={selectedTab !== 0}
        id={`tabpanel-0`}
        aria-labelledby={`tab-0`}
        style={{
          minHeight: '45em',
          maxHeight: '45em',
          width: '100%',
        }}
      >
        {selectedTab === 0 && (
          <DataGrid
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            experimentalFeatures={{ ariaV7: true }}
            checkboxSelection={false}
            rows={userData}
            columns={userColumns}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            getRowId={(row) => row['id']}
            style={{ minWidth: 920 }}
          />
        )}
      </Box>
      <Box
        role="tabpanel"
        hidden={selectedTab !== 1}
        id={`tabpanel-1`}
        aria-labelledby={`tab-1`}
        style={{ minHeight: '45em', maxHeight: '45em', width: '100%' }}
      >
        {selectedTab === 1 && (
          <DataGrid
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            experimentalFeatures={{ ariaV7: true }}
            checkboxSelection={false}
            rows={companyData}
            columns={companyColumns}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            getRowId={(row) => row['id']}
            style={{ minWidth: 920 }}
          />
        )}
      </Box>
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
