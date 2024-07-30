import type { GridRenderCellParams } from '@mui/x-data-grid'
import {
  Link,
  Button,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Typography,
} from '@mui/material'
import { DataGrid, GridToolbar } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'
import { Box } from '@mui/system'
import { getUsers } from '@/common/admin'
import type { UserInfo } from '@/types/types'
import AddRoles from '@/components/modal/admin/AddRoles'
import EditRoles from '@/components/modal/admin/EditRoles'

export default function AdminPage() {
  const [selectedUserInfo, setSelectedUserInfo] = useState<UserInfo | null>(
    null,
  )
  const [selectedTab, setSelectedTab] = useState(0)
  const [userData, setUserData] = useState<UserInfo[]>([])
  const [showAddRoles, setShowAddRoles] = useState(false)
  const [showRemoveRoles, setShowRemoveRoles] = useState(false)

  const getUserData = async () => {
    const users: UserInfo[] = await getUsers()
    setUserData(users)
  }

  useEffect(() => {
    getUserData()
  }, [])

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

  const handleOpenEdit = (username: string) => {
    const foundUser = userData.find((user) => user.username === username)
    setSelectedUserInfo(foundUser || null)
    setShowRemoveRoles(true)
  }

  const handleCloseAddRoles = () => setShowAddRoles(false)
  const handleCloseRemoveRoles = () => {
    setShowRemoveRoles(false)
    setSelectedUserInfo(null)
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
      minWidth: 240,
    },
    {
      field: 'company',
      headerName: 'Company/Agency',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 170,
    },
    {
      field: 'role',
      headerName: 'User Role',
      sortable: true,
      filterable: true,
      flex: 1,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams) => {
        const roles = params.value as string[]
        return (
          <Select value={roles[0]} sx={{ width: '100%' }}>
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
        )
      },
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
            handleOpenEdit(params.row.username)
          }}
          style={{ color: 'blue', cursor: 'pointer' }}
        >
          Edit
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
      field: 'edit',
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
            handleOpenEdit(params.row.id)
          }}
          style={{ color: 'blue', cursor: 'pointer' }}
        >
          Edit
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
      <Box sx={{ paddingBottom: '30px' }}>
        <Typography id="pageTitle" variant="h4">
          Electronic Data Transfer - Admin
        </Typography>
      </Box>
      <Tabs
        id="tableTabs"
        value={selectedTab}
        onChange={handleTabChange}
        aria-label="admin tabs"
      >
        <Tab
          id="usersTab"
          label="Users"
          style={{
            color: selectedTab === 0 ? 'black' : 'lightgray',
          }}
        />
        <Tab
          id="companyTab"
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
            getRowId={(row) => row['username']}
            style={{ minWidth: 1000 }}
          />
        )}
      </Box>
      <Box
        role="tabpanel"
        hidden={selectedTab !== 1}
        id={`tabpanel-1`}
        aria-labelledby={`tab-1`}
        style={{ maxHeight: '45em', width: '100%' }}
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '1em',
          width: '100%',
        }}
      >
        <Button
          id="addUserButton"
          variant="contained"
          color="primary"
          onClick={() => setShowAddRoles(true)}
        >
          Add User
        </Button>
      </Box>
      <AddRoles
        show={showAddRoles}
        existingUsers={userData}
        refreshTable={getUserData}
        onHide={handleCloseAddRoles}
      />
      <EditRoles
        show={showRemoveRoles}
        userObject={selectedUserInfo}
        refreshTable={getUserData}
        onHide={handleCloseRemoveRoles}
      />
    </div>
  )
}
