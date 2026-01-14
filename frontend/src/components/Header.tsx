import BCGovLogo from "@/assets/gov-bc-logo-horiz.png";
import {
  AppBar,
  IconButton,
  Toolbar,
  Box,
  Typography,
  Button,
} from "@mui/material";
// import Typography from '@mui/material/Typography'
import { HomeRounded } from "@mui/icons-material";
import Navbar from "./Navbar";
import UserService from "@/service/user-service";
import { borderBottom, color, maxHeight } from "~/@mui/system";

const styles = {
  toolbar: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  innerContent: {
    maxWidth: "1800px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
  },
  footerButton: {
    margin: "0.2em",
    padding: "0.2em",
    color: "#ffffff",
    backgroundColor: "#ffffff",
  },
  separator: {
    height: "2px",
    backgroundColor: "#fcba19",
    width: "100%",
  },
  navToolbar: {
    minHeight: "40px !important",
    justifyContent: "space-between",
    width: "100%",
    maxHeight: "40px",
    backgroundColor: "#38598a",
    borderBottom: "px solid rgba(0, 0, 0, 0.1)",
  },
};
export default function Header() {
  return (
    <AppBar position="fixed" elevation={0} className="nav-header">
      <Box sx={{ bgcolor: "#003366" }}>
        <Toolbar sx={{ maxHeight: "10px", display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
            <img
              style={{ maxHeight: "60px", paddingLeft: "20%" }}
              alt="Logo"
              src={BCGovLogo}
            />
            <h1 style={{ paddingLeft: "2%" }}>Electronic Data Transfer</h1>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ minWidth: 120, textAlign: "right" }}>
              Welcome {UserService.getUsername()}
            </Box>
            <Button
              onClick={() => UserService.doLogout()}
              sx={{
                color: "#fff",
                border: "2px solid #003366",
                borderRadius: 1,
                borderColor: "#fff",
                fontWeight: 600,
                marginLeft: 2,
                "&:hover": {
                  backgroundColor: "#fff",
                  color: "#003366",
                  textDecoration: "underline",
                },
              }}
            >
              Log out
            </Button>
          </Box>
        </Toolbar>
      </Box>
      <Box sx={styles.separator} />
      <Box sx={{ bgcolor: "#003366" }}>
        <Toolbar sx={styles.navToolbar}>
          <Navbar />
        </Toolbar>
      </Box>
    </AppBar>
  );
}
