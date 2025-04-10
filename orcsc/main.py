from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
from orcsc_file_editor import add_races
import urllib.parse

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Race(BaseModel):
    RaceName: str
    ClassId: str
    StartTime: str
    ScoringType: str

class AddRacesRequest(BaseModel):
    races: List[Race]

@app.get("/files")
async def get_files():
    try:
        output_dir = "output"
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            print(f"Creating output directory: {output_dir}")
            os.makedirs(output_dir)
            return []

        # List all .orcsc files in the output directory
        files = [
            file for file in os.listdir(output_dir)
            if file.endswith(".orcsc")
        ]
        print(f"Found {len(files)} .orcsc files in {output_dir}")
        return files
    except Exception as e:
        print(f"Error listing files: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list files: {str(e)}"
        )

@app.get("/files/{file_path}")
async def get_file(file_path: str):
    try:
        # TODO: Implement file parsing and return structured data
        return {
            "filePath": file_path,
            "event": {
                "EventTitle": "Sample Event",
                "Venue": "Sample Venue",
                "Organizer": "Sample Organizer",
                "StartDate": "2024-01-01",
                "EndDate": "2024-01-02"
            },
            "classes": [
                {
                    "ClassId": "1",
                    "ClassName": "ORC",
                    "YachtClass": "ORC"
                }
            ],
            "races": [
                {
                    "RaceId": "1",
                    "RaceName": "Race 1",
                    "ClassId": "1",
                    "StartTime": "1704067200",
                    "Status": "Completed",
                    "ScoringType": "LowPoint"
                }
            ],
            "fleet": [
                {
                    "YID": "1",
                    "YachtName": "Yacht 1",
                    "SailNo": "123",
                    "ClassId": "1",
                    "HelmName": "John Doe",
                    "CrewName": "Jane Doe",
                    "ClubName": "Sample Club"
                }
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/files/{file_path}/races")
async def add_races_to_file(file_path: str, request: AddRacesRequest):
    try:
        if not file_path:
            raise HTTPException(status_code=400, detail="File path is required")
            
        # Decode the URL-encoded file path
        decoded_path = urllib.parse.unquote(file_path)
        full_path = os.path.join("output", decoded_path)
        
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail=f"File not found: {decoded_path}")
        
        # Convert the request races to the format expected by orcsc_file_editor
        races = []
        for race in request.races:
            if not all([race.RaceName, race.ClassId, race.StartTime, race.ScoringType]):
                raise HTTPException(status_code=400, detail="All race fields are required")
                
            races.append({
                "RaceName": race.RaceName,
                "ClassId": race.ClassId,
                "StartTime": race.StartTime,
                "ScoringType": race.ScoringType
            })
        
        add_races(full_path, full_path, races)
        return {"message": "Races added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 