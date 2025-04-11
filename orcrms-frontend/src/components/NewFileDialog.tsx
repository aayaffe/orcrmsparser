import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box
} from '@mui/material';
import { orcscApi } from '../api/orcscApi';

interface NewFileDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (filePath: string) => void;
}

export const NewFileDialog: React.FC<NewFileDialogProps> = ({ open, onClose, onSuccess }) => {
    const [newFileData, setNewFileData] = useState({
        eventTitle: '',
        venue: 'Haifa Bay',
        organizer: 'CYC',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const handleCreateNewFile = async () => {
        try {
            const response = await orcscApi.createNewFile({
                title: newFileData.eventTitle,
                startDate: newFileData.startDate,
                endDate: newFileData.endDate,
                location: newFileData.venue,
                organizer: newFileData.organizer,
                classes: []
            });
            onClose();
            setNewFileData({
                eventTitle: '',
                venue: 'Haifa Bay',
                organizer: 'CYC',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0]
            });
            onSuccess(response.file_path);
        } catch (error) {
            console.error('Error creating new file:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Create New Scoring File</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField
                        label="Event Title"
                        value={newFileData.eventTitle}
                        onChange={(e) => setNewFileData({ ...newFileData, eventTitle: e.target.value })}
                        fullWidth
                        required
                    />
                    <TextField
                        label="Venue"
                        value={newFileData.venue}
                        onChange={(e) => setNewFileData({ ...newFileData, venue: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="Organizer"
                        value={newFileData.organizer}
                        onChange={(e) => setNewFileData({ ...newFileData, organizer: e.target.value })}
                        fullWidth
                    />
                    <TextField
                        label="Start Date"
                        type="date"
                        value={newFileData.startDate}
                        onChange={(e) => setNewFileData({ ...newFileData, startDate: e.target.value })}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        value={newFileData.endDate}
                        onChange={(e) => setNewFileData({ ...newFileData, endDate: e.target.value })}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleCreateNewFile}
                    variant="contained"
                    disabled={!newFileData.eventTitle}
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 