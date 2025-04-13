import shutil
from pathlib import Path
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class FileHistory:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir).resolve()
        self.backup_dir = self.base_dir / "backups"
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def create_backup(self, source_path: str, change_summary: str = "") -> str:
        """Create a backup of a file with a summary of changes."""
        try:
            source_path = Path(source_path).resolve()
            relative_path = source_path.relative_to(self.base_dir)
            backup_dir = self.backup_dir / relative_path.parent
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"{relative_path.stem}_{timestamp}{relative_path.suffix}"
            backup_path = backup_dir / backup_filename
            
            # Create metadata file for the backup
            metadata = {
                "timestamp": timestamp,
                "change_summary": change_summary,
                "original_path": str(relative_path)
            }
            metadata_path = backup_path.with_suffix('.json')
            
            # Copy the file and save metadata
            shutil.copy2(source_path, backup_path)
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f)
                
            logger.info(f"Created backup: {backup_path} with summary: {change_summary}")
            return str(backup_path)
        except Exception as e:
            logger.error(f"Error creating backup: {str(e)}")
            raise

    def list_backups(self, file_path: str) -> list[dict]:
        """List all backups for a file with their change summaries."""
        try:
            file_path = Path(file_path).resolve()
            relative_path = file_path.relative_to(self.base_dir)
            backup_dir = self.backup_dir / relative_path.parent
            
            if not backup_dir.exists():
                return []
            
            backups = []
            for backup_file in backup_dir.glob(f"{relative_path.stem}_*{relative_path.suffix}"):
                # Get the corresponding metadata file
                metadata_path = backup_file.with_suffix('.json')
                if not metadata_path.exists():
                    continue
                    
                try:
                    with open(metadata_path, 'r') as f:
                        metadata = json.load(f)
                    
                    timestamp = metadata['timestamp']
                    backup_time = datetime.strptime(timestamp, "%Y%m%d_%H%M%S")
                    
                    backups.append({
                        "path": str(backup_file),
                        "timestamp": backup_time.isoformat(),
                        "filename": backup_file.name,
                        "change_summary": metadata.get('change_summary', '')
                    })
                except (json.JSONDecodeError, KeyError) as e:
                    logger.warning(f"Invalid metadata for backup {backup_file}: {str(e)}")
                    continue
            
            return sorted(backups, key=lambda x: x["timestamp"], reverse=True)
        except Exception as e:
            logger.error(f"Error listing backups: {str(e)}")
            raise

    def restore_backup(self, backup_path: str) -> str:
        """Restore a file from its backup and delete all newer backups."""
        try:
            backup_path = Path(backup_path).resolve()
            if not backup_path.exists():
                raise FileNotFoundError(f"Backup file not found: {backup_path}")
            
            # Get the original file path from the backup path
            relative_backup_path = backup_path.relative_to(self.backup_dir)
            original_path = self.base_dir / relative_backup_path.parent / f"{relative_backup_path.stem.split('_')[0]}{relative_backup_path.suffix}"
            
            # Get the timestamp of the backup we're restoring to
            backup_timestamp = backup_path.stem.split('_')[-1]
            
            # Find and delete all newer backups
            backup_dir = backup_path.parent
            base_filename = relative_backup_path.stem.split('_')[0]
            for backup_file in backup_dir.glob(f"{base_filename}_*{relative_backup_path.suffix}"):
                file_timestamp = backup_file.stem.split('_')[-1]
                if file_timestamp > backup_timestamp:
                    # Delete both the backup file and its metadata
                    backup_file.unlink()
                    metadata_file = backup_file.with_suffix('.json')
                    if metadata_file.exists():
                        metadata_file.unlink()
                    logger.info(f"Deleted newer backup: {backup_file}")
            
            # Copy the backup to the original location
            shutil.copy2(backup_path, original_path)
            logger.info(f"Restored file from backup: {original_path}")
            return str(original_path)
        except Exception as e:
            logger.error(f"Error restoring from backup: {str(e)}")
            raise 