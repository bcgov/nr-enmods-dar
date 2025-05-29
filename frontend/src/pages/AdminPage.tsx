import { Button, Tabs, Tab, Typography } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { Box } from "@mui/system";
import { getUsers } from "@/common/admin";
import type { NotificationInfo, UserInfo } from "@/types/types";
import AddRoles from "@/components/modal/admin/AddRoles";
import EditRoles from "@/components/modal/admin/EditRoles";
import { userColumns } from "@/components/table/admin/userColumns";
import { companyColumns } from "@/components/table/admin/companyColumns";
import { notificationColumns } from "@/components/table/admin/notificationColumns";
import UserService from "@/service/user-service";
import { jwtDecode } from "jwt-decode";
import {
  getNotificationData,
  updateNotification,
} from "@/common/notifications";

export default function AdminPage() {
  const [selectedUserInfo, setSelectedUserInfo] = useState<UserInfo | null>(
    null,
  );
  const [selectedTab, setSelectedTab] = useState(0);
  const [userData, setUserData] = useState<UserInfo[]>([]);
  const [showAddRoles, setShowAddRoles] = useState(false);
  const [showRemoveRoles, setShowRemoveRoles] = useState(false);
  const [notificationData, setNotificationData] = useState<NotificationInfo[]>(
    [],
  );
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = UserService.getToken();
    if (token) {
      const JWT: any = jwtDecode(token);
      setUsername(JWT.idir_username);
    } else {
      console.log("User token is undefined");
    }
  }, []);

  const getUserData = async () => {
    const users: UserInfo[] = await getUsers();
    setUserData(users);
  };

  const getNotificationInfo = async () => {
    const nd: NotificationInfo[] = await getNotificationData();
    setNotificationData(nd);
  };

  useEffect(() => {
    getUserData();
    getNotificationInfo();
  }, []);

  // mock data for company
  const [companyData] = useState([
    {
      id: "1",
      name: "Not Implemented",
      email: "Not Implemented",
    },
    {
      id: "2",
      name: "Not Implemented",
      email: "Not Implemented",
    },
  ]);

  const handleOpenEdit = (username: string) => {
    const foundUser = userData.find((user) => user.username === username);
    setSelectedUserInfo(foundUser || null);
    setShowRemoveRoles(true);
  };

  const handleCloseAddRoles = () => setShowAddRoles(false);

  const handleCloseRemoveRoles = () => {
    setShowRemoveRoles(false);
    setSelectedUserInfo(null);
  };

  const handleNotificationChange = async (email: string, enabled: boolean) => {
    try {
      await updateNotification(email, username, enabled);
      // Update the local state to reflect the change
      setNotificationData((prevData) => {
        return prevData.map((notification) => {
          if (notification.email === email) {
            return { ...notification, enabled };
          }
          return notification;
        });
      });
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: number,
  ): void => {
    setSelectedTab(newValue);
  };

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
          Admin
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
            color: selectedTab === 0 ? "black" : "lightgray",
          }}
        />
        {/* <Tab
          id="companyTab"
          label="Company"
          style={{
            color: selectedTab === 1 ? "black" : "lightgray",
          }}
        /> */}
        <Tab
          label="Notifications"
          style={{ color: selectedTab === 2 ? "black" : "lightgray" }}
        />
      </Tabs>
      <Box
        role="tabpanel"
        hidden={selectedTab !== 0}
        id={`tabpanel-0`}
        aria-labelledby={`tab-0`}
        style={{
          height: 600,
          width: "100%",
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
            rows={userData}
            columns={userColumns(handleOpenEdit)}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            checkboxSelection={false}
            disableRowSelectionOnClick
            getRowId={(row) => row["username"]}
          />
        )}
      </Box>
      {/* <Box
        role="tabpanel"
        hidden={selectedTab !== 1}
        id={`tabpanel-1`}
        aria-labelledby={`tab-1`}
        style={{ height: 400, width: "100%" }}
      >
        {selectedTab === 1 && (
          <DataGrid
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            checkboxSelection={false}
            rows={companyData}
            columns={companyColumns(handleOpenEdit)}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            getRowId={(row) => row["id"]}
          />
        )}
      </Box> */}
      <Box
        role="tabpanel"
        hidden={selectedTab !== 1}
        id={`tabpanel-2`}
        aria-labelledby={`tab-2`}
        style={{ height: 400, width: "100%" }}
      >
        {selectedTab === 1 && (
          <DataGrid
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            checkboxSelection={false}
            rows={notificationData}
            columns={notificationColumns(handleNotificationChange)}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            getRowId={(row) => row["id"]}
          />
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "1em",
          width: "100%",
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
  );
}
