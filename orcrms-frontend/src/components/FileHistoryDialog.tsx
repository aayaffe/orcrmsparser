import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  CircularProgress,
  Tooltip,
  Chip,
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import { orcscApi, BackupInfo } from '../api/orcscApi';
import { format } from 'date-fns';

interface FileHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  filePath: string;
  onRestore: () => void;
}

export const FileHistoryDialog: React.FC<FileHistoryDialogProps> = ({
  open,
  onClose,
  filePath,
  onRestore,
}) => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadBackups();
    }
  }, [open, filePath]);

  const loadBackups = async () => {
    setLoading(true);
    setError(null);
    try {
      const backupList = await orcscApi.getFileHistory(filePath);
      setBackups(backupList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupPath: string) => {
    setLoading(true);
    setError(null);
    try {
      await orcscApi.restoreFromBackup(filePath, backupPath);
      onRestore();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    } finally {
      setLoading(false);
    }
  };

  // Only allow restoring to any backup except the most recent one
  const canRestoreToBackup = (index: number) => {
    // Don't allow restoring to the most recent backup (current version)
    return index !== 0;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>File History</DialogTitle>
      <DialogContent>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <CircularProgress />
          </div>
        )}
        {error && (
          <Typography color="error" style={{ padding: '20px' }}>
            {error}
          </Typography>
        )}
        {!loading && !error && backups.length === 0 && (
          <Typography style={{ padding: '20px' }}>
            No backup history found for this file.
          </Typography>
        )}
        {!loading && !error && backups.length > 0 && (
          <List>
            {backups.map((backup, index) => (
              <ListItem key={backup.path}>
                <ListItemText
                  primary={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {backup.filename}
                      {index === 0 && (
                        <Chip
                          label="Current"
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </div>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(backup.timestamp), 'PPpp')}
                      </Typography>
                      {backup.change_summary && (
                        <Typography variant="body2" color="text.secondary" style={{ marginTop: '4px' }}>
                          {backup.change_summary}
                        </Typography>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  {canRestoreToBackup(index) ? (
                    <Tooltip title="Restore to this version">
                      <IconButton
                        edge="end"
                        aria-label="restore"
                        onClick={() => handleRestore(backup.path)}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Current version">
                      <span>
                        <IconButton
                          edge="end"
                          aria-label="restore"
                          disabled
                        >
                          <RestoreIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 