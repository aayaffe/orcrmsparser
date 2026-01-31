import logging
import os
import re
import uuid
import xml.etree.ElementTree as ET
from defusedxml import ElementTree as DefusedET
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

# Security: Path validation helper to prevent directory traversal
def validate_file_path(file_path: str, base_dir: str = "orcsc/output") -> str:
    """
    Validate and resolve a file path to ensure it stays within the base directory.
    Prevents directory traversal attacks. Handles cross-platform paths.
    """
    if not file_path:
        raise ValueError("File path cannot be empty")
    
    # Normalize input: convert backslashes to forward slashes for consistency
    file_path = file_path.replace("\\", "/")
    
    # Extract just the filename if full path is provided
    if "/" in file_path:
        # Get the last component (filename)
        filename = file_path.split("/")[-1]
    else:
        filename = file_path
    
    # Validate filename format (no path traversal attempts)
    if ".." in filename or "/" in filename or "\\" in filename:
        raise ValueError(f"Invalid file path: path traversal detected")
    
    # Use Path for cross-platform handling
    base_path = Path(base_dir).resolve()
    full_path = (base_path / filename).resolve()
    
    # Ensure the resolved path is within the base directory
    try:
        full_path.relative_to(base_path)
    except ValueError:
        raise ValueError(f"Invalid file path: path traversal detected")
    
    # Return as string with forward slashes for consistency
    return str(full_path)

default_origins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
env_origins = os.getenv("CORS_ORIGINS")
allow_origins = default_origins
if env_origins:
    allow_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Ensure output directory exists
OUTPUT_DIR = os.path.join("orcsc", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Security: File size limits
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024  # 10MB for uploads

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
        try:
            file_list = os.listdir(OUTPUT_DIR)
        except OSError as e:
            logger.error(f"Error reading directory: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to list files")
        
        for file in file_list:
            if file.endswith('.orcsc'):
                file_path = os.path.join(OUTPUT_DIR, file)
                try:
                    files.append({
                        "name": file,
                        "path": file_path,
                        "size": os.path.getsize(file_path),
                        "modified": os.path.getmtime(file_path)
                    })
                except OSError:
                    logger.warning(f"Could not stat file: {file}")
                    continue
        return {"files": files}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list files")

@app.post("/api/files/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a new ORCSC file"""
    try:
        if not file.filename or not file.filename.endswith('.orcsc'):
            raise HTTPException(status_code=400, detail="Only .orcsc files are allowed")
        
        # Validate file size
        if file.size and file.size > MAX_UPLOAD_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File size exceeds maximum limit of {MAX_UPLOAD_FILE_SIZE / (1024*1024):.0f}MB")
        
        # Generate a new UUID for the filename to prevent name-based attacks
        file_uuid = str(uuid.uuid4())
        new_filename = f"{file_uuid}.orcsc"
        file_path = os.path.join(OUTPUT_DIR, new_filename)
        
        # Save the uploaded file with size limit check during write
        bytes_written = 0
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(8192)  # Read in 8KB chunks
                if not chunk:
                    break
                bytes_written += len(chunk)
                if bytes_written > MAX_UPLOAD_FILE_SIZE:
                    os.remove(file_path)  # Clean up partial file
                    raise HTTPException(status_code=413, detail=f"File size exceeds maximum limit of {MAX_UPLOAD_FILE_SIZE / (1024*1024):.0f}MB")
                buffer.write(chunk)
        
        # Verify the uploaded file is valid XML
        try:
            DefusedET.parse(file_path)
        except ET.ParseError as e:
            os.remove(file_path)  # Clean up invalid file
            logger.warning(f"Invalid XML uploaded: {str(e)}")
            raise HTTPException(status_code=400, detail="Uploaded file is not valid XML")
        
        # Create initial backup with summary
        change_summary = f"Initial file upload: {file.filename} (renamed to {new_filename})"
        file_history.create_backup(file_path, change_summary)
        logger.info(f"File uploaded successfully: {new_filename}")
        return {"filename": new_filename, "path": file_path}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to upload file")

@app.get("/api/files/get/{file_path:path}")
async def get_orcsc_file(file_path: str):
    try:
        logger.info(f"Processing file request")
        
        # Validate and resolve the file path
        try:
            abs_path = validate_file_path(file_path)
        except ValueError as e:
            logger.warning(f"Invalid file path request: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Check if file exists
        if not os.path.exists(abs_path):
            logger.warning(f"File not found: {file_path}")
            raise HTTPException(status_code=404, detail="File not found")
        
        # Check file size
        if os.path.getsize(abs_path) > MAX_FILE_SIZE:
            logger.warning(f"File too large: {file_path}")
            raise HTTPException(status_code=413, detail="File size exceeds maximum limit")
        
        # Parse the XML file with XXE protection
        try:
            tree = DefusedET.parse(abs_path)
            root = tree.getroot()
        except ET.ParseError as e:
            logger.error(f"Failed to parse XML file: {e}")
            raise HTTPException(status_code=400, detail="Invalid file format")
        
        # Extract event data
        event = root.find('./Event/ROW')
        if event is None:
            raise HTTPException(status_code=400, detail="Invalid file format")
        
        # Safely extract text with null checks
        def get_text(element, tag: str, default: str = ""):
            child = element.find(tag)
            return child.text if child is not None and child.text else default
            
        event_data = {
            "EventTitle": get_text(event, 'EventTitle'),
            "StartDate": get_text(event, 'StartDate'),
            "EndDate": get_text(event, 'EndDate'),
            "Venue": get_text(event, 'Venue'),
            "Organizer": get_text(event, 'Organizer')
        }
        
        # Extract classes
        classes = []
        for cls in root.findall('./Cls/ROW'):
            classes.append({
                "ClassId": get_text(cls, 'ClassId'),
                "ClassName": get_text(cls, 'ClassName'),
                "YachtClass": get_text(cls, 'YachtClass', "Unknown")
            })
            
        # Extract races
        races = []
        for race in root.findall('./Race/ROW'):
            race_id_text = get_text(race, 'RaceId', '0')
            try:
                race_id = int(race_id_text) if race_id_text else 0
            except ValueError:
                race_id = 0
            races.append({
                "RaceId": race_id,
                "RaceName": get_text(race, 'RaceName'),
                "StartTime": get_text(race, 'StartTime'),
                "ClassId": get_text(race, 'ClassId'),
                "ScoringType": get_text(race, 'ScoringType')
            })
            
        # Extract fleet
        fleet = []
        for boat in root.findall('./Fleet/ROW'):
            yid_text = get_text(boat, 'YID', '0')
            try:
                yid = int(yid_text) if yid_text else 0
            except ValueError:
                yid = 0
            fleet.append({
                "YID": yid,
                "YachtName": get_text(boat, 'YachtName'),
                "SailNo": get_text(boat, 'SailNo'),
                "ClassId": get_text(boat, 'ClassId')
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
        logger.error(f"Unexpected error processing file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process file")

@app.post("/api/files/{file_path:path}/races")
async def add_races_to_file(file_path: str, request: AddRacesRequest):
    """Add races to an existing ORCSC file"""
    try:
        logger.info(f"Adding races to file")
        
        # Validate and resolve the file path
        try:
            abs_path = validate_file_path(file_path)
        except ValueError as e:
            logger.warning(f"Invalid file path: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Check if file exists
        if not os.path.exists(abs_path):
            logger.warning(f"File not found")
            raise HTTPException(status_code=404, detail="File not found")
        
        # Validate races data
        if not request.races or len(request.races) == 0:
            raise HTTPException(status_code=400, detail="No races provided")
        
        # Convert races to RaceRow objects
        races = []
        for race in request.races:
            if not race.RaceName or not race.ClassId:
                raise HTTPException(status_code=400, detail="Race name and class ID are required")
            race_row = RaceRow("ROW")
            race_row.RaceName = race.RaceName
            race_row.ClassId = race.ClassId
            race_row.StartTime = race.StartTime
            race_row.ScoringType = race.ScoringType
            races.append(race_row)
        
        # Add races to the file
        orcsc_add_races(abs_path, abs_path, races)
        # Create backup after modifying
        race_names = [race.RaceName for race in request.races]
        change_summary = f"Added races: {', '.join(race_names)}"
        file_history.create_backup(abs_path, change_summary)

        logger.info(f"Successfully added {len(races)} races")
        return {"message": f"Successfully added {len(races)} races"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding races: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to add races")

@app.get("/api/files/download/{filename}")
async def download_orcsc_file(filename: str):
    """Download an ORCSC file"""
    try:
        logger.info(f"Download requested")
        
        # Validate filename - only alphanumeric, hyphens, and dots
        if not re.match(r'^[a-zA-Z0-9._-]+\.orcsc$', filename):
            logger.warning(f"Invalid filename format requested")
            raise HTTPException(status_code=400, detail="Invalid filename format")
        
        # Construct the full path using the output directory
        full_path = os.path.join(OUTPUT_DIR, filename)
        
        # Validate path to ensure it's within OUTPUT_DIR
        try:
            validated_path = validate_file_path(full_path, OUTPUT_DIR)
        except ValueError as e:
            logger.warning(f"Path validation failed: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Check if file exists
        if not os.path.exists(validated_path):
            logger.warning(f"File not found: {filename}")
            raise HTTPException(status_code=404, detail="File not found")
        
        # Return the file
        return FileResponse(
            validated_path,
            media_type="application/xml",
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to download file")

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
        logger.error(f"Error getting templates: {str(e)}", exc_info=True)
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
        logger.info(f"Creating file from template")
        
        # Validate template path - must be within orcsc directory and no path traversal
        if not request.template_path:
            raise HTTPException(status_code=400, detail="Template path is required")
        
        # Normalize path: convert backslashes to forward slashes
        template_path = request.template_path.replace("\\", "/")
        
        # Check for path traversal
        if ".." in template_path:
            raise HTTPException(status_code=400, detail="Invalid template path")
        
        if not template_path.startswith("orcsc/"):
            # Try without leading slash
            if "orcsc/" not in template_path:
                raise HTTPException(status_code=400, detail="Template path must be within orcsc directory")
        
        # Verify template file exists - convert back to OS-specific path for file check
        template_file_path = template_path.replace("/", os.sep)
        if not os.path.exists(template_file_path):
            logger.warning(f"Template not found: {template_file_path}")
            raise HTTPException(status_code=400, detail="Template file not found")
        
        # Extract event data from the request
        event_data = request.event_data or {}
        event_title = event_data.get("EventTitle", "New Event")
        venue = event_data.get("Venue", "Haifa Bay")
        organizer = event_data.get("Organizer", "CYC")
        start_date = event_data.get("StartDate")
        end_date = event_data.get("EndDate")
        classes = event_data.get("Classes", [])
        
        # Validate event data
        if not isinstance(event_title, str) or not event_title.strip():
            raise HTTPException(status_code=400, detail="Invalid event title")
        
        # Convert classes to ClsRow objects
        from orcsc.model.cls_row import ClsRow
        class_rows = []
        for cls in classes:
            if not isinstance(cls, dict) or not cls.get("ClassId") or not cls.get("ClassName"):
                raise HTTPException(status_code=400, detail="Invalid class data")
            class_row = ClsRow("ROW")
            class_row.ClassId = cls.get("ClassId")
            class_row.ClassName = cls.get("ClassName")
            class_row._class_enum = cls.get("YachtClass", "")
            class_rows.append(class_row)
        
        logger.info(f"Creating file from template with event data")
        
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
            classes=class_rows
        )
        change_summary = f"Created from template"
        if request.event_data:
            change_summary += " with custom event data"
        file_history.create_backup(output_file, change_summary)
        logger.info(f"File created successfully")
        
        return {"file_path": output_file}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create file")

@app.post("/api/files/{file_path:path}/classes")
async def add_class_to_file(file_path: str, request: AddClassRequest):
    """Add a class to an existing ORCSC file"""
    try:
        logger.info(f"Adding class to file")
        
        # Validate and resolve the file path
        try:
            abs_path = validate_file_path(file_path)
        except ValueError as e:
            logger.warning(f"Invalid file path: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Check if file exists
        if not os.path.exists(abs_path):
            logger.warning(f"File not found")
            raise HTTPException(status_code=404, detail="File not found")
        
        # Validate class data
        if not request.class_data.ClassId or not request.class_data.ClassName:
            raise HTTPException(status_code=400, detail="Class ID and name are required")
        
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

        logger.info(f"Successfully added class {request.class_data.ClassId}")
        return {"message": f"Successfully added class {request.class_data.ClassId}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding class: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to add class")

@app.post("/api/files/{file_path:path}/boats")
async def add_boats_to_file(file_path: str, request: AddBoatsRequest):
    """Add boats to an existing ORCSC file"""
    try:
        logger.info(f"Adding boats to file")
        
        # Validate and resolve the file path
        try:
            abs_path = validate_file_path(file_path)
        except ValueError as e:
            logger.warning(f"Invalid file path: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Check if file exists
        if not os.path.exists(abs_path):
            logger.warning(f"File not found")
            raise HTTPException(status_code=404, detail="File not found")
        
        # Validate boats data
        if not request.boats or len(request.boats) == 0:
            raise HTTPException(status_code=400, detail="No boats provided")
        
        # Convert boats to FleetRow objects
        fleet_rows = []
        for boat in request.boats:
            if not boat.YachtName or not boat.ClassId:
                raise HTTPException(status_code=400, detail="Yacht name and class ID are required")
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
        
        logger.info(f"Successfully added {len(fleet_rows)} boats")
        return {"message": f"Successfully added {len(fleet_rows)} boats"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding boats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to add boats")

@app.post("/api/files/{file_path:path}/boats/update")
async def update_boat_in_file(file_path: str, request: UpdateBoatRequest):
    """Update a boat (fleet entry) in an existing ORCSC file by YID"""
    try:
        logger.info(f"Updating boat in file")
        
        # Validate and resolve the file path
        try:
            abs_path = validate_file_path(file_path)
        except ValueError as e:
            logger.warning(f"Invalid file path: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Validate request
        if request.YID <= 0:
            raise HTTPException(status_code=400, detail="Invalid yacht ID")

        if not os.path.exists(abs_path):
            logger.warning(f"File not found")
            raise HTTPException(status_code=404, detail="File not found")

        # Create FleetRow for update, only set fields if provided
        fleet_row = FleetRow("ROW")
        fleet_row.YID = request.YID
        if request.YachtName is not None and request.YachtName.strip():
            fleet_row.YachtName = request.YachtName
        if request.SailNo is not None and request.SailNo.strip():
            fleet_row.SailNo = request.SailNo
        if request.ClassId is not None and request.ClassId.strip():
            fleet_row.ClassId = request.ClassId

        # Update the fleet entry
        orcsc_update_fleet(abs_path, abs_path, fleet_row)
        change_summary = f"Updated boat: {request.YachtName or 'unknown'} (YID={request.YID})"
        file_history.create_backup(abs_path, change_summary)

        logger.info(f"Successfully updated boat YID={request.YID}")
        return {"message": f"Successfully updated boat YID={request.YID}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating boat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update boat")

@app.get("/api/files/{file_path:path}/history")
async def get_file_history(file_path: str):
    """Get the history of backups for a file."""
    try:
        logger.info(f"Getting file history")
        
        # Validate and resolve the file path
        try:
            if not file_path.startswith("orcsc/output/"):
                file_path = os.path.join("orcsc", "output", file_path)
            abs_path = validate_file_path(file_path)
        except ValueError as e:
            logger.warning(f"Invalid file path: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Check if the file exists
        if not os.path.exists(abs_path):
            logger.warning(f"File not found")
            raise HTTPException(status_code=404, detail="File not found")
        
        # Get the backups
        backups = file_history.list_backups(abs_path)
        
        if not backups:
            logger.info(f"No backups found")
            return {"backups": []}
            
        return {"backups": backups}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting file history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to get file history")

@app.post("/api/files/{file_path:path}/history/restore")
async def restore_from_backup(file_path: str, request: RestoreBackupRequest):
    """Restore a file from a backup."""
    try:
        logger.info(f"Restoring file from backup")
        
        # Validate and resolve the file path
        try:
            if not file_path.startswith("orcsc/output/"):
                file_path = os.path.join("orcsc", "output", file_path)
            abs_path = validate_file_path(file_path)
        except ValueError as e:
            logger.warning(f"Invalid file path: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Validate backup path
        if not request.backup_path or ".." in request.backup_path:
            raise HTTPException(status_code=400, detail="Invalid backup path")
        
        # Check if the file exists
        if not os.path.exists(abs_path):
            logger.warning(f"File not found")
            raise HTTPException(status_code=404, detail="File not found")
        
        # Restore from backup
        restored_path = file_history.restore_backup(request.backup_path)
        
        if not restored_path:
            logger.warning(f"Failed to restore from backup")
            raise HTTPException(status_code=404, detail="Failed to restore from backup")
            
        return {"message": f"File restored successfully"}
    except HTTPException:
        raise
    except FileNotFoundError as e:
        logger.warning(f"Backup not found: {str(e)}")
        raise HTTPException(status_code=404, detail="Backup not found")
    except Exception as e:
        logger.error(f"Error restoring from backup: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to restore from backup")

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
        logger.info(f"Adding ORC JSON boat to file")
        
        # Validate and resolve the file path
        try:
            abs_path = validate_file_path(file_path)
        except ValueError as e:
            logger.warning(f"Invalid file path: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid file path")

        if not os.path.exists(abs_path):
            logger.warning(f"File not found")
            raise HTTPException(status_code=404, detail="File not found")
        
        # Validate ORC JSON has required fields
        if not orc_json.get("YachtName"):
            raise HTTPException(status_code=400, detail="Yacht name is required")
        
        logger.info(f"Processing ORC JSON boat")
        add_fleet_from_orc_json(abs_path, abs_path, orc_json, class_id=class_id)
        yacht_name = orc_json.get("YachtName", "")
        sail_no = orc_json.get("SailNo", "")
        change_summary = f"Added ORC boat: {yacht_name} ({sail_no})"
        file_history.create_backup(abs_path, change_summary)

        logger.info(f"Successfully added ORC boat")
        return {"message": f"Successfully added ORC boat {yacht_name} ({sail_no})"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding ORC boat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to add ORC boat")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
