import { Alert, Button, Checkbox, FormControlLabel } from '@mui/material'
import { useEffect, useState } from 'react'
import { testEmail, updateNotification } from '@/common/options'
import UserService from '@/service/user-service'
import { jwtDecode } from 'jwt-decode'
import { getNotificationStatus } from '@/common/options'
import CheckIcon from '@mui/icons-material/Check'
import { Box } from '@mui/system'

export default function OptionsPage() {
  const [user, setUser] = useState<{ email: string; username: string }>({
    email: '',
    username: '',
  })
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false)

  useEffect(() => {
    console.log('getting user token')
    const token = UserService.getToken()
    if (token) {
      const JWT: any = jwtDecode(token)
      console.log(JWT)
      setUser({ email: JWT.email, username: JWT.idir_username })
    } else {
      console.log('User token is undefined')
    }
  }, [])

  useEffect(() => {
    const fetchNotificationStatus = async () => {
      const notificationsStatus = await getNotificationStatus(
        user.email,
        user.username,
      )
      setNotificationsEnabled(notificationsStatus)
    }

    if (user.email != '' && user.username != '') {
      fetchNotificationStatus()
    }
  }, [user])

  const testEmailHandler = async () => {
    console.log(user)
    console.log(notificationsEnabled)
    await testEmail()
  }

  const updateNotificationHandler = async () => {
    try {
      await updateNotification(user.email, user.username, notificationsEnabled)
      setSuccessMessage(
        `Notifications ${notificationsEnabled ? 'Enabled' : 'Disabled'}`,
      )
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    } catch (error) {
      console.error('Error updating notification status:', error)
    }
  }

  return (
    <div
      style={{
        minHeight: '45em',
        maxHeight: '45em',
        width: '100%',
        marginLeft: '4em',
      }}
    >
      <Box sx={{ border: 1, borderColor: 'grey.300', p: 2, mb: 2 }}>
        <Button onClick={testEmailHandler} variant="contained" color="primary">
          Test Email
        </Button>
      </Box>
      <Box sx={{ border: 1, borderColor: 'grey.300', p: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={notificationsEnabled || false}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              disabled={user.email === ''}
            />
          }
          label="Email Notifications"
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <Button
          onClick={updateNotificationHandler}
          variant="contained"
          color="primary"
          disabled={user.email === ''}
        >
          Save
        </Button>
      </Box>
      {showSuccessMessage && (
        <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
          {successMessage}
        </Alert>
      )}
    </div>
  )
}
