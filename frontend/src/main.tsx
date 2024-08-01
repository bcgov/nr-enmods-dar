import * as ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@emotion/react'
import { CssBaseline } from '@mui/material'
import theme from './theme'
import App from './App'
import UserService from './service/user-service'

const onAuthenticatedCallback = () => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>,
  )
}

UserService.initKeycloak(onAuthenticatedCallback)
