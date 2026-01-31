import { useState, useEffect } from 'react';
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
    Description as CsvIcon
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

// AssignClassesDialog placeholder
const AssignClassesDialog = ({ open, boats, classes, onAssign, onClose }: any) => {
    // If multiple boats, use a single class selector
    const [singleClass, setSingleClass] = useState('');
    const [assignments, setAssignments] = useState<{ [index: number]: string }>({});
    useEffect(() => {
        if (boats.length > 1) setAssignments({});
    }, [boats.length]);
    const handleChange = (i: number, classId: string) => {
        setAssignments(prev => ({ ...prev, [i]: classId }));
    };
    const handleAssign = () => {
        if (boats.length > 1) {
            // Assign the same class to all
            const all = Object.fromEntries(boats.map((_: any, i: number) => [i, singleClass]));
            onAssign(all);
        } else {
            onAssign(assignments);
        }
    };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
                                {classes.map((cls: any) => (
                                    <MenuItem key={cls.ClassId} value={cls.ClassId}>{cls.ClassName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        boats.map((boat: any, i: number) => (
                            <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Typography sx={{ minWidth: 200 }}>{boat.YachtName} ({boat.SailNo})</Typography>
                                <FormControl fullWidth>
                                    <InputLabel>Class</InputLabel>
                                    <Select
                                        value={assignments[i] || ''}
                                        label="Class"
                                        onChange={e => handleChange(i, e.target.value)}
                                    >
                                        {classes.map((cls: any) => (
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
                <Button onClick={onClose}>Cancel</Button>
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
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const navigate = useNavigate();
    const [newFileOpen, setNewFileOpen] = useState(false);
    const [addClassOpen, setAddClassOpen] = useState(false);
    const [addBoatsOpen, setAddBoatsOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [importWizardOpen, setImportWizardOpen] = useState(false);
    const [orcDbDialogOpen, setOrcDbDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [boatsToAssign, setBoatsToAssign] = useState<any[]>([]);
    const [fleetSort, setFleetSort] = useState<'yachtName' | 'sailNo' | 'class'>('yachtName');
    const [fleetSortDir, setFleetSortDir] = useState<'asc' | 'desc'>('asc');
    const [selectedBoatIndices, setSelectedBoatIndices] = useState<number[]>([]);
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

    useEffect(() => {
        if (filePath) {
            fetchFile();
            fetchFiles();
        }
    }, [filePath]);

    const fetchFile = async () => {
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
    };

    const fetchFiles = async () => {
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
    };

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
                await orcscApi.uploadFile(file);
                await fetchFiles();
            } catch (error) {
                console.error('Error uploading file:', error);
            }
        }
    };

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

    const handleSort = (col: 'yachtName' | 'sailNo' | 'class') => {
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
                    p: 2,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    mt: '64px'
                }}
            >
                <Container maxWidth="lg" sx={{ py: 2 }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={2}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : fileData ? (
                        <Box>
                            <Typography variant="h4" gutterBottom>
                                {fileData.event.EventTitle}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
                                {fileData.event.Venue}{(fileData.event.Venue && fileData.event.Organizer) ? (" - ") : ("")}{fileData.event.Organizer}
                            </Typography>

                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Event Details
                                </Typography>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={2}>
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
                                    <Stack direction="row" spacing={2}>
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

                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
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
                                        <Box key={cls.ClassId} sx={{ display: 'flex', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                                                {cls.ClassId}:
                                            </Typography>
                                            <Typography variant="body2">
                                                {cls.ClassName}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>

                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
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
                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={raceSort === 'raceName'}
                                                        direction={raceSort === 'raceName' ? raceSortDir : 'asc'}
                                                        onClick={() => handleRaceSort('raceName')}
                                                    >
                                                        Race Name
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={raceSort === 'class'}
                                                        direction={raceSort === 'class' ? raceSortDir : 'asc'}
                                                        onClick={() => handleRaceSort('class')}
                                                    >
                                                        Class
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={raceSort === 'startTime'}
                                                        direction={raceSort === 'startTime' ? raceSortDir : 'asc'}
                                                        onClick={() => handleRaceSort('startTime')}
                                                    >
                                                        Start Time
                                                    </TableSortLabel>
                                                </TableCell>
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
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>

                            <Paper sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Fleet
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            onClick={() => setAddBoatsOpen(true)}
                                            size="small"
                                            title="Add Boats"
                                            sx={{ borderRadius: 2, minHeight: 40, px: 2 }}
                                        />
                                        <Button
                                            variant="outlined"
                                            startIcon={<><AddIcon /><CsvIcon /></>}
                                            onClick={() => setImportWizardOpen(true)}
                                            size="small"
                                            title="Import from CSV"
                                            sx={{ borderRadius: 2, minHeight: 40, px: 2 }}
                                        />
                                        <Button
                                            variant="contained"
                                            startIcon={<><AddIcon /><img src={OrcLogoImg} alt="ORC" style={{ width: 24, height: 24, marginLeft: 4, borderRadius: '50%', background: '#fff' }} /></>}
                                            color="secondary"
                                            onClick={() => setOrcDbDialogOpen(true)}
                                            size="small"
                                            title="Add from ORC DB"
                                            sx={{ borderRadius: 2, minHeight: 40, px: 2 }}
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
                                <TableContainer component={Paper} sx={{ mb: 2 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        indeterminate={selectedBoatIndices.length > 0 && selectedBoatIndices.length < sortedFleet.length}
                                                        checked={selectedBoatIndices.length === sortedFleet.length && sortedFleet.length > 0}
                                                        onChange={e => handleSelectAllBoats(e.target.checked)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={fleetSort === 'yachtName'}
                                                        direction={fleetSort === 'yachtName' ? fleetSortDir : 'asc'}
                                                        onClick={() => handleSort('yachtName')}
                                                    >
                                                        Yacht Name
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={fleetSort === 'sailNo'}
                                                        direction={fleetSort === 'sailNo' ? fleetSortDir : 'asc'}
                                                        onClick={() => handleSort('sailNo')}
                                                    >
                                                        Sail Number
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>
                                                    <TableSortLabel
                                                        active={fleetSort === 'class'}
                                                        direction={fleetSort === 'class' ? fleetSortDir : 'asc'}
                                                        onClick={() => handleSort('class')}
                                                    >
                                                        Class
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell>Actions</TableCell>
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
                                                        <TableCell>{boat.SailNo || 'Not specified'}</TableCell>
                                                        <TableCell
                                                            sx={{ cursor: 'pointer', textDecoration: 'underline', '&:hover': { color: 'primary.main' } }}
                                                            onClick={() => { setBoatsToAssign([boat]); setAssignDialogOpen(true); }}
                                                        >
                                                            {cls ? cls.ClassName : (boat.ClassId || 'Not assigned')}
                                                        </TableCell>
                                                        <TableCell>
                                                            {/* Removed Change Class button */}
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
                    if (boatsToAssign.length === 1 && boatsToAssign[0].YID) {
                        // Existing boat: update
                        await orcscApi.updateBoat(filePath, {
                            YID: boatsToAssign[0].YID || '',
                            classId: assignments[0] || '',
                            yachtName: boatsToAssign[0].YachtName,
                            sailNo: boatsToAssign[0].SailNo
                        });
                    } else {
                        // New boats: add
                        await Promise.all(boatsToAssign.map((boat, i) =>
                            orcscApi.addBoatFromOrcJson(filePath, boat, assignments[i] || '')
                        ));
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