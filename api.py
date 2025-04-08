from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import xml.etree.ElementTree as ET
import os
import logging
import shutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure output directory exists
OUTPUT_DIR = os.path.join("orcsc", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

class EventData(BaseModel):
    EventTitle: str
    StartDate: str
    EndDate: str
    Venue: str
    Organizer: str

class ClassData(BaseModel):
    ClassId: str
    ClassName: str
    YachtClass: str

class RaceData(BaseModel):
    RaceId: Optional[int] = None
    RaceName: str
    StartTime: str
    ClassId: str
    ScoringType: str

class FleetData(BaseModel):
    YID: Optional[int] = None
    YachtName: str
    SailNo: Optional[str] = None
    ClassId: str

@app.get("/api/files")
async def list_orcsc_files():
    """List all .orcsc files in the output directory"""
    try:
        files = []
        for file in os.listdir(OUTPUT_DIR):
            if file.endswith('.orcsc'):
                file_path = os.path.join(OUTPUT_DIR, file)
                files.append({
                    "name": file,
                    "path": file_path,
                    "size": os.path.getsize(file_path),
                    "modified": os.path.getmtime(file_path)
                })
        return {"files": files}
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a new ORCSC file"""
    try:
        if not file.filename.endswith('.orcsc'):
            raise HTTPException(status_code=400, detail="Only .orcsc files are allowed")
        
        file_path = os.path.join(OUTPUT_DIR, file.filename)
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"filename": file.filename, "path": file_path}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/{file_path:path}")
async def get_orcsc_file(file_path: str):
    try:
        logger.info(f"Received request for file: {file_path}")
        
        # Convert the file path to absolute path
        abs_path = os.path.abspath(file_path)
        logger.info(f"Absolute path: {abs_path}")
        
        # Check if file exists
        if not os.path.exists(abs_path):
            logger.error(f"File not found: {abs_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
            
        # Parse the XML file
        try:
            tree = ET.parse(abs_path)
            root = tree.getroot()
        except ET.ParseError as e:
            logger.error(f"Failed to parse XML file: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid XML file: {str(e)}")
        
        # Extract event data
        event = root.find('./Event/ROW')
        if event is None:
            raise HTTPException(status_code=400, detail="Invalid ORCSC file: missing Event data")
            
        event_data = {
            "EventTitle": event.find('EventTitle').text,
            "StartDate": event.find('StartDate').text,
            "EndDate": event.find('EndDate').text,
            "Venue": event.find('Venue').text,
            "Organizer": event.find('Organizer').text
        }
        
        # Extract classes
        classes = []
        for cls in root.findall('./Cls/ROW'):
            classes.append({
                "ClassId": cls.find('ClassId').text,
                "ClassName": cls.find('ClassName').text,
                "YachtClass": cls.find('YachtClass').text if cls.find('YachtClass') is not None else "Unknown"
            })
            
        # Extract races
        races = []
        for race in root.findall('./Race/ROW'):
            races.append({
                "RaceId": int(race.find('RaceId').text),
                "RaceName": race.find('RaceName').text,
                "StartTime": race.find('StartTime').text,
                "ClassId": race.find('ClassId').text,
                "ScoringType": race.find('ScoringType').text
            })
            
        # Extract fleet
        fleet = []
        for boat in root.findall('./Fleet/ROW'):
            fleet.append({
                "YID": int(boat.find('YID').text),
                "YachtName": boat.find('YachtName').text,
                "SailNo": boat.find('SailNo').text if boat.find('SailNo') is not None else None,
                "ClassId": boat.find('ClassId').text
            })
            
        response_data = {
            "event": event_data,
            "classes": classes,
            "races": races,
            "fleet": fleet
        }
        
        logger.info("Successfully processed ORCSC file")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 