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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import React, { useState } from 'react'
import { FileUploader } from 'react-drag-drop-files'
import {
  DeleteRounded,
  UploadFile,
  CheckCircle,
  Error,
  ExpandMore,
  ChevronRight,
} from '@mui/icons-material'
import '@/index.css'
import { jwtDecode } from 'jwt-decode'
import { getFiles, insertFile, validationRequest } from '@/common/manage-files'
import UserService from '@/service/user-service'

const fileTypes = ['xlsx', 'csv', 'txt']
let selectedFiles: any[] = []

function FileUpload() {
  const [files, setFiles] = useState(null)
  const [fileStatusCodes, setFileStatusCodes] = useState({
    items: [],
  })

  const [open, setOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const handleOpen = (index: number) => {
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
    fileStatusCodes.items = selectedFiles.map((index) => null)
  }

  const deleteFile = (file: string | Blob) => {
    const index = selectedFiles.indexOf(file)
    selectedFiles.splice(index, 1)
    checkedItems.items.splice(index, 1)
    fileStatusCodes.items.splice(index, 1)
    setOpen(false)
  }

  const validateFile = async (file: string | Blob, index: number) => {
    if (file) {
      const formData = new FormData()
      var JWT = jwtDecode(UserService.getToken()?.toString())
      formData.append('file', file)
      formData.append('userID', JWT.idir_username) // TODO: This will need to be updated based on BCeID
      formData.append('orgGUID', JWT.idir_user_guid) // TODO: This will need to be updated based on BCeID and company GUID

      await insertFile(formData).then((response) => {
        console.log(response)
        const newStatusCodes = fileStatusCodes.items
        newStatusCodes[index] = response.submission_status_code
        console.log(newStatusCodes)
        setFileStatusCodes({
          items: newStatusCodes,
        })

        getFiles("1");
        // validationRequest(response.submission_id)
      })
    }
  }

  const validateAllFiles = (files) => {
    if (files) {
      Object.entries(files).forEach(async ([key, value], index) => {
        const formData = new FormData()
        var JWT = jwtDecode(UserService.getToken()?.toString())
        formData.append('file', value)
        formData.append('userID', JWT.idir_username) // TODO: This will need to be updated based on BCeID
        formData.append('orgGUID', JWT.idir_user_guid) // TODO: This will need to be updated based on BCeID and company GUID

        await insertFile(formData).then(async (response) => {
          console.log(response)
          console.log(fileStatusCodes.items)
          const newStatusCodes = fileStatusCodes.items
          newStatusCodes[index] = response.submission_status_code
          setFileStatusCodes({
            items: newStatusCodes,
          })
          const results = await getFiles("1");
          console.log(results)
        })
      })
    }
  }

  const submitFile = (file: any, index: number) => {
    confirm('Submission for one file \n TODO')
  }

  const submitAllFiles = (files: any) => {
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

  const handleMasterCheckboxChange = (event: { target: { checked: any } }) => {
    const isChecked = event.target.checked
    setCheckedItems({
      master: isChecked,
      items: checkedItems.items.map(() => isChecked),
    })
  }

  const handleCheckboxChange =
    (index: number) => (event: { target: { checked: any } }) => {
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
      <Box sx={{ width: '1200px' }}>
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
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
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
                            {fileStatusCodes.items[index] == 'ACCEPTED' ? (
                              <Button style={{ color: 'green' }}>
                                <CheckCircle />
                              </Button>
                            ) : fileStatusCodes.items[index] == 'REJECTED' ? (
                              <Button style={{ color: 'orange' }}>
                                <Error />
                              </Button>
                            ) : fileStatusCodes.items[index] == 'INPROGRESS' ? (
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
                            {fileStatusCodes.items[index] == 'ACCEPTED' ? (
                              <Typography>ACCEPTED</Typography>
                            ) : fileStatusCodes.items[index] == 'REJECTED' ? (
                              <Typography>REJECTED</Typography>
                            ) : fileStatusCodes.items[index] == 'INPROGRESS' ? (
                              <Typography>IN PROGRESS</Typography>
                            ) : fileStatusCodes.items[index] == 'SUBMITTED' ? (
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
