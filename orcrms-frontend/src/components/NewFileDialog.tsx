import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import { YachtClass } from '../types/orcsc';
import { quickClasses } from '../config/quickClasses';

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
    const [selectedQuickClassIds, setSelectedQuickClassIds] = useState<string[]>([]);

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

    const handleAddQuickClasses = () => {
        setNewFileData(prev => {
            const existingIds = new Set(prev.classes.map(cls => cls.classId));
            const toAdd = quickClasses
                .filter(cls => selectedQuickClassIds.includes(cls.classId) && !existingIds.has(cls.classId))
                .map(cls => ({
                    classId: cls.classId,
                    className: cls.className,
                    yachtClass: cls.yachtClass
                }));
            return {
                ...prev,
                classes: [...prev.classes, ...toAdd]
            };
        });
        setSelectedQuickClassIds([]);
    };

    const handleCreateNewFile = async () => {
        try {
            const uuid = uuidv4();
            // Get user's timezone offset in seconds
            const userTimezoneOffsetMinutes = new Date().getTimezoneOffset();
            const userTimezoneOffsetSeconds = -userTimezoneOffsetMinutes * 60; // negate because getTimezoneOffset returns negative of UTC offset
            
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
                })),
                filename: `${uuid}.orcsc`,
                timezoneOffsetSeconds: userTimezoneOffsetSeconds
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
            setSelectedQuickClassIds([]);
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
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                            <FormControl fullWidth size="small">
                                <Select
                                    multiple
                                    displayEmpty
                                    value={selectedQuickClassIds}
                                    onChange={(e) => setSelectedQuickClassIds(e.target.value as string[])}
                                    input={<OutlinedInput />}
                                    renderValue={(selected) => {
                                        if (selected.length === 0) {
                                            return 'Select quick classes';
                                        }
                                        return selected
                                            .map((id) => {
                                                const cls = quickClasses.find(qc => qc.classId === id);
                                                return cls ? `${cls.classId} ${cls.className}` : id;
                                            })
                                            .join(', ');
                                    }}
                                >
                                    {quickClasses.map((cls) => (
                                        <MenuItem key={cls.classId} value={cls.classId}>
                                            <Checkbox checked={selectedQuickClassIds.includes(cls.classId)} />
                                            <ListItemText
                                                primary={`${cls.classId} ${cls.className}`}
                                                secondary={cls.yachtClass === YachtClass.ORC ? 'ORC' : 'One Design'}
                                            />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={handleAddQuickClasses}
                                disabled={selectedQuickClassIds.length === 0}
                                sx={{ alignSelf: 'flex-start' }}
                            >
                                Add Selected Classes
                            </Button>
                        </Box>
                        <TableContainer component={Paper} sx={{ maxWidth: '500px' }}>
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell width="80px" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Class ID</TableCell>
                                        <TableCell width="200px" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Class Name</TableCell>
                                        <TableCell width="120px" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Yacht Class</TableCell>
                                        <TableCell width="40px" align="right" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Actions</TableCell>
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