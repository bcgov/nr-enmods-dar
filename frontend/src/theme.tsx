import { createTheme } from '@mui/material/styles'

// A custom theme for this app
const theme = createTheme({
  palette: {
    primary: {
      main: '#0B5394',
    },
    secondary: {
      main: '#6c757d',
    },
    error: {
      main: '#712024',
    },
    warning: {
      main: '#81692c',
    },
    success: {
      main: '#234720',
    },
  },
})

export default theme
