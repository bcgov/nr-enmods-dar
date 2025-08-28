import { requestAccess } from "@/common/notifications";
import { Alert, Box, Button, Container, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { jwtDecode } from "~/jwt-decode/build/esm";
import CheckIcon from "@mui/icons-material/Check";

export default function RequestAccess() {
  const [isDisabled, setIsDisabled] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const navigate = useNavigate();
  const buttonClicked = async () => {
    setIsDisabled(true);
    let authToken: string | null = localStorage.getItem("__auth_token");
    let decodedToken = jwtDecode(authToken == null ? "" : authToken);
    const email = decodedToken?.email;
    const accountType =
      decodedToken?.identity_provider === "idir" ? "IDIR" : "BCeID";
    const fullname = decodedToken?.display_name;
    const username =
      accountType === "BCeID"
        ? decodedToken?.bceid_username
        : decodedToken?.idir_username;

    let edtURL = window.location.href    

    const response = await requestAccess(
      email,
      accountType,
      fullname,
      username,
      edtURL,
    );

    if (response === "Email Sent") {
      setIsSent(true);
      setIsFailed(false);
    } else {
      setIsFailed(true);
      setIsSent(false);
    }
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
          <Typography variant="h2">
            You don't have permission to view this page.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
            <Button
              name="homeBtn"
              id="homeBtn"
              onClick={() => buttonClicked()}
              variant="contained"
              disabled={isDisabled}
            >
              Request Access
            </Button>
            {isSent && (
              <Alert 
                severity="success" 
                square
                sx={{ 
                  border: 'none',
                  boxShadow: 'none',
                  '& .MuiAlert-outlined': {
                    border: 'none'
                  }
                }}
              >
                Email sent successfully.
              </Alert>
            )}
            {isFailed && (
              <Alert 
                severity="error" 
                square
                sx={{ 
                  border: 'none',
                  boxShadow: 'none',
                  '& .MuiAlert-outlined': {
                    border: 'none'
                  }
                }}
              >
               Failed to send email.
              </Alert>
            )}
          </Box>
        </Grid>
      </Container>
    </Box>
  );
}
