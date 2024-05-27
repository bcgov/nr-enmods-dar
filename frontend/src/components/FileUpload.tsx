import { Box, List, ListItem, ListItemText } from "@mui/material";
import React, {useState} from "react";
import { FileUploader } from "react-drag-drop-files";



const dropboxStyle = {
    width: "100%"
}

const fileTypes = ["xlsx", "csv", "txt"]
let selectedFiles: any[] = []


function FileUpload() {
    const [files, setFiles] = useState(null);
    const handleChange = (files) => {
        setFiles(files);
        console.log(files);
        selectedFiles = Array.from(files)
    }

    return (
        <div>
            <div>
                <FileUploader style={dropboxStyle} 
                    multiple={true}
                    types={fileTypes}
                    handleChange={handleChange}
                    name="file" 
                />
            </div>
        
            <div>
                <List>
                    {files ? selectedFiles.map((file, index) => (
                        <ListItem key={index}>
                            File name: <ListItemText primary={file.name} />
                        </ListItem>
                    )) : "No files selected!"}
                </List>
            </div>
        </div>
    )
}

export default FileUpload