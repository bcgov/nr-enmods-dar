import Box from '@mui/material/Box'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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

    width: '100%',
  },
  content: {
    display: 'flex',
    width: '1200px',
  },
  sidebar: {
    marginTop: '8em',
    width: '28%',
  },
  mainContent: {
    marginTop: '8em',
    width: '70%',
  },
  separator: {
    width: '1px',
    bgcolor: 'rgb(217, 217, 217)',
  },
}

export default function App() {
  return (
    <Box sx={styles.container}>
      <Header />
      <BrowserRouter>
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
      </BrowserRouter>
      <Footer />
    </Box>
  )
}
