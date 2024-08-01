import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { unsubscribeNotifications } from '@/common/options'
import { Box } from '@mui/system'

export default function Unsubscribe() {
  const { uuid } = useParams<{ uuid: string }>()
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    const unsubscribe = async () => {
      try {
        if (uuid) {
          await unsubscribeNotifications(uuid)
          setStatus('You have been successfully unsubscribed.')
        }
      } catch (error) {
        setStatus('An error occurred. Please try again later.')
      }
    }
    unsubscribe()
  }, [uuid])

  return (
    <Box sx={{ padding: '20px' }}>
      <h1>ENMODS Notifications</h1>
      <p>{status}</p>
    </Box>
  )
}
