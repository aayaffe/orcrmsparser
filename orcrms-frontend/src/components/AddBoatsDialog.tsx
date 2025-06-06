import React, { useState, useRef, useEffect } from 'react';
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
    Box,
    IconButton,
    Typography,
    Stack
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import type { OrcscFile, FleetRow } from '../types/orcsc';

interface AddBoatsDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    fileData: OrcscFile;
}

interface BoatData {
    yachtName: string;
    sailNo: string;
    classId: string;
}

const CustomSelect = React.forwardRef<HTMLSelectElement, any>((props: any, ref: any) => {
    const { value, onChange, onKeyDown, classes, ...other } = props;
    const [isOpen, setIsOpen] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isOpen) {
            e.preventDefault();
            onKeyDown?.(e);
        } else if (e.key === 'Enter' && isOpen) {
            // Let the Select handle Enter when open
            return;
        } else {
            onKeyDown?.(e);
        }
    };

    return (
        <Select
            {...other}
            ref={ref}
            value={value}
            onChange={onChange}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            onKeyDown={handleKeyDown}
        />
    );
});

export const AddBoatsDialog: React.FC<AddBoatsDialogProps> = ({ open, onClose, onSuccess, fileData }) => {
    const [boats, setBoats] = useState<BoatData[]>([{ yachtName: '', sailNo: '', classId: '' }]);
    const [error, setError] = useState<string | null>(null);
    const yachtNameRefs = useRef<(HTMLInputElement | null)[]>([]);
    const sailNoRefs = useRef<(HTMLInputElement | null)[]>([]);
    const classRefs = useRef<(HTMLSelectElement | null)[]>([]);

    // Reset state when dialog opens
    useEffect(() => {
        if (open) {
            setBoats([{ yachtName: '', sailNo: '', classId: '' }]);
            setError(null);
        }
    }, [open]);

    const handleAddBoat = () => {
        setBoats(prev => [...prev, { yachtName: '', sailNo: '', classId: '' }]);
    };

    const handleRemoveBoat = (index: number) => {
        setBoats(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateBoat = (index: number, field: keyof BoatData, value: string) => {
        setBoats(prev => prev.map((boat, i) => 
            i === index ? { ...boat, [field]: value } : boat
        ));
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && index === boats.length - 1) {
            e.preventDefault();
            handleAddBoat();
            setTimeout(() => {
                yachtNameRefs.current[boats.length]?.focus();
            }, 0);
        }
    };

    const handleSubmit = async () => {
        try {
            setError(null);
            const fleetRows: FleetRow[] = boats.map(boat => ({
                yachtName: boat.yachtName,
                sailNo: boat.sailNo || undefined,
                classId: boat.classId,
                CTOT: 1
            }));

            await orcscApi.addBoats(fileData.filePath, fleetRows);
            onSuccess();
            onClose();
            setBoats([{ yachtName: '', sailNo: '', classId: '' }]);
        } catch (err) {
            setError('Failed to add boats. Please try again.');
            console.error('Error adding boats:', err);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Add Boats to Fleet</DialogTitle>
            <DialogContent>
                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                <Stack spacing={2}>
                    {boats.map((boat, index) => (
                        <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField
                                inputRef={el => yachtNameRefs.current[index] = el}
                                label="Yacht Name"
                                value={boat.yachtName}
                                onChange={(e) => handleUpdateBoat(index, 'yachtName', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                fullWidth
                                autoFocus={index === 0}
                            />
                            <TextField
                                inputRef={el => sailNoRefs.current[index] = el}
                                label="Sail Number"
                                value={boat.sailNo}
                                onChange={(e) => handleUpdateBoat(index, 'sailNo', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                fullWidth
                            />
                            <FormControl fullWidth>
                                <InputLabel>Class</InputLabel>
                                <CustomSelect
                                    inputRef={(el: HTMLSelectElement | null) => classRefs.current[index] = el}
                                    value={boat.classId}
                                    label="Class"
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateBoat(index, 'classId', e.target.value)}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLSelectElement>) => {
                                        if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                                            e.preventDefault();
                                            const matchingClass = fileData.classes.find(cls => 
                                                cls.ClassName.toLowerCase().startsWith(e.key.toLowerCase())
                                            );
                                            if (matchingClass) {
                                                handleUpdateBoat(index, 'classId', matchingClass.ClassId);
                                            }
                                        } else {
                                            handleKeyDown(index, e);
                                        }
                                    }}
                                >
                                    {fileData.classes.map((cls) => (
                                        <MenuItem key={cls.ClassId} value={cls.ClassId}>
                                            {cls.ClassName}
                                        </MenuItem>
                                    ))}
                                </CustomSelect>
                            </FormControl>
                            {boats.length > 1 && (
                                <IconButton onClick={() => handleRemoveBoat(index)} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            )}
                        </Box>
                    ))}
                    <Button
                        startIcon={<AddIcon />}
                        onClick={handleAddBoat}
                        variant="outlined"
                        sx={{ alignSelf: 'flex-start' }}
                    >
                        Add Another Boat
                    </Button>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={boats.some(boat => !boat.yachtName || !boat.classId)}
                >
                    Add Boats
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 