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
} from '@mui/icons-material'
import '@/index.css'
import { insertFile } from '@/common/manage-files'

const fileTypes = ['xlsx', 'csv', 'txt']
let selectedFiles: any[] = []
let validationSuccess = {}
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
  }

  const deleteFile = (file) => {
    const index = selectedFiles.indexOf(file)
    selectedFiles.splice(index, 1)
    checkedItems.items.splice(index, 1)
    setOpen(false)
  }

  const validateFile = async (file, index: number) => {
    await insertFile(file)
  }

  const validateAllFiles = (files) => {
    confirm('Validation for all files \n TODO')
  }

  const submitFile = (file, index: number) => {
    confirm('Submission for one file \n TODO')
  }

  const submitAllFiles = (files) => {
    confirm('Submission for all files \n TODO')
  }

  const [expandList, setExpandList] = useState(false)
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
    <div>
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
                            {validationSuccess ? (
                              <Button style={{ color: 'green' }}>
                                <CheckCircle />
                              </Button>
                            ) : (
                              <Button style={{ color: 'orange' }}>
                                <Error />
                              </Button>
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
                            {/* TODO */}
                            {validate ? (
                              <Typography>Validating</Typography>
                            ) : submit ? (
                              <Typography>Submitting</Typography>
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

            <Modal
              open={open}
              onClose={handleClose}
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
            >
              <Box sx={modalStyle}>
                <Typography id="modal-description" sx={{ mt: 2 }}>
                  Are you sure you want to delete{' '}
                  {currentItem ? currentItem.name : ''}`?
                </Typography>
                <Box
                  sx={{
                    mt: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => deleteFile(currentItem)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleClose}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Modal>

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
