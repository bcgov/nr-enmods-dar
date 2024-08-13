import { Link } from '@mui/material'
import type { GridRenderCellParams } from '@mui/x-data-grid'

export const companyColumns = (handleOpenEdit: (username: string) => void) => [
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
