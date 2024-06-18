import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  Modal,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { FileUploader } from 'react-drag-drop-files'
import {
  DeleteRounded,
  UploadFile,
  CheckCircle,
  Error,
  ExpandMore,
  ChevronRight,
  Title,
} from '@mui/icons-material'
import '@/index.css'
import { jwtDecode } from 'jwt-decode'
import { getFile, insertFile, validationRequest } from '@/common/manage-files'
import UserService from '@/service/user-service'

const fileTypes = ['xlsx', 'csv', 'txt']
let selectedFiles: any[] = []
const validate = false
const submit = false

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
}

function FileUpload() {
  const [files, setFiles] = useState(null)
  const [fileStatusCodes, setFileStatusCodes] = useState(null)

  const [open, setOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const handleOpen = (index) => {
    setCurrentItem(selectedFiles[index])
    setOpen(true)
  }
  const handleClose = () => {
    setOpen(false)
    setCurrentItem(null)
  }

  const handleFileSelect = (files) => {
    setFiles(files)
    selectedFiles = Array.from(files)

    checkedItems.items = selectedFiles.map((index) => true)
    setFileStatusCodes(selectedFiles.map(() => null))
  }

  const deleteFile = (file) => {
    const index = selectedFiles.indexOf(file)
    selectedFiles.splice(index, 1)
    checkedItems.items.splice(index, 1)
    setOpen(false)
  }

  const validateFile = async (file, index: number) => {
    if (file) {
      const formData = new FormData()
      var JWT = jwtDecode(UserService.getToken()?.toString())
      formData.append('file', file)
      formData.append('userID', JWT.idir_username) // TODO: This will need to be updated based on BCeID
      formData.append('orgGUID', JWT.idir_user_guid) // TODO: This will need to be updated based on BCeID and company GUID

      await insertFile(formData).then((response) => {
        setFileStatusCodes(() => {
          const newStatusCodes = [...fileStatusCodes]
          newStatusCodes[index] = response.submission_status_code
          return newStatusCodes
        })

        validationRequest(response.submission_id)
      })
    }
  }

  const validateAllFiles = (files) => {
    if (files) {
      Object.entries(files).forEach(([key, value], index) => {
        const formData = new FormData()
        var JWT = jwtDecode(UserService.getToken()?.toString())
        formData.append('file', value)
        formData.append('userID', JWT.idir_username) // TODO: This will need to be updated based on BCeID
        formData.append('orgGUID', JWT.idir_user_guid) // TODO: This will need to be updated based on BCeID and company GUID

        insertFile(formData).then((response) => {
          setFileStatusCodes(() => {
            const newStatusCodes = [...fileStatusCodes]
            newStatusCodes[index] = response.submission_status_code
            return newStatusCodes
          })
        })
      })
    }
  }

  const submitFile = (file, index: number) => {
    confirm('Submission for one file \n TODO')
  }

  const submitAllFiles = (files) => {
    confirm('Submission for all files \n TODO')
  }

  const [expandList, setExpandList] = useState(true)
  const handleExpandList = () => {
    setExpandList(!expandList)
  }

  const [checkedItems, setCheckedItems] = useState({
    master: true,
    items: [],
  })

  const handleMasterCheckboxChange = (event) => {
    const isChecked = event.target.checked
    setCheckedItems({
      master: isChecked,
      items: checkedItems.items.map(() => isChecked),
    })
  }

  const handleCheckboxChange = (index) => (event) => {
    const newItems = [...checkedItems.items]
    newItems[index] = event.target.checked
    setCheckedItems({
      master: newItems.every((item) => item),
      items: newItems,
    })
  }

  const fileSizeError = () => {
    confirm('File size error \n TODO')
  }

  return (
    <div style={{ marginLeft: '4em', width: '100%' }}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Electronic Data Transfer - Upload
        </Typography>
        <Typography variant="h6" component="h2" gutterBottom>
          This screen allows an authorized user to upload EMS samples and
          results.
        </Typography>
      </Box>
      <div>
        <FileUploader
          classes="custom-file-upload"
          fileOrFiles
          multiple={true}
          types={fileTypes}
          handleChange={handleFileSelect}
          name="file"
          hoverTitle="Click to browse for files to upload"
          maxSize={10}
          onSizeError={fileSizeError}
          children={
            <label className="upload-container">
              <div className="upload-children">
                <span>
                  <UploadFile width="32" height="32" fontSize="large" />
                </span>
                <span style={{ fontSize: 30 }}>
                  Upload or drop files right here
                </span>
                <div style={{ fontSize: 15, textAlign: 'center' }}>
                  Accepted file types: .xlsx, .csv, .txt
                </div>
              </div>
            </label>
          }
        />
      </div>

      <div className="file-drop-list">
        <Grid container>
          <Grid item xs={6}>
            <Button sx={{ color: 'black' }} onClick={handleExpandList}>
              {expandList ? <ExpandMore /> : <ChevronRight />}
              {selectedFiles.length > 0 && selectedFiles.length <= 10 ? (
                <label>{selectedFiles.length + ' files selected'}</label>
              ) : selectedFiles.length > 10 ? (
                <label>
                  {'Cannot select more than 10 files. ' +
                    selectedFiles.length +
                    ' files selected'}
                </label>
              ) : (
                <label>{'0 files selected'}</label>
              )}
            </Button>
          </Grid>

          {expandList &&
          selectedFiles.length > 0 &&
          selectedFiles.length <= 10 ? (
            <Grid item xs={6}>
              <FormControlLabel
                sx={{ float: 'right' }}
                value="end"
                control={
                  <Checkbox
                    checked={checkedItems.master}
                    onChange={handleMasterCheckboxChange}
                    color="secondary"
                  />
                }
                label="Select All"
                labelPlacement="end"
                className={'selectAllEmailCheckbox'}
              />
            </Grid>
          ) : (
            ''
          )}
        </Grid>

        {expandList && (
          <div className="file-list">
            <List>
              {selectedFiles.length > 0 && selectedFiles.length <= 10
                ? selectedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <Grid container>
                        <Grid item xs={5}>
                          <ListItemText
                            key="test1"
                            primary={file.name}
                            secondary={
                              (file.size / (1024 * 1024)).toFixed(2) + 'MB'
                            }
                          ></ListItemText>
                        </Grid>
                        <Grid item xs={3}>
                          <ButtonGroup
                            sx={{ float: 'right', paddingTop: '10px' }}
                          >
                            {fileStatusCodes[index] == 'ACCEPTED' ? (
                              <Button style={{ color: 'green' }}>
                                <CheckCircle />
                              </Button>
                            ) : fileStatusCodes[index] == 'REJECTED' ? (
                              <Button style={{ color: 'orange' }}>
                                <Error />
                              </Button>
                            ) : fileStatusCodes[index] == 'INPROGRESS' ? (
                              <Button style={{ color: 'orange' }}>
                                <CircularProgress color="secondary" />
                              </Button>
                            ) : (
                              ''
                            )}

                            <Button
                              style={{ color: 'black' }}
                              onClick={() => {
                                handleOpen(index)
                              }}
                            >
                              <DeleteRounded />
                            </Button>
                          </ButtonGroup>
                        </Grid>
                        <Grid item xs={4}>
                          <FormControlLabel
                            sx={{ float: 'right', paddingTop: '10px' }}
                            control={
                              <Checkbox
                                color="secondary"
                                checked={checkedItems.items[index]}
                                onChange={handleCheckboxChange(index)}
                              />
                            }
                            label="Receive Email Conformation"
                            labelPlacement="end"
                            className={`emailCheckbox emailCheckbox-` + index}
                          />
                        </Grid>
                        <Grid item xs={9}>
                          <Box>
                            {fileStatusCodes[index] == 'ACCEPTED' ? (
                              <Typography>ACCEPTED</Typography>
                            ) : fileStatusCodes[index] == 'REJECTED' ? (
                              <Typography>REJECTED</Typography>
                            ) : fileStatusCodes[index] == 'INPROGRESS' ? (
                              <Typography>IN PROGRESS</Typography>
                            ) : fileStatusCodes[index] == 'SUBMITTED' ? (
                              <Typography>SUBMITTED</Typography>
                            ) : (
                              ''
                            )}
                          </Box>
                        </Grid>
                        <Grid item xs={3}>
                          <ButtonGroup
                            variant="text"
                            style={{
                              color: 'black',
                              float: 'right',
                              paddingBottom: '10px',
                            }}
                          >
                            <Button
                              variant="contained"
                              color="secondary"
                              onClick={() => {
                                validateFile(file, index)
                              }}
                            >
                              Validate
                            </Button>
                            <Button
                              variant="contained"
                              color="secondary"
                              onClick={() => {
                                submitFile(file, index)
                              }}
                            >
                              Submit
                            </Button>
                          </ButtonGroup>
                        </Grid>

                        <Grid item xs={12}>
                          <Divider variant="fullWidth" />
                        </Grid>
                      </Grid>
                    </ListItem>
                  ))
                : ''}
            </List>

            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>Delete File </DialogTitle>
              <DialogContent sx={{ paddingTop: '24px' }}>
                <Typography>
                  Are you sure you want to delete{' '}
                  {currentItem ? currentItem.name : ''}
                </Typography>
              </DialogContent>
              <DialogActions sx={{ paddingBottom: '24px' }}>
                <Button
                  onClick={handleClose}
                  variant="contained"
                  color="primary"
                  sx={{
                    backgroundColor: 'gray',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'darkgray',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="secondary"
                  onClick={() => deleteFile(currentItem)}
                  variant="contained"
                  autoFocus
                >
                  Confirm
                </Button>
              </DialogActions>
            </Dialog>

            <div className="all-file-action">
              <Box sx={{ paddingTop: '20px' }}>
                {files && selectedFiles.length > 0 ? (
                  <ButtonGroup variant="text" style={{ color: 'black' }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => {
                        validateAllFiles(files)
                      }}
                    >
                      Validate All
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => {
                        submitAllFiles(files)
                      }}
                    >
                      Submit All
                    </Button>
                  </ButtonGroup>
                ) : (
                  ''
                )}
              </Box>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileUpload
