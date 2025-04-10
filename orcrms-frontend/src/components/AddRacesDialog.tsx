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
    Grid,
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

            const races = selectedClasses.map(classId => ({
                RaceName: raceName,
                ClassId: classId,
                StartTime: Math.floor(new Date(startTime).getTime() / 1000).toString(),
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
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Race Name"
                                value={raceName}
                                onChange={(e) => setRaceName(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
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
                        </Grid>
                        <Grid item xs={12}>
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
                        </Grid>
                        <Grid item xs={12}>
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
                        </Grid>
                    </Grid>
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