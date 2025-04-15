import { AppBar, Box, Button, ButtonGroup, Toolbar } from "@mui/material";
import Typography from "@mui/material/Typography";
import { color, height, margin, maxHeight } from "~/@mui/system";

const styles = {
  appBar: {
    flexShrink: 0,
    top: "auto",
    bottom: 0,
    color: "#ffffff",
    backgroundColor: "#003366",
    display: "flex",
    zIndex: (theme: any) => theme.zIndex.drawer + 1,
  },
  toolbar: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "40px",
  },
  footerButton: {
    margin: "2px",
    padding: "1px",
  },
  separator: {
    height: "2px",
    backgroundColor: "#fcba19",
    width: "100%",
  },
};
export default function Footer() {
  return (
    <AppBar position="fixed" sx={styles.appBar}>
      <Box sx={styles.separator} />
      <Box sx={styles.toolbar}>
        <ButtonGroup
          variant="text"
          aria-label="Basic button group"
          size="small"
          sx={{
            "& .MuiButton-root": {
              border: "none",
              color: "white",
              fontSize: "0.7em",
            },
            "& .MuiButton-root:not(:last-child)": {
              borderRight: "1px solid #ffffff",
              paddingRight: "4px",
            },
          }}
        >
          <Button
            sx={{ color: "#ffffff" }}
            id="footer-home"
            target="_blank"
            href="https://www.gov.bc.ca/"
          >
            Home
          </Button>
          <Button
            sx={{ color: "#ffffff" }}
            id="footer-about"
            target="_blank"
            href="https://www2.gov.bc.ca/gov/content/about-gov-bc-ca"
          >
            About this site
          </Button>
          <Button
            sx={{ color: "#ffffff" }}
            id="footer-disclaimer"
            target="_blank"
            href="https://gov.bc.ca/disclaimer"
          >
            Disclaimer
          </Button>
          <Button
            sx={{ color: "#ffffff" }}
            id="footer-privacy"
            target="_blank"
            href="https://gov.bc.ca/privacy"
          >
            Privacy
          </Button>
          <Button
            sx={{ color: "#ffffff" }}
            id="footer-accessibility"
            target="_blank"
            href="https://gov.bc.ca/webaccessibility"
          >
            Accessibility
          </Button>
          <Button
            sx={{ color: "#ffffff" }}
            id="footer-copyright"
            target="_blank"
            href="https://gov.bc.ca/copyright"
          >
            Copyright
          </Button>
          <Button
            sx={{ color: "#ffffff" }}
            id="footer-contact"
            target="_blank"
            href="https://www2.gov.bc.ca/gov/content/home/contact-us"
          >
            Contact Us
          </Button>
        </ButtonGroup>
        <Typography sx={{ paddingLeft: "60%" }} fontSize="0.7em">Version 0.0.1</Typography>
      </Box>
    </AppBar>
  );
}
