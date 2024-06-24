import { ChangeEvent, useState } from 'react'
import {
  Modal,
  Button,
  TextField,
  FormControl,
  Alert,
  CircularProgress,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { removeRoles } from '@/common/admin'
import { UserInfo } from '@/types/types'
import theme from '@/theme'

// Currently unused modal

type RemoveRolesProps = {
  show: boolean
  onHide: () => void
  userObject: UserInfo | null
}

const RemoveRoles = ({ show, onHide, userObject }: RemoveRolesProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [rolesToRemove, setRolesToRemove] = useState<string[]>([])

  const removeRolesHandler = async () => {
    if (userObject) {
      setShowError(false)
      setLoading(true)
      try {
        await removeRoles(userObject?.idirUsername, rolesToRemove)
      } catch (err) {
        setError('Failed to remove role from user.')
        setShowError(true)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRoleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    if (checked) {
      setRolesToRemove([...rolesToRemove, name])
    } else {
      setRolesToRemove(rolesToRemove.filter((role) => role !== name))
    }
  }

  const handleOnHide = () => {
    setRolesToRemove([])
    onHide()
  }

  return (
    <Modal
      open={show}
      onClose={handleOnHide}
      aria-labelledby="remove-roles-modal"
      aria-describedby="remove-roles-modal-description"
    >
      <div
        style={{
          position: 'absolute',
          width: 400,
          minHeight: 600,
          backgroundColor: 'white',
          border: '2px solid #000',
          boxShadow: theme.shadows[5],
          padding: theme.spacing(2, 4, 3),
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <h2 id="simple-modal-title">Remove Roles</h2>
        <TextField
          id="searchFirstName"
          label="First Name"
          value={userObject?.firstName || ''}
          fullWidth
          margin="normal"
          sx={{
            marginBottom: 1,
          }}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
          color="info"
        />
        <TextField
          id="searchLastName"
          label="Last Name"
          value={userObject?.lastName || ''}
          fullWidth
          margin="normal"
          sx={{
            marginBottom: 1,
          }}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
          color="info"
        />
        <TextField
          id="searchUsername"
          label="Username"
          value={userObject?.username ?? ''}
          fullWidth
          margin="normal"
          sx={{
            marginBottom: 1,
          }}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
          color="info"
        />
        <p>Please select the roles to be removed.</p>
        <FormControl fullWidth>
          <FormLabel component="legend" color="primary" sx={{ marginTop: 1 }}>
            Current Roles
          </FormLabel>
          <FormGroup>
            {userObject?.role?.map((role) => (
              <FormControlLabel
                key={role}
                control={
                  <Checkbox
                    checked={rolesToRemove.includes(role)}
                    onChange={handleRoleChange}
                    name={role}
                    disabled={loading || !userObject}
                    color="primary"
                  />
                }
                label={role}
              />
            ))}
          </FormGroup>
        </FormControl>

        {showError && <Alert severity="error">{error}</Alert>}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: 'auto',
          }}
        >
          <Button
            onClick={handleOnHide}
            color="secondary"
            sx={{ marginRight: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={removeRolesHandler}
            disabled={loading || !userObject}
          >
            {loading ? <CircularProgress size={24} /> : 'Remove Roles'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default RemoveRoles
