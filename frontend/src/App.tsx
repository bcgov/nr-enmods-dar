import Box from '@mui/material/Box'
import Header from '@/components/Header'
// import Footer from '@/components/Footer'
import AppRoutes from '@/routes'
import { BrowserRouter } from 'react-router-dom'
import Sidebar from './components/Sidebar'

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  contentWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    // bgcolor: '#efefff',
    width: '100%',
  },
  content: {
    display: 'flex',
    width: '1200px',
    bgcolor: '#ffffff',
  },
  sidebar: {
    paddingTop: '8em',
    paddingLeft: '2em',
    // width: '28%',
    width: '20%',
    // bgcolor: '#efefff',
  },
  mainContent: {
    marginTop: '8em',
    width: '70%',
  },
  separator: {
    width: '1px',
    bgcolor: 'rgb(217, 217, 217)',
    minHeight: '100vh',
  },
}

export default function App() {
  return (
    <BrowserRouter>
      <Box sx={styles.container}>
        <Header />
        <Box sx={styles.contentWrapper}>
          <Box sx={styles.content}>
            <Box sx={styles.sidebar}>
              <Sidebar />
            </Box>
            <Box sx={styles.separator} />
            <Box sx={styles.mainContent}>
              <AppRoutes />
            </Box>
          </Box>
        </Box>
        {/* <Footer /> */}
      </Box>
    </BrowserRouter>
  )
}
