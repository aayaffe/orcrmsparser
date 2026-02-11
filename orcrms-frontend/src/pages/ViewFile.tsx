import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Alert,
    Container,
    Button,
    AppBar,
    Toolbar,
    IconButton,

    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableSortLabel,
    Checkbox
} from '@mui/material';
import {
    Menu as MenuIcon,
    Add as AddIcon,
    History as HistoryIcon,
    Description as CsvIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import type { OrcscFile, YachtClass } from '../types/orcsc';
import { AddRacesDialog } from '../components/AddRacesDialog';
import { SideMenu } from '../components/SideMenu';
import { AddClassDialog } from '../components/AddClassDialog';
import { NewFileDialog } from '../components/NewFileDialog';
import { AddBoatsDialog } from '../components/AddBoatsDialog';
import { FileHistoryDialog } from '../components/FileHistoryDialog';
import { ImportBoatsWizard } from '../components/ImportBoatsWizard';
import { OrcDbDialog } from '../components/OrcDbDialog';
import OrcLogoImg from '../assets/orc-logo.png';
    
const drawerWidth = 340;

const formatDate = (dateString: string | number): string => {
    try {
        // First try to parse as a Unix timestamp
        const timestamp = Number(dateString);
        if (!isNaN(timestamp)) {
            const date = new Date(timestamp * 1000);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                    timeZone: 'UTC'
                }).replace(',', '');
            }
        }

        // If that fails, try to parse as a date string
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
                timeZone: 'UTC'
            }).replace(',', '');
        }

        // If all parsing attempts fail, return the original string
        return String(dateString);
    } catch (error) {
        console.error('Error formatting date:', error);
        return String(dateString);
    }
};

const formatDateOnly = (dateString: string | number): string => {
    try {
        // First try to parse as a Unix timestamp
        const timestamp = Number(dateString);
        if (!isNaN(timestamp)) {
            const date = new Date(timestamp * 1000);
            if (!isNaN(date.getTime())) {
                return date.toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        }

        // If that fails, try to parse as a date string
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        // If all parsing attempts fail, return the original string
        return String(dateString);
    } catch (error) {
        console.error('Error formatting date:', error);
        return String(dateString);
    }
};

type AssignBoat = {
    YID?: string;
    YachtName: string;
    SailNo?: string | null;
    ClassId?: string;
};

type AssignClassesDialogProps = {
    open: boolean;
    boats: AssignBoat[];
    classes: Array<{ ClassId: string; ClassName: string }>;
    onAssign: (assignments: { [index: number]: string }) => void;
    onClose: () => void;
};

// AssignClassesDialog placeholder
const AssignClassesDialog = ({ open, boats, classes, onAssign, onClose }: AssignClassesDialogProps) => {
    // If multiple boats, use a single class selector
    const [singleClass, setSingleClass] = useState('');
    const [assignments, setAssignments] = useState<{ [index: number]: string }>({});
    const handleChange = (i: number, classId: string) => {
        setAssignments(prev => ({ ...prev, [i]: classId }));
    };
    const handleAssign = () => {
        if (boats.length > 1) {
            // Assign the same class to all
            const all = Object.fromEntries(boats.map((_, i) => [i, singleClass]));
            onAssign(all);
        } else {
            onAssign(assignments);
        }
    };
    const handleClose = () => {
        setSingleClass('');
        setAssignments({});
        onClose();
    };
    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Assign Classes to {boats.length > 1 ? 'Selected Boats' : 'Imported Boat'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    {boats.length > 1 ? (
                        <FormControl fullWidth>
                            <InputLabel>Class</InputLabel>
                            <Select
                                value={singleClass}
                                label="Class"
                                onChange={e => setSingleClass(e.target.value)}
                            >
                                {classes.map((cls) => (
                                    <MenuItem key={cls.ClassId} value={cls.ClassId}>{cls.ClassName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        boats.map((boat, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography sx={{ minWidth: 200 }}>{boat.YachtName} ({boat.SailNo})</Typography>
                                <FormControl fullWidth>
                                    <InputLabel>Class</InputLabel>
                                    <Select
                                        value={assignments[i] || ''}
                                        label="Class"
                                        onChange={e => handleChange(i, e.target.value)}
                                    >
                                        {classes.map((cls) => (
                                            <MenuItem key={cls.ClassId} value={cls.ClassId}>{cls.ClassName}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        ))
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button variant="contained" onClick={handleAssign} disabled={boats.length > 1 && !singleClass}>Assign</Button>
            </DialogActions>
        </Dialog>
    );
};

export const ViewFile: React.FC = () => {
    const { filePath } = useParams<{ filePath: string }>();
    const [fileData, setFileData] = useState<OrcscFile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addRacesOpen, setAddRacesOpen] = useState(false);
    const [files, setFiles] = useState<{ path: string; eventName: string }[]>([]);
    const versionInputRef = useRef<HTMLInputElement>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const navigate = useNavigate();
    const [newFileOpen, setNewFileOpen] = useState(false);
    const [addClassOpen, setAddClassOpen] = useState(false);
    const [addBoatsOpen, setAddBoatsOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [importWizardOpen, setImportWizardOpen] = useState(false);
    const [orcDbDialogOpen, setOrcDbDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [boatsToAssign, setBoatsToAssign] = useState<AssignBoat[]>([]);
    const [fleetSort, setFleetSort] = useState<'yachtName' | 'sailNo' | 'class' | 'rating' | 'CDL'>('yachtName');
    const [fleetSortDir, setFleetSortDir] = useState<'asc' | 'desc'>('asc');
    const [selectedBoatIndices, setSelectedBoatIndices] = useState<number[]>([]);
    const [bulkRating, setBulkRating] = useState('');
    const [raceSort, setRaceSort] = useState<'raceName' | 'class' | 'startTime'>('raceName');
    const [raceSortDir, setRaceSortDir] = useState<'asc' | 'desc'>('asc');
    const handleRaceSort = (col: 'raceName' | 'class' | 'startTime') => {
        if (raceSort === col) {
            setRaceSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setRaceSort(col);
            setRaceSortDir('asc');
        }
    };
    const sortedRaces = fileData && fileData.races ? [...fileData.races].sort((a, b) => {
        let cmp = 0;
        if (raceSort === 'raceName') {
            cmp = a.RaceName.localeCompare(b.RaceName);
        } else if (raceSort === 'class') {
            cmp = (a.ClassId || '').localeCompare(b.ClassId || '');
        } else if (raceSort === 'startTime') {
            cmp = a.StartTime.localeCompare(b.StartTime);
        }
        return raceSortDir === 'asc' ? cmp : -cmp;
    }) : [];

    const fetchFile = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching file with path:', filePath);
            const data = await orcscApi.getFile(filePath!);
            setFileData(data);
        } catch (err) {
            console.error('Error fetching file:', err);
            setError('Failed to load file');
        } finally {
            setLoading(false);
        }
    }, [filePath]);

    const fetchFiles = useCallback(async () => {
        try {
            const fileList = await orcscApi.listFiles();
            const fileData = await Promise.all(
                fileList.map(async (file) => {
                    try {
                        const data = await orcscApi.getFile(file.path);
                        return {
                            path: file.path,
                            eventName: data.event.EventTitle
                        };
                    } catch (err) {
                        console.error(`Error loading file ${file.path}:`, err);
                        return null;
                    }
                })
            );
            setFiles(fileData.filter((file): file is { path: string; eventName: string } => file !== null));
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    }, []);

    useEffect(() => {
        if (filePath) {
            fetchFile();
            fetchFiles();
        }
    }, [filePath, fetchFile, fetchFiles]);

    const handleAddRacesSuccess = () => {
        setAddRacesOpen(false);
        fetchFile();
    };

    const handleDownload = async () => {
        if (filePath) {
            try {
                await orcscApi.downloadFile(filePath);
            } catch (error) {
                console.error('Error downloading file:', error);
            }
        }
    };

    const handleDelete = async (path: string) => {
        const filename = path.split(/[\\/]/).pop() || path;
        const confirmed = window.confirm(`Delete ${filename}? This cannot be undone.`);
        if (!confirmed) return;

        try {
            await orcscApi.deleteFile(path);
            await fetchFiles();
            navigate('/');
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                // Check if file with same name already exists
                const filename = file.name;
                const existingFile = files.find(f => f.path.endsWith(filename));
                
                if (existingFile) {
                    // File exists, ask user if they want to update
                    const shouldUpdate = window.confirm(
                        `A file named "${filename}" already exists. Do you want to replace it? The old version will be saved to history.`
                    );
                    if (shouldUpdate) {
                        await orcscApi.updateFileVersion(existingFile.path, file);
                        await fetchFiles();
                        if (filePath === existingFile.path) {
                            await fetchFile();
                        }
                    }
                } else {
                    // New file, upload normally
                    await orcscApi.uploadFile(file);
                    await fetchFiles();
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                alert('Error uploading file');
            }
        }
    };

    const handleUploadNewVersion = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && filePath) {
            try {
                await orcscApi.updateFileVersion(filePath, file);
                await fetchFile();
                alert('File updated successfully. The previous version has been saved to history.');
                // Reset the input so the same file can be selected again
                if (versionInputRef.current) {
                    versionInputRef.current.value = '';
                }
            } catch (error) {
                console.error('Error updating file:', error);
                alert('Error updating file');
            }
        }
    }, [filePath, fetchFile]);

    const handleFileSelect = (file: string) => {
        navigate(`/view/${encodeURIComponent(file)}`);
    };

    const handleNewFileSuccess = (filePath: string) => {
        setNewFileOpen(false);
        navigate(`/view/${encodeURIComponent(filePath)}`);
    };

    const handleHome = () => {
        navigate('/');
    };

    const handleAddClass = async (classId: string, className: string, yachtClass: YachtClass) => {
        try {
            if (filePath && fileData) {
                await orcscApi.addClass(filePath, {
                    ClassId: classId,
                    ClassName: className,
                    YachtClass: yachtClass
                });
                fetchFile(); // Refresh the file data
            }
        } catch (error) {
            console.error('Error adding class:', error);
        }
    };

    const handleAddBoatsSuccess = () => {
        setAddBoatsOpen(false);
        fetchFile();
    };

    const handleRestoreSuccess = () => {
        fetchFile();
    };

    const handleDeleteClass = async (classId: string, className: string) => {
        const confirmed = window.confirm(`Delete class "${className}" (${classId})? This cannot be undone.`);
        if (!confirmed) return;

        try {
            await orcscApi.deleteClass(filePath!, classId);
            fetchFile();
        } catch (error) {
            console.error('Error deleting class:', error);
            alert('Failed to delete class');
        }
    };

    const handleDeleteRace = async (raceId: string, raceName: string) => {
        const confirmed = window.confirm(`Delete race "${raceName}"? This cannot be undone.`);
        if (!confirmed) return;

        try {
            await orcscApi.deleteRace(filePath!, raceId);
            fetchFile();
        } catch (error) {
            console.error('Error deleting race:', error);
            alert('Failed to delete race');
        }
    };

    const handleDeleteBoat = async (yid: string, yachtName: string) => {
        const confirmed = window.confirm(`Delete boat "${yachtName}"? This cannot be undone.`);
        if (!confirmed) return;

        try {
            await orcscApi.deleteBoat(filePath!, yid);
            fetchFile();
        } catch (error) {
            console.error('Error deleting boat:', error);
            alert('Failed to delete boat');
        }
    };

    const getBoatRatingValue = (boat: OrcscFile['fleet'][number]) => {
        if (!bulkRating) return null;
        const raw = (boat as Record<string, unknown>)[bulkRating];
        if (raw === null || raw === undefined || raw === '') return null;
        if (typeof raw === 'number') return raw.toFixed(4);
        return String(raw);
    };

    const handleSort = (col: 'yachtName' | 'sailNo' | 'class' | 'rating' | 'CDL') => {
        if (fleetSort === col) {
            setFleetSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setFleetSort(col);
            setFleetSortDir('asc');
        }
    };

    const handleSelectBoat = (idx: number) => {
        setSelectedBoatIndices(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
    };
    const handleSelectAllBoats = (checked: boolean) => {
        if (checked) {
            setSelectedBoatIndices(sortedFleet.map((_, idx) => idx));
        } else {
            setSelectedBoatIndices([]);
        }
    };

    const sortedFleet = fileData && fileData.fleet ? [...fileData.fleet].sort((a, b) => {
        let cmp = 0;
        if (fleetSort === 'yachtName') {
            cmp = a.YachtName.localeCompare(b.YachtName);
        } else if (fleetSort === 'sailNo') {
            cmp = (a.SailNo || '').localeCompare(b.SailNo || '');
        } else if (fleetSort === 'class') {
            cmp = (a.ClassId || '').localeCompare(b.ClassId || '');
        } else if (fleetSort === 'CDL') {
            const aVal = a.CDL || 0;
            const bVal = b.CDL || 0;
            cmp = aVal - bVal;
        } else if (fleetSort === 'rating' && bulkRating) {
            const aVal = (a as Record<string, unknown>)[bulkRating];
            const bVal = (b as Record<string, unknown>)[bulkRating];
            const aNum = typeof aVal === 'number' ? aVal : 0;
            const bNum = typeof bVal === 'number' ? bVal : 0;
            cmp = aNum - bNum;
        }
        return fleetSortDir === 'asc' ? cmp : -cmp;
    }) : [];
    const selectedBoats = selectedBoatIndices.map(idx => sortedFleet[idx]);

    if (!filePath) {
        return <Alert severity="error">No file path provided</Alert>;
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        ORCSC Parser
                    </Typography>
                    <IconButton
                        color="inherit"
                        onClick={() => setHistoryOpen(true)}
                        sx={{ ml: 2 }}
                    >
                        <HistoryIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <SideMenu
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onUpload={handleFileUpload}
                onNewFile={() => setNewFileOpen(true)}
                onDownload={handleDownload}
                onFileSelect={handleFileSelect}
                onDelete={handleDelete}
                onHome={handleHome}
                files={files}
                selectedFile={filePath}
            />

            <NewFileDialog
                open={newFileOpen}
                onClose={() => setNewFileOpen(false)}
                onSuccess={handleNewFileSuccess}
            />

            <FileHistoryDialog
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                filePath={filePath!}
                onRestore={handleRestoreSuccess}
            />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 1, sm: 2 },
                    width: '100%',
                    ml: { xs: 0, sm: isDrawerOpen ? `${drawerWidth}px` : 0 },
                    mt: '64px',
                    transition: (theme) =>
                        theme.transitions.create('margin', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                }}
            >
                <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 3 } }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={2}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : fileData ? (
                        <Box>
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: { xs: 'column', sm: 'row' },
                                justifyContent: 'space-between', 
                                alignItems: { xs: 'flex-start', sm: 'center' }, 
                                mb: 3,
                                gap: { xs: 2, sm: 0 }
                            }}>
                                <Box>
                                    <Typography variant="h4" gutterBottom sx={{ mb: { xs: 0, sm: 1 } }}>
                                        {fileData.event.EventTitle}
                                    </Typography>
                                </Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => versionInputRef.current?.click()}
                                    sx={{ whiteSpace: 'nowrap' }}
                                >
                                    Upload New Version
                                </Button>
                            </Box>
                            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                                {fileData.event.Venue}{(fileData.event.Venue && fileData.event.Organizer) ? (" - ") : ("")}{fileData.event.Organizer}
                            </Typography>

                            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Event Details
                                    </Typography>
                                </Box>
                                <Stack spacing={2}>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                                                Start Date:
                                            </Typography>
                                            <Typography variant="body2">
                                                {formatDateOnly(fileData.event.StartDate)}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                                                End Date:
                                            </Typography>
                                            <Typography variant="body2">
                                                {formatDateOnly(fileData.event.EndDate)}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                                                Venue:
                                            </Typography>
                                            <Typography variant="body2">
                                                {fileData.event.Venue}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                                                Organizer:
                                            </Typography>
                                            <Typography variant="body2">
                                                {fileData.event.Organizer}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </Paper>

                            <input
                                type="file"
                                ref={versionInputRef}
                                onChange={handleUploadNewVersion}
                                accept=".orcsc"
                                style={{ display: 'none' }}
                            />

                            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                                        Classes
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setAddClassOpen(true)}
                                        size="small"
                                    >
                                        Add
                                    </Button>
                                </Box>
                                <Stack spacing={2}>
                                    {fileData.classes.map((cls) => (
                                        <Box key={cls.ClassId} sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                                                    {cls.ClassId}:
                                                </Typography>
                                                <Typography variant="body2">
                                                    {cls.ClassName}
                                                </Typography>
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClass(cls.ClassId, cls.ClassName)}
                                                color="error"
                                                title="Delete class"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>

                            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                                        Races
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={() => setAddRacesOpen(true)}
                                        size="small"
                                    >
                                        Add
                                    </Button>
                                </Box>
                                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                                    <Table size="small" sx={{ minWidth: { xs: 600, sm: 'auto' } }}>
                                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <TableSortLabel
                                                        active={raceSort === 'raceName'}
                                                        direction={raceSort === 'raceName' ? raceSortDir : 'asc'}
                                                        onClick={() => handleRaceSort('raceName')}
                                                    >
                                                        Race Name
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <TableSortLabel
                                                        active={raceSort === 'class'}
                                                        direction={raceSort === 'class' ? raceSortDir : 'asc'}
                                                        onClick={() => handleRaceSort('class')}
                                                    >
                                                        Class
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <TableSortLabel
                                                        active={raceSort === 'startTime'}
                                                        direction={raceSort === 'startTime' ? raceSortDir : 'asc'}
                                                        onClick={() => handleRaceSort('startTime')}
                                                    >
                                                        Start Time
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedRaces.map((race) => {
                                                const cls = fileData.classes.find(c => c.ClassId === race.ClassId);
                                                return (
                                                    <TableRow key={race.RaceId}>
                                                        <TableCell>{race.RaceName}</TableCell>
                                                        <TableCell>{cls ? cls.ClassName : race.ClassId}</TableCell>
                                                        <TableCell>{formatDate(race.StartTime)}</TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteRace(race.RaceId, race.RaceName)}
                                                                color="error"
                                                                title="Delete race"
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>

                            <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: 'space-between', 
                                    alignItems: { xs: 'stretch', sm: 'center' }, 
                                    mb: 2,
                                    gap: 2
                                }}>
                                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
                                        <Typography variant="h6" gutterBottom sx={{ m: 0 }}>
                                            Fleet
                                        </Typography>
                                        <Select
                                            size="small"
                                            value={bulkRating}
                                            onChange={(e) => {
                                                setBulkRating(e.target.value);
                                                setFleetSort('rating');
                                                setFleetSortDir('desc');
                                            }}
                                            displayEmpty
                                            sx={{ minWidth: { xs: '100%', sm: 200 } }}
                                        >
                                            <MenuItem value="">Select rating...</MenuItem>
                                            <MenuItem value="TN_Inshore_Low">TOT Inshore Low</MenuItem>
                                            <MenuItem value="TN_Inshore_Medium">TOT Inshore Medium</MenuItem>
                                            <MenuItem value="TN_Inshore_High">TOT Inshore High</MenuItem>
                                            <MenuItem value="TN_Offshore_Low">TOT Offshore Low</MenuItem>
                                            <MenuItem value="TN_Offshore_Medium">TOT Offshore Medium</MenuItem>
                                            <MenuItem value="TN_Offshore_High">TOT Offshore High</MenuItem>
                                            <MenuItem value="TND_Inshore_Low">TOD Inshore Low</MenuItem>
                                            <MenuItem value="TND_Inshore_Medium">TOD Inshore Medium</MenuItem>
                                            <MenuItem value="TND_Inshore_High">TOD Inshore High</MenuItem>
                                            <MenuItem value="TND_Offshore_Low">TOD Offshore Low</MenuItem>
                                            <MenuItem value="TND_Offshore_Medium">TOD Offshore Medium</MenuItem>
                                            <MenuItem value="TND_Offshore_High">TOD Offshore High</MenuItem>
                                            <MenuItem value="GPH">GPH</MenuItem>
                                        </Select>
                                    </Box>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: 1,
                                        width: { xs: '100%', sm: 'auto' }
                                    }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={() => setAddBoatsOpen(true)}
                                            size="small"
                                            title="Add Boats"
                                            sx={{ borderRadius: 2, minHeight: 40, px: 2, width: { xs: '100%', sm: 'auto' } }}
                                        />
                                        <Button
                                            variant="outlined"
                                            startIcon={<><AddIcon /><CsvIcon /></>}
                                            onClick={() => setImportWizardOpen(true)}
                                            size="small"
                                            title="Import from CSV"
                                            sx={{ borderRadius: 2, minHeight: 40, px: 2, width: { xs: '100%', sm: 'auto' } }}
                                        />
                                        <Button
                                            variant="contained"
                                            startIcon={<><AddIcon /><img src={OrcLogoImg} alt="ORC" style={{ width: 24, height: 24, marginLeft: 4, borderRadius: '50%', background: '#fff' }} /></>}
                                            color="secondary"
                                            onClick={() => setOrcDbDialogOpen(true)}
                                            size="small"
                                            title="Add from ORC DB"
                                            sx={{ borderRadius: 2, minHeight: 40, px: 2, width: { xs: '100%', sm: 'auto' } }}
                                        />
                                    </Box>
                                </Box>
                                <Button
                                    variant="contained"
                                    size="small"
                                    sx={{ mb: 2 }}
                                    disabled={selectedBoatIndices.length === 0}
                                    onClick={() => {
                                        setBoatsToAssign(selectedBoats);
                                        setAssignDialogOpen(true);
                                    }}
                                >
                                    Change Class for Selected
                                </Button>
                                <TableContainer component={Paper} sx={{ mb: 2, overflowX: 'auto' }}>
                                    <Table size="small" sx={{ minWidth: { xs: 800, sm: 'auto' } }}>
                                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableRow>
                                                <TableCell padding="checkbox" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <Checkbox
                                                        indeterminate={selectedBoatIndices.length > 0 && selectedBoatIndices.length < sortedFleet.length}
                                                        checked={selectedBoatIndices.length === sortedFleet.length && sortedFleet.length > 0}
                                                        onChange={e => handleSelectAllBoats(e.target.checked)}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <TableSortLabel
                                                        active={fleetSort === 'yachtName'}
                                                        direction={fleetSort === 'yachtName' ? fleetSortDir : 'asc'}
                                                        onClick={() => handleSort('yachtName')}
                                                    >
                                                        Yacht Name
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <TableSortLabel
                                                        active={fleetSort === 'sailNo'}
                                                        direction={fleetSort === 'sailNo' ? fleetSortDir : 'asc'}
                                                        onClick={() => handleSort('sailNo')}
                                                    >
                                                        Sail Number
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <TableSortLabel
                                                        active={fleetSort === 'class'}
                                                        direction={fleetSort === 'class' ? fleetSortDir : 'asc'}
                                                        onClick={() => handleSort('class')}
                                                    >
                                                        Class
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <TableSortLabel
                                                        active={fleetSort === 'CDL'}
                                                        direction={fleetSort === 'CDL' ? fleetSortDir : 'asc'}
                                                        onClick={() => handleSort('CDL')}
                                                    >
                                                        CDL
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                                                    <TableSortLabel
                                                        active={fleetSort === 'rating'}
                                                        direction={fleetSort === 'rating' ? fleetSortDir : 'asc'}
                                                        onClick={() => handleSort('rating')}
                                                    >
                                                        Rating
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sortedFleet.map((boat, idx) => {
                                                const cls = fileData.classes.find(c => c.ClassId === boat.ClassId);
                                                return (
                                                    <TableRow key={boat.YID}>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox
                                                                checked={selectedBoatIndices.includes(idx)}
                                                                onChange={() => handleSelectBoat(idx)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>{boat.YachtName}</TableCell>
                                                        <TableCell>{boat.SailNo || '---'}</TableCell>
                                                        <TableCell
                                                            sx={{ cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: 'primary.main' } }}
                                                            onClick={() => { setBoatsToAssign([boat]); setAssignDialogOpen(true); }}
                                                        >
                                                            {cls ? cls.ClassName : (boat.ClassId || 'Not assigned')}
                                                        </TableCell>
                                                        <TableCell>{boat.CDL?.toFixed(3) || 'N/A'}</TableCell>
                                                        <TableCell>{getBoatRatingValue(boat) || '—'}</TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleDeleteBoat(boat.YID || '', boat.YachtName)}
                                                                color="error"
                                                                title="Delete boat"
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>

                            <AddRacesDialog
                                open={addRacesOpen}
                                onClose={() => setAddRacesOpen(false)}
                                onSuccess={handleAddRacesSuccess}
                                fileData={fileData}
                            />

                            <AddBoatsDialog
                                open={addBoatsOpen}
                                onClose={() => setAddBoatsOpen(false)}
                                onSuccess={handleAddBoatsSuccess}
                                fileData={fileData}
                            />

                            <ImportBoatsWizard
                                open={importWizardOpen}
                                onClose={() => setImportWizardOpen(false)}
                                onImport={(boats) => { orcscApi.addBoats(filePath, boats).then(() => { fetchFile(); setImportWizardOpen(false); }); }}
                            />
                        </Box>
                    ) : null}
                </Container>
            </Box>

            <AddClassDialog
                open={addClassOpen}
                onClose={() => setAddClassOpen(false)}
                onAdd={handleAddClass}
            />
            {fileData && (
                <OrcDbDialog
                    open={orcDbDialogOpen}
                    onClose={() => setOrcDbDialogOpen(false)}
                    onSuccess={async (selectedBoats) => {
                        // Do not add boats yet, just open assign dialog
                        setBoatsToAssign(selectedBoats);
                        setAssignDialogOpen(true);
                        setOrcDbDialogOpen(false);
                    }}
                    fileData={fileData}
                />
            )}
            <AssignClassesDialog
                open={assignDialogOpen}
                boats={boatsToAssign}
                classes={fileData?.classes || []}
                onAssign={async (assignments: { [index: number]: string }) => {
                    if (!filePath) return;
                    const currentFilePath = filePath; // Narrow type for TypeScript
                    const allExisting = boatsToAssign.length > 0 && boatsToAssign.every((boat) => boat.YID);
                    if (allExisting) {
                        await Promise.all(
                            boatsToAssign.map((boat, i) =>
                                orcscApi.updateBoat(currentFilePath, {
                                    YID: boat.YID as string,
                                    classId: assignments[i] || '',
                                    yachtName: boat.YachtName,
                                    sailNo: boat.SailNo || undefined
                                })
                            )
                        );
                    } else {
                        await Promise.all(
                            boatsToAssign.map((boat, i) =>
                                orcscApi.addBoatFromOrcJson(currentFilePath, boat, assignments[i] || '')
                            )
                        );
                    }
                    await fetchFile();
                    setAssignDialogOpen(false);
                    setBoatsToAssign([]);
                    setSelectedBoatIndices([]);
                }}
                onClose={() => { setAssignDialogOpen(false); }}
            />
        </Box>
    );
}; 