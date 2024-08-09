import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { unsubscribeNotifications } from '@/common/notifications'
import { Box } from '@mui/system'
import { Toolbar, Typography } from '@mui/material'
import BCGovLogo from '@/assets/BCID_H_rgb_pos.png'

export default function Unsubscribe() {
  const { uuid } = useParams<{ uuid: string }>()
  const [status, setStatus] = useState('Processing...')

  const styles = {
    innerContent: {
      maxWidth: '1200px',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
    },
  }

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
    <>
      <Box sx={styles.innerContent}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <img style={{ maxHeight: '60px' }} alt="Logo" src={BCGovLogo} />
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, paddingLeft: '20px' }}
          >
            ENMODS Unsubscribe
          </Typography>{' '}
        </Toolbar>
        <Box sx={{ marginLeft: '50px', marginTop: '20px' }}>{status}</Box>
      </Box>
    </>
  )
}
