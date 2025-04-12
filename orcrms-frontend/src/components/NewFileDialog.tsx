import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    FormControl,
    Select,
    MenuItem
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import { YachtClass } from '../types/orcsc';

interface NewFileDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (filePath: string) => void;
}

interface ClassData {
    classId: string;
    className: string;
    yachtClass: YachtClass;
}

export const NewFileDialog: React.FC<NewFileDialogProps> = ({ open, onClose, onSuccess }) => {
    const [newFileData, setNewFileData] = useState({
        eventTitle: '',
        venue: 'Haifa Bay',
        organizer: 'CYC',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        classes: [] as ClassData[]
    });

    const handleAddClass = () => {
        setNewFileData(prev => ({
            ...prev,
            classes: [...prev.classes, { classId: '', className: '', yachtClass: YachtClass.ORC }]
        }));
    };

    const handleRemoveClass = (index: number) => {
        setNewFileData(prev => ({
            ...prev,
            classes: prev.classes.filter((_, i) => i !== index)
        }));
    };

    const handleUpdateClass = (index: number, field: keyof ClassData, value: string | YachtClass) => {
        setNewFileData(prev => ({
            ...prev,
            classes: prev.classes.map((cls, i) => 
                i === index ? { ...cls, [field]: value } : cls
            )
        }));
    };

    const handleCreateNewFile = async () => {
        try {
            const response = await orcscApi.createNewFile({
                title: newFileData.eventTitle,
                startDate: newFileData.startDate,
                endDate: newFileData.endDate,
                location: newFileData.venue,
                organizer: newFileData.organizer,
                classes: newFileData.classes.map(cls => ({
                    ClassId: cls.classId,
                    ClassName: cls.className,
                    _class_enum: cls.yachtClass,
                    Discards: 0,
                    DivFromOverall: false,
                    TimeLimitFormulae: null,
                    ResultScoring: 0,
                    UseBoatIW: false,
                    EnableA9: null,
                    HeatState: null,
                    DayNo: null
                }))
            });
            onClose();
            setNewFileData({
                eventTitle: '',
                venue: 'Haifa Bay',
                organizer: 'CYC',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                classes: []
            });
            onSuccess(response.file_path);
        } catch (error) {
            console.error('Error creating new file:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Scoring File</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, maxWidth: '500px', mx: 'auto' }}>
                    <TextField
                        label="Event Title"
                        value={newFileData.eventTitle}
                        onChange={(e) => setNewFileData({ ...newFileData, eventTitle: e.target.value })}
                        fullWidth
                        required
                        size="small"
                    />
                    <TextField
                        label="Venue"
                        value={newFileData.venue}
                        onChange={(e) => setNewFileData({ ...newFileData, venue: e.target.value })}
                        fullWidth
                        size="small"
                    />
                    <TextField
                        label="Organizer"
                        value={newFileData.organizer}
                        onChange={(e) => setNewFileData({ ...newFileData, organizer: e.target.value })}
                        fullWidth
                        size="small"
                    />
                    <TextField
                        label="Start Date"
                        type="date"
                        value={newFileData.startDate}
                        onChange={(e) => {
                            const newStartDate = e.target.value;
                            setNewFileData(prev => ({
                                ...prev,
                                startDate: newStartDate,
                                endDate: newStartDate > prev.endDate ? newStartDate : prev.endDate
                            }));
                        }}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        size="small"
                    />
                    <TextField
                        label="End Date"
                        type="date"
                        value={newFileData.endDate}
                        onChange={(e) => setNewFileData({ ...newFileData, endDate: e.target.value })}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        size="small"
                    />
                    
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Classes
                        </Typography>
                        <TableContainer component={Paper} sx={{ maxWidth: '500px' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="80px">Class ID</TableCell>
                                        <TableCell width="200px">Class Name</TableCell>
                                        <TableCell width="120px">Yacht Class</TableCell>
                                        <TableCell width="40px" align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {newFileData.classes.map((cls, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    value={cls.classId}
                                                    onChange={(e) => {
                                                        const value = e.target.value.toUpperCase();
                                                        handleUpdateClass(index, 'classId', value);
                                                    }}
                                                    fullWidth
                                                    sx={{ maxWidth: '80px' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    value={cls.className}
                                                    onChange={(e) => handleUpdateClass(index, 'className', e.target.value)}
                                                    fullWidth
                                                    sx={{ maxWidth: '200px' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <FormControl fullWidth size="small" sx={{ maxWidth: '120px' }}>
                                                    <Select
                                                        value={cls.yachtClass}
                                                        onChange={(e) => handleUpdateClass(index, 'yachtClass', e.target.value as YachtClass)}
                                                    >
                                                        <MenuItem value={YachtClass.ORC}>ORC</MenuItem>
                                                        <MenuItem value={YachtClass.OneDesign}>One Design</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemoveClass(index)}
                                                    color="error"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Button
                            startIcon={<AddIcon />}
                            onClick={handleAddClass}
                            sx={{ mt: 1 }}
                            size="small"
                        >
                            Add Class
                        </Button>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} size="small">Cancel</Button>
                <Button 
                    onClick={handleCreateNewFile}
                    variant="contained"
                    disabled={!newFileData.eventTitle || newFileData.classes.length === 0}
                    size="small"
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 