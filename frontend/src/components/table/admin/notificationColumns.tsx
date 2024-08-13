import { Checkbox } from '@mui/material'
import type { GridRenderCellParams } from '@mui/x-data-grid'

export const notificationColumns = (
  handleCheckbox: (email: string, enabled: boolean) => void,
) => [
  {
    field: 'email',
    headerName: 'Email',
    sortable: true,
    filterable: true,
    flex: 1,
    minWidth: 300,
  },
  {
    field: 'enabled',
    headerName: 'Enabled',
    sortable: true,
    filterable: true,
    flex: 1,
    minWidth: 50,
    renderCell: (params: GridRenderCellParams) => (
      <Checkbox
        checked={params.value}
        onChange={() => handleCheckbox(params.row.email, !params.value)}
      />
    ),
  },
]
