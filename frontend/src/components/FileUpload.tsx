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

const fileTypes = ['xlsx', 'csv', 'txt']
let selectedFiles: any[] = []
let validationSuccess = {}

function FileUpload() {
  const [files, setFiles] = useState(null)
  const [validationProgress, setValidationProgress] = useState({
    items: []
  })

  const handleFileSelect = (files, index) => {
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
    const newItems = [...validationProgress.items];
    newItems[index] = Math.floor(Math.random() * 100);
    setValidationProgress({
      items: newItems,
    });
  }

  const validateAllFiles = (files) => {
    console.log(files)
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
    const isChecked = event.target.checked;
    setCheckedItems({
      master: isChecked,
      items: checkedItems.items.map(() => isChecked),
    });
  }

  const handleCheckboxChange = (index) => (event) => {
    const newItems = [...checkedItems.items];
    newItems[index] = event.target.checked;
    setCheckedItems({
      master: newItems.every((item) => item),
      items: newItems,
    });
  }

  useEffect(() => {
    checkedItems.items = selectedFiles.map((index) => true)
    validationProgress.items = selectedFiles.map((index) => 0)
    
  }, [selectedFiles]);

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
              <label>{selectedFiles.length + ' files selected'}</label>
            </Button>
          </Grid>

          {expandList ? (
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
              {selectedFiles.length > 0
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
                          <ButtonGroup style={{ color: 'black' }}>
                            {validationSuccess ? (
                              <Button style={{ color: 'green' }}>
                                <CheckCircle />
                              </Button>
                            ) : (
                              <Button style={{ color: 'green' }}>
                                <Error />
                              </Button>
                            )}

                            <Button
                              style={{ color: 'black' }}
                              onClick={() => {
                                handleFileSelect(files, index)
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
                              <Checkbox color="secondary" checked={checkedItems.items[index]} onChange={handleCheckboxChange(index)}/>
                            }
                            label="Receive Email Conformation"
                            labelPlacement="end"
                            className={`emailCheckbox emailCheckbox-` + index}
                          />
                        </Grid>
                        <Grid item xs={9}>
                        <Box>
                              <LinearProgress
                                color="secondary"
                                variant="determinate"
                                value={validationProgress.items[index]}
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
                                {validationProgress.items[index] + '%'}
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

                        <Grid item xs={12}>
                          <Divider variant="fullWidth" />
                        </Grid>
                      </Grid>
                    </ListItem>
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
