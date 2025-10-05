import logging
import os
import re
import shutil
import uuid
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from orcsc.file_history import FileHistory
from orcsc.model.fleet_row import FleetRow
from orcsc.model.race_row import RaceRow
from orcsc.orcsc_file_editor import add_races as orcsc_add_races, add_fleets as orcsc_add_fleets
from orcsc.orcsc_file_editor import update_fleet as orcsc_update_fleet

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],  # React dev server and production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure output directory exists
OUTPUT_DIR = os.path.join("orcsc", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Initialize file history
file_history = FileHistory("orcsc/output")

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

class AddRacesRequest(BaseModel):
    races: List[RaceData]

class FleetData(BaseModel):
    YID: Optional[int] = None
    YachtName: str
    SailNo: Optional[str] = None
    ClassId: str

class CreateFileRequest(BaseModel):
    template_path: str
    new_file_path: Optional[str] = None
    event_data: Optional[dict] = None

class AddClassRequest(BaseModel):
    class_data: ClassData

class AddBoatsRequest(BaseModel):
    boats: List[FleetData]

class RestoreBackupRequest(BaseModel):
    backup_path: str

class UpdateBoatRequest(BaseModel):
    YID: int
    YachtName: Optional[str] = None
    SailNo: Optional[str] = None
    ClassId: Optional[str] = None

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
        
        # Generate a new UUID for the filename
        file_uuid = str(uuid.uuid4())
        new_filename = f"{file_uuid}.orcsc"
        file_path = os.path.join(OUTPUT_DIR, new_filename)
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create initial backup with summary
        change_summary = f"Initial file upload: {file.filename} (renamed to {new_filename})"
        file_history.create_backup(file_path, change_summary)
            
        return {"filename": new_filename, "path": file_path}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files/get/{file_path:path}")
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

@app.post("/api/files/{file_path:path}/races")
async def add_races_to_file(file_path: str, request: AddRacesRequest):
    """Add races to an existing ORCSC file"""
    try:
        logger.info(f"Adding races to file: {file_path}")
        
        # Convert the file path to absolute path
        abs_path = os.path.abspath(file_path)
        logger.info(f"Absolute path: {abs_path}")
        
        # Check if file exists
        if not os.path.exists(abs_path):
            logger.error(f"File not found: {abs_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Convert races to RaceRow objects
        races = []
        for race in request.races:
            race_row = RaceRow("ROW")
            race_row.RaceName = race.RaceName
            race_row.ClassId = race.ClassId
            race_row.StartTime = race.StartTime
            race_row.ScoringType = race.ScoringType
            races.append(race_row)
        
        # Add races to the file
        orcsc_add_races(abs_path, abs_path, races)
        # Create backup after  modifying
        race_names = [race.RaceName for race in request.races]
        change_summary = f"Added races: {', '.join(race_names)}"
        file_history.create_backup(abs_path, change_summary)

        logger.info(f"Successfully added {len(races)} races to {file_path}")
        return {"message": f"Successfully added {len(races)} races"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding races: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to add races: {str(e)}")

@app.get("/api/files/download/{filename}")
async def download_orcsc_file(filename: str):
    """Download an ORCSC file"""
    try:
        logger.info(f"Downloading file: {filename}")
        
        # Ensure the filename has the .orcsc extension
        if not filename.endswith('.orcsc'):
            filename += '.orcsc'
            
        # Construct the full path using the output directory
        full_path = os.path.join(OUTPUT_DIR, filename)
        logger.info(f"Full path: {full_path}")
        
        # Check if file exists
        if not os.path.exists(full_path):
            logger.error(f"File not found: {full_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {filename}")
            
        # Return the file
        return FileResponse(
            full_path,
            media_type="application/xml",
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

def get_template_files() -> List[str]:
    """Get list of available template files."""
    template_dir = Path("orcsc/templates")
    if not template_dir.exists():
        template_dir.mkdir(parents=True, exist_ok=True)
        return []
    
    return [str(f) for f in template_dir.glob("*.orcsc")]

@app.get("/api/templates")
async def get_templates():
    """Get list of available template files."""
    try:
        templates = get_template_files()
        return templates
    except Exception as e:
        logging.error(f"Error getting templates: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get templates")

def sanitize_filename(filename: str) -> str:
    """Sanitize a string to be used as a filename."""
    # Replace invalid characters with underscores
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove leading/trailing spaces and dots
    sanitized = sanitized.strip('. ')
    # Replace multiple spaces/underscores with a single underscore
    sanitized = re.sub(r'[ _]+', '_', sanitized)
    # If the result is empty, use a default name
    if not sanitized:
        sanitized = "untitled"
    return sanitized

@app.post("/api/files")
async def create_file_from_template(request: CreateFileRequest):
    try:
        # Validate paths
        if not request.template_path.startswith("orcsc/"):
            raise HTTPException(status_code=400, detail="Template path must be within orcsc directory")
        
        # Extract event data from the request
        event_data = request.event_data or {}
        event_title = event_data.get("EventTitle", "New Event")
        venue = event_data.get("Venue", "Haifa Bay")
        organizer = event_data.get("Organizer", "CYC")
        start_date = event_data.get("StartDate")
        end_date = event_data.get("EndDate")
        classes = event_data.get("Classes", [])
        # Convert classes to ClsRow objects
        from orcsc.model.cls_row import ClsRow
        class_rows = []
        for cls in classes:
            class_row = ClsRow("ROW")
            class_row.ClassId = cls.get("ClassId")
            class_row.ClassName = cls.get("ClassName")
            class_row._class_enum = cls.get("YachtClass")
            class_rows.append(class_row)
        classes = class_rows
        logger.info(f"Creating file from template: {event_title}, {venue}, {organizer}, {start_date}, {end_date}, {classes}")
        
        # Generate a new UUID for the filename
        file_uuid = str(uuid.uuid4())
        output_file = f"orcsc/output/{file_uuid}.orcsc"
        
        # Create the file from template using create_new_scoring_file
        from orcsc.orcsc_file_editor import create_new_scoring_file
        
        create_new_scoring_file(
            event_title=event_title,
            venue=venue,
            organizer=organizer,
            output_file=output_file,
            start_date=start_date,
            end_date=end_date,
            classes=classes
        )
        change_summary = f"Created from template: {request.template_path}"
        if request.event_data:
            change_summary += " with custom event data"
        file_history.create_backup(output_file, change_summary)
        
        return {"file_path": output_file}
    except Exception as e:
        logger.error(f"Error creating file: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/{file_path:path}/classes")
async def add_class_to_file(file_path: str, request: AddClassRequest):
    """Add a class to an existing ORCSC file"""
    try:
        logger.info(f"Adding class to file: {file_path}")
        
        # Convert the file path to absolute path
        abs_path = os.path.abspath(file_path)
        logger.info(f"Absolute path: {abs_path}")
        
        # Check if file exists
        if not os.path.exists(abs_path):
            logger.error(f"File not found: {abs_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Convert the request class to the format expected by orcsc_file_editor
        from orcsc.model.cls_row import ClsRow
        from orcsc.orcsc_file_editor import add_classes
        
        cls_row = ClsRow("ROW")
        cls_row.ClassId = request.class_data.ClassId
        cls_row.ClassName = request.class_data.ClassName
        cls_row._class_enum = request.class_data.YachtClass
        
        # Add class to the file
        add_classes(abs_path, abs_path, [cls_row])
        # Create backup after modifying
        change_summary = f"Added class: {request.class_data.ClassName} ({request.class_data.ClassId})"
        file_history.create_backup(abs_path, change_summary)

        logger.info(f"Successfully added class {request.class_data.ClassId} to {file_path}")
        return {"message": f"Successfully added class {request.class_data.ClassId}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding class: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to add class: {str(e)}")

@app.post("/api/files/{file_path:path}/boats")
async def add_boats_to_file(file_path: str, request: AddBoatsRequest):
    """Add boats to an existing ORCSC file"""
    try:
        logger.info(f"Adding boats to file: {file_path}")
        
        # Convert the file path to absolute path
        abs_path = os.path.abspath(file_path)
        logger.info(f"Absolute path: {abs_path}")
        
        # Check if file exists
        if not os.path.exists(abs_path):
            logger.error(f"File not found: {abs_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Convert boats to FleetRow objects
        fleet_rows = []
        for boat in request.boats:
            fleet_row = FleetRow("ROW")
            fleet_row.YachtName = boat.YachtName
            fleet_row.SailNo = boat.SailNo
            fleet_row.ClassId = boat.ClassId
            fleet_row.CTOT = 1  # Set custom TOT to 1 for manually added boats
            fleet_rows.append(fleet_row)
        
        # Add boats to the file
        orcsc_add_fleets(abs_path, abs_path, fleet_rows)
        # Create backup after modifying
        boat_names = [boat.YachtName for boat in request.boats]
        change_summary = f"Added boats: {', '.join(boat_names)}"
        file_history.create_backup(abs_path, change_summary)
        
        logger.info(f"Successfully added {len(fleet_rows)} boats to {file_path}")
        return {"message": f"Successfully added {len(fleet_rows)} boats"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding boats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to add boats: {str(e)}")

@app.post("/api/files/{file_path:path}/boats/update")
async def update_boat_in_file(file_path: str, request: UpdateBoatRequest):
    """Update a boat (fleet entry) in an existing ORCSC file by YID"""
    try:
        logger.info(f"Updating boat in file: {file_path} (YID={request.YID})")
        abs_path = os.path.abspath(file_path)
        logger.info(f"Absolute path: {abs_path}")

        if not os.path.exists(abs_path):
            logger.error(f"File not found: {abs_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

        # Create FleetRow for update, only set fields if provided
        fleet_row = FleetRow("ROW")
        fleet_row.YID = request.YID
        if request.YachtName is not None:
            fleet_row.YachtName = request.YachtName
        if request.SailNo is not None:
            fleet_row.SailNo = request.SailNo
        if request.ClassId is not None:
            fleet_row.ClassId = request.ClassId

        # Update the fleet entry
        orcsc_update_fleet(abs_path, abs_path, fleet_row)
        change_summary = f"Updated boat: {request.YachtName or ''} (YID={request.YID})"
        file_history.create_backup(abs_path, change_summary)

        logger.info(f"Successfully updated boat YID={request.YID} in {file_path}")
        return {"message": f"Successfully updated boat YID={request.YID}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating boat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update boat: {str(e)}")

@app.get("/api/files/{file_path:path}/history")
async def get_file_history(file_path: str):
    """Get the history of backups for a file."""
    try:
        logger.info(f"Getting history for file: {file_path}")
        
        # Ensure the file path is within the output directory
        if not file_path.startswith("orcsc/output/"):
            file_path = os.path.join("orcsc", "output", file_path)
        
        # Check if the file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Get the backups
        backups = file_history.list_backups(file_path)
        
        if not backups:
            logger.warning(f"No backups found for file: {file_path}")
            return {"backups": []}
            
        return {"backups": backups}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/files/{file_path:path}/history/restore")
async def restore_from_backup(file_path: str, request: RestoreBackupRequest):
    """Restore a file from a backup."""
    try:
        logger.info(f"Restoring file {file_path} from backup: {request.backup_path}")
        
        # Ensure the file path is within the output directory
        if not file_path.startswith("orcsc/output/"):
            file_path = os.path.join("orcsc", "output", file_path)
        
        # Check if the file exists
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Restore from backup
        restored_path = file_history.restore_backup(request.backup_path)
        
        if not restored_path:
            raise HTTPException(status_code=404, detail="Failed to restore from backup")
            
        return {"message": f"File restored from backup: {restored_path}"}
    except HTTPException:
        raise
    except FileNotFoundError as e:
        logger.error(f"Backup not found: {str(e)}", exc_info=True)
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error restoring from backup: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

from orcsc.orcsc_file_editor import add_fleet_from_orc_json
from fastapi import Body

@app.post("/api/files/{file_path:path}/boats/orcjson")
async def add_boat_from_orc_json(
    file_path: str,
    orc_json: dict = Body(...),
    class_id: Optional[str] = None
):
    """
    Add a boat (fleet) from a JSON object as retrieved from the ORC API.
    Optionally override ClassId.
    """
    try:
        logger.info(f"Adding ORC JSON boat to file: {file_path}")
        abs_path = os.path.abspath(file_path)
        logger.info(f"Absolute path: {abs_path}")

        if not os.path.exists(abs_path):
            logger.error(f"File not found: {abs_path}")
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        logger.info(f"Received ORC JSON: {orc_json}")
        add_fleet_from_orc_json(abs_path, abs_path, orc_json, class_id=class_id)
        yacht_name = orc_json.get("YachtName", "")
        sail_no = orc_json.get("SailNo", "")
        change_summary = f"Added ORC boat: {yacht_name} ({sail_no})"
        file_history.create_backup(abs_path, change_summary)

        logger.info(f"Successfully added ORC boat {yacht_name} ({sail_no}) to {file_path}")
        return {"message": f"Successfully added ORC boat {yacht_name} ({sail_no})"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding ORC boat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to add ORC boat: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
