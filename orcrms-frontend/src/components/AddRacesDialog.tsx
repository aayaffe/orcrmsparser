import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Box,
    Typography,
    Chip,
} from '@mui/material';
import { orcscApi } from '../api/orcscApi';
import type { OrcscFile } from '../types/orcsc';

interface AddRacesDialogProps {
    open: boolean;
    onClose: () => void;
    fileData: OrcscFile;
    onSuccess: () => void;
}

export const AddRacesDialog: React.FC<AddRacesDialogProps> = ({
    open,
    onClose,
    fileData,
    onSuccess,
}) => {
    const [raceName, setRaceName] = useState('');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [startTime, setStartTime] = useState('');
    const [scoringType, setScoringType] = useState('LowPoint');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        try {
            if (!raceName || selectedClasses.length === 0 || !startTime) {
                setError('Please fill in all required fields');
                return;
            }

            if (!fileData.filePath) {
                setError('File path is missing');
                return;
            }

            // Keep the local time without converting to UTC
            const formattedStartTime = startTime;

            const races = selectedClasses.map(classId => ({
                RaceName: raceName,
                ClassId: classId,
                StartTime: formattedStartTime,
                ScoringType: scoringType,
            }));

            await orcscApi.addRaces(fileData.filePath, races);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add races');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Races</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Race Name"
                            value={raceName}
                            onChange={(e) => setRaceName(e.target.value)}
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>Classes</InputLabel>
                            <Select
                                multiple
                                value={selectedClasses}
                                onChange={(e) => setSelectedClasses(e.target.value as string[])}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => (
                                            <Chip
                                                key={value}
                                                label={fileData.classes.find(c => c.ClassId === value)?.ClassName || value}
                                            />
                                        ))}
                                    </Box>
                                )}
                            >
                                {fileData.classes.map((cls) => (
                                    <MenuItem key={cls.ClassId} value={cls.ClassId}>
                                        {cls.ClassName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Start Time"
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>Scoring Type</InputLabel>
                            <Select
                                value={scoringType}
                                onChange={(e) => setScoringType(e.target.value)}
                            >
                                <MenuItem value="LowPoint">Low Point</MenuItem>
                                <MenuItem value="HighPoint">High Point</MenuItem>
                                <MenuItem value="BonusPoint">Bonus Point</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    Add Races
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 