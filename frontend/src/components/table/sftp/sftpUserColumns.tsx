export const sftpUserColumns = (handleOpenEdit: (username: string) => void) => [
  {
    field: "name",
    headerName: "Name",
    sortable: true,
    filterable: true,
    flex: 1,
    minWidth: 180,
  },
  {
    field: "username",
    headerName: "Username",
    sortable: true,
    filterable: true,
    flex: 1,
    minWidth: 120,
  },
  {
    field: "email",
    headerName: "Email",
    sortable: true,
    filterable: true,
    flex: 1,
    minWidth: 240,
  },
];
