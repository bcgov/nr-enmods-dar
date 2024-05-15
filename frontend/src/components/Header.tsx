import BCGovLogo from '@/assets/BCID_H_rgb_pos.png'
import { AppBar, IconButton, Toolbar, Box } from '@mui/material'
import Typography from '@mui/material/Typography'
import { HomeRounded } from '@mui/icons-material'
import Navbar from './Navbar'

const styles = {
  appBar: {
    color: '#ffffff',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid rgb(217, 217, 217)',
    display: 'flex',
    zIndex: (theme: any) => theme.zIndex.drawer + 1,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContent: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
  },
  footerButton: {
    margin: '0.2em',
    padding: '0.2em',
    color: '#ffffff',
    backgroundColor: '#ffffff',
  },
  separator: {
    height: '1px',
    backgroundColor: 'rgb(217, 217, 217)',
    width: '100%',
  },
  navToolbar: {
    minHeight: '40px !important',
    justifyContent: 'space-between',
    width: '100%',
  },
}
export default function Header() {
  return (
    <AppBar position="fixed" sx={styles.appBar} elevation={0}>
      <Box sx={styles.innerContent}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <img style={{ maxHeight: '60px' }} alt="Logo" src={BCGovLogo} />
          <Typography>Quickstart OpenShift</Typography>
          <a href={'/'} target={'_self'}>
            <IconButton color="secondary">
              <HomeRounded color="secondary"></HomeRounded>
            </IconButton>
          </a>
        </Toolbar>
      </Box>
      <Box sx={styles.separator} />
      <Box sx={styles.innerContent}>
        <Toolbar sx={styles.navToolbar}>
          <Navbar />
        </Toolbar>
      </Box>
    </AppBar>
  )
}
