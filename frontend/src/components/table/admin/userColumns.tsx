import { Link, MenuItem, Select } from '@mui/material'
import type { GridRenderCellParams } from '@mui/x-data-grid'

export const userColumns = (handleOpenEdit: (username: string) => void) => [
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
