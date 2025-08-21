import { requestAccess } from "@/common/notifications";
import { Box, Button, Container, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useNavigate } from "react-router";
import { jwtDecode } from "~/jwt-decode/build/esm";

export default function RequestAccess() {
  const navigate = useNavigate();
  const buttonClicked = async () => {
    navigate("/", { state: { data: undefined } }); // reset the state
    let authToken: string | null = localStorage.getItem("__auth_token");
    let decodedToken = jwtDecode(authToken == null ? "" : authToken)
    const email = decodedToken?.email
    const accountType = decodedToken?.identity_provider === 'idir' ? 'IDIR' : 'BCeID'
    const fullname = decodedToken?.display_name
    const username = accountType === "BCeID" ? decodedToken?.bceid_username : decodedToken?.idir_username
    
    await requestAccess(email, accountType, fullname, username)
  };
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Container maxWidth="md">
        <Grid>
          <Typography variant="h2">You don't have permission to view this page.</Typography>
          <Button
            name="homeBtn"
            id="homeBtn"
            onClick={() => buttonClicked()}
            variant="contained"
          >
            Request Access
          </Button>
        </Grid>
      </Container>
    </Box>
  );
}
