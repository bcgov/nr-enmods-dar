import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Typography,
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

const fileTypes = ['xlsx', 'csv', 'txt']
let selectedFiles: any[] = []
let validationSuccess = {}

function FileUpload() {
  const [files, setFiles] = useState(null)

  const handleChange = (files, index) => {
    setFiles(files)
    selectedFiles = Array.from(files)

    if (index != undefined) {
      selectedFiles.splice(index, 1)
      files = selectedFiles

      setFiles(files)
      selectedFiles = Array.from(files)
    } else {
      files = null
    }
  }

  const validateFile = (file, index: number) => {
    console.log(file)
  }

  const validateAllFiles = (files) => {
    console.log(files)
  }

  const [expandList, setExpandList] = useState(false)
  const handleExpandList = () => {
    setExpandList(!expandList)
  }

  const toggleCheckBoxes = () => {}

  return (
    <div>
      <div>
        <FileUploader
          classes="custom-file-upload"
          fileOrFiles
          multiple={true}
          types={fileTypes}
          handleChange={handleChange}
          name="file"
          hoverTitle="Click to browse for files to upload"
          children={
            <label className="upload-container">
              {/* <input className="file-input" accept=".xlsx, .csv, .txt" type="file" multiple></input> */}
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
              <label>{selectedFiles.length + ' files selected'}</label>
            </Button>
          </Grid>

          {expandList ? (
            <Grid item xs={6}>
              <FormControlLabel
                sx={{ float: 'right' }}
                onClick={toggleCheckBoxes}
                value="end"
                control={<Checkbox color="secondary" />}
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
              {files && selectedFiles.length > 0
                ? selectedFiles.map((file, index) => (
                    <>
                      <Box id={'file-' + index}>
                        <Grid container>
                          <Grid item xs={5}>
                            <ListItem key={index}>
                              <ListItemText
                                key={index}
                                primary={file.name}
                                secondary={
                                  (file.size / (1024 * 1024)).toFixed(2) + 'MB'
                                }
                              />
                            </ListItem>
                          </Grid>

                          <Grid item xs={3}>
                            <div
                              style={{
                                width: 'max-content',
                                alignItems: 'center',
                                margin: 'auto',
                                paddingTop: '10px',
                              }}
                            >
                              {validationSuccess ? (
                                <Button style={{ color: 'green' }}>
                                  <CheckCircle />
                                </Button>
                              ) : (
                                <Button style={{ color: 'red' }}>
                                  <Error />
                                </Button>
                              )}

                              <Button
                                style={{ color: 'black' }}
                                onClick={() => {
                                  handleChange(files, index)
                                }}
                              >
                                <DeleteRounded />
                              </Button>
                            </div>
                          </Grid>

                          <Grid item xs={4}>
                            <FormControlLabel
                              sx={{ float: 'right', paddingTop: '10px' }}
                              control={
                                <Checkbox color="secondary" defaultChecked />
                              }
                              label="Receive Email Conformation"
                              labelPlacement="end"
                              className={`emailCheckbox emailCheckbox-` + index}
                            />
                          </Grid>
                        </Grid>

                        <Grid container>
                          <Grid
                            item
                            xs={9}
                            sx={{ paddingLeft: '20px', paddingTop: '10px' }}
                          >
                            <Box>
                              <LinearProgress
                                color="secondary"
                                variant="determinate"
                                value={20}
                                sx={{
                                  borderRadius: '5px',
                                  height: '15px',
                                }}
                              />
                              <Typography
                                variant="body2"
                                color="gray"
                                sx={{ float: 'right' }}
                              >
                                20%
                              </Typography>
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
                              <Button variant="contained" color="secondary">
                                Submit
                              </Button>
                            </ButtonGroup>
                          </Grid>
                        </Grid>
                        <Divider component="li" variant="fullWidth" />
                      </Box>
                    </>
                  ))
                : ''}
            </List>

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
                    <Button variant="contained" color="secondary">
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
