import { ChangeEvent, useEffect, useState } from 'react'
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
import { UserInfo } from '@/types/types'
import Roles from '@/roles'
import theme from '@/theme'
import { updateRoles } from '@/common/admin'

type EditRolesProps = {
  show: boolean
  userObject: UserInfo | null
  refreshTable: () => void
  onHide: () => void
}

const EditRoles = ({
  show,
  userObject,
  refreshTable,
  onHide,
}: EditRolesProps) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [updatedRoles, setUpdatedRoles] = useState<string[]>([])

  const updateRolesHandler = async () => {
    if (userObject) {
      setShowError(false)
      setLoading(true)
      try {
        console.log(userObject.idirUsername)
        await updateRoles(
          userObject.idirUsername,
          userObject.role,
          updatedRoles,
        )
        refreshTable()
      } catch (err) {
        setError('Failed to add role to user.')
        setShowError(true)
      } finally {
        setLoading(false)
        onHide()
      }
    }
  }

  useEffect(() => {
    setUpdatedRoles(userObject ? userObject.role : [])
  }, [userObject])

  const handleRoleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    if (checked) {
      setUpdatedRoles([...updatedRoles, name])
    } else {
      setUpdatedRoles(updatedRoles.filter((role) => role !== name))
    }
  }

  return (
    <Modal
      open={show}
      onClose={onHide}
      aria-labelledby="add-roles-modal"
      aria-describedby="add-roles-modal-description"
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
        <h2 id="simple-modal-title">Edit Roles</h2>
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
          value={userObject?.username || ''}
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
        <FormControl fullWidth>
          <FormLabel component="legend" color="primary" sx={{ marginTop: 1 }}>
            Roles
          </FormLabel>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={updatedRoles.includes(Roles.ENMODS_USER)}
                  onChange={handleRoleChange}
                  name={Roles.ENMODS_USER}
                  disabled={loading || !userObject}
                  color="primary"
                />
              }
              label={Roles.ENMODS_USER}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={updatedRoles.includes(Roles.ENMODS_ADMIN)}
                  onChange={handleRoleChange}
                  name={Roles.ENMODS_ADMIN}
                  disabled={loading || !userObject}
                  color="primary"
                />
              }
              label={Roles.ENMODS_ADMIN}
            />
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
          <Button id='cancelButton' onClick={onHide} color="secondary" sx={{ marginRight: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={updateRolesHandler}
            disabled={loading || !userObject}
            style={{ marginLeft: '8px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Update Roles'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EditRoles
