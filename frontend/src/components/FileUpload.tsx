import { Box, Button, ButtonGroup, Divider, List, ListItem, ListItemText } from "@mui/material";
import React, {useState} from "react";
import { FileUploader } from "react-drag-drop-files";
import { DeleteRounded, UploadFile } from "@mui/icons-material";
import "@/index.css"
import { color } from "@mui/system";

const styles = {
    listItemBox: {
        width: '200px'
    }
}

const fileTypes = ["xlsx", "csv", "txt"]
let selectedFiles: any[] = []


function FileUpload() {
    const [files, setFiles] = useState(null);
    const handleChange = (files, index) => {
        setFiles(files);
        selectedFiles = Array.from(files)
        
        if (index != undefined) {
            selectedFiles.splice(index, 1)
            files = selectedFiles;

            setFiles(files)
            selectedFiles = Array.from(files)
        }
    }

    const validateFile = (file) => {
        
    }

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
                                <span><UploadFile width="32" height="32" fontSize="large"/></span>
                                <span style={{fontSize:30}}>
                                    Upload or drop files right here
                                </span>
                                <div style={{fontSize:15, textAlign: "center"}}>Accepted file types: .xlsx, .csv, .txt</div>
                            </div>
                        </label>
                    }
                />
            </div>
        
            <div>
                <List className="file-list">
                    {files ? selectedFiles.map((file, index) => (
                        <><ListItem key={index}>
                            <ListItemText key={index} primary={file.name} secondary={(file.size / (1024*1024)).toFixed(2) + 'MB'}/>
                            <Box>
                                <ButtonGroup variant="text" style={{color:'black'}}>
                                    <Button style={{color:'black'}} onClick={() => { validateFile(file); }}>Validate</Button>
                                    <Button style={{color:'black'}}>Submit</Button>
                                    <Button style={{color: 'black'}} onClick={() => { handleChange(files, index); }}><DeleteRounded/></Button>
                                </ButtonGroup>
                            </Box>
                        </ListItem>

                        <Box><progress value={0.75}></progress></Box>
                        <Divider component="li" variant="fullWidth"/>
                        </>
                    )) : "No files selected!"}
                </List>

            </div>
        </div>
    )
}

export default FileUpload