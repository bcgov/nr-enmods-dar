import { Typography } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { Box } from "@mui/system";
import type { SFTPUserInfo } from "@/types/types";
import { sftpUserColumns } from "@/components/table/sftp/sftpUserColumns";
import { getSftpUsers } from "@/common/sftp";

export default function SFTPUserPage() {
  const [sftpUserData, setSFTPUserData] = useState<SFTPUserInfo[]>([]);

  const getSFTPUserData = async () => {
    const sftpUsers: SFTPUserInfo[] = await getSftpUsers();
    console.log(sftpUsers);
    setSFTPUserData(sftpUsers);
  };

  useEffect(() => {
    getSFTPUserData();
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        marginLeft: "4em",
        overflow: "auto",
      }}
    >
      <Box sx={{ paddingBottom: "30px" }}>
        <Typography id="pageTitle" variant="h4">
          SFTP Users
        </Typography>
      </Box>
      <Box style={{ height: 400, width: "100%" }}>
        <DataGrid
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          checkboxSelection={false}
          rows={sftpUserData}
          columns={sftpUserColumns(() => {})}
          pageSizeOptions={[5, 10, 20, 50, 100]}
          getRowId={(row) => row["id"]}
        />
      </Box>
    </div>
  );
}
