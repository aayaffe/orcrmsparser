import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Container,
    Card,
    CardContent,
    CardHeader,
    Divider,
    useTheme,
    useMediaQuery,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Drawer,
    AppBar,
    Toolbar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Stack
} from '@mui/material';
import {
    Upload as UploadIcon,
    Download as DownloadIcon,
    Folder as FolderIcon,
    Menu as MenuIcon,
    Sailing as SailingIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import type { OrcscFile, ClassRow, RaceRow, FleetRow } from '../types/orcsc';
import { AddRacesDialog } from '../components/AddRacesDialog';

const drawerWidth = 240;

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
                    hour12: false
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
                hour12: false
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

export const ViewFile: React.FC = () => {
    const { filePath } = useParams<{ filePath: string }>();
    const [fileData, setFileData] = useState<OrcscFile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addRacesOpen, setAddRacesOpen] = useState(false);
    const [files, setFiles] = useState<string[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const navigate = useNavigate();
    const [newFileOpen, setNewFileOpen] = useState(false);
    const [newFileData, setNewFileData] = useState({
        eventTitle: '',
        venue: 'Haifa Bay',
        organizer: 'CYC',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        classes: [] as ClassRow[],
        races: [] as RaceRow[],
        boats: [] as FleetRow[]
    });

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
            const data = await orcscApi.getFile(filePath!);
            setFileData(data);
        } catch (err) {
            setError('Failed to load file');
            console.error('Error fetching file:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFiles = async () => {
        try {
            const fileList = await orcscApi.listFiles();
            setFiles(fileList.map(file => file.path));
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

    const handleCreateNewFile = async () => {
        try {
            await orcscApi.createNewFile({
                event: {
                    EventTitle: newFileData.eventTitle,
                    StartDate: newFileData.startDate,
                    EndDate: newFileData.endDate,
                    Venue: newFileData.venue,
                    Organizer: newFileData.organizer
                },
                classes: newFileData.classes,
                races: newFileData.races,
                boats: newFileData.boats
            });
            setNewFileOpen(false);
            setNewFileData({
                eventTitle: '',
                venue: 'Haifa Bay',
                organizer: 'CYC',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                classes: [],
                races: [],
                boats: []
            });
            fetchFiles(); // Refresh the file list
        } catch (error) {
            console.error('Error creating new file:', error);
        }
    };

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
                    <Typography variant="h6" noWrap component="div">
                        ORCSC Parser
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="persistent"
                anchor="left"
                open={isDrawerOpen}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        marginTop: '64px'
                    },
                }}
            >
                <Box sx={{ overflow: 'auto', mt: 2 }}>
                    <List>
                        <ListItem disablePadding>
                            <ListItemButton component="label">
                                <ListItemIcon>
                                    <UploadIcon />
                                </ListItemIcon>
                                <ListItemText primary="Upload File" />
                                <input
                                    type="file"
                                    hidden
                                    accept=".orcsc"
                                    onChange={handleFileUpload}
                                />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding>
                            <ListItemButton onClick={() => setNewFileOpen(true)}>
                                <ListItemIcon>
                                    <AddIcon />
                                </ListItemIcon>
                                <ListItemText primary="New File" />
                            </ListItemButton>
                        </ListItem>

                        <ListItem disablePadding>
                            <ListItemButton 
                                onClick={handleDownload}
                                disabled={!filePath}
                            >
                                <ListItemIcon>
                                    <DownloadIcon />
                                </ListItemIcon>
                                <ListItemText primary="Download File" />
                            </ListItemButton>
                        </ListItem>

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="subtitle1" sx={{ px: 2, py: 1 }}>
                            Available Files
                        </Typography>

                        {files.map((file) => (
                            <ListItem key={file} disablePadding>
                                <ListItemButton
                                    selected={filePath === file}
                                    onClick={() => handleFileSelect(file)}
                                >
                                    <ListItemIcon>
                                        <SailingIcon />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={file.split(/[\\/]/).pop()} 
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

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
                                {fileData.event.Venue} - {fileData.event.Organizer}
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
                                <Typography variant="h6" gutterBottom>
                                    Classes
                                </Typography>
                                <Stack spacing={2}>
                                    {fileData.classes.map((cls) => (
                                        <Box key={cls.ClassId} sx={{ display: 'flex', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                                                {cls.ClassName}:
                                            </Typography>
                                            <Typography variant="body2">
                                                {cls.YachtClass}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>

                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Races
                                </Typography>
                                <Stack spacing={2}>
                                    {fileData.races.map((race) => (
                                        <Box key={race.RaceId} sx={{ display: 'flex', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                                                {race.RaceName}:
                                            </Typography>
                                            <Typography variant="body2">
                                                {formatDate(race.StartTime)}
                                            </Typography>
                                        </Box>
                                    ))}
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => setAddRacesOpen(true)}
                                        >
                                            Add New Races
                                        </Button>
                                    </Box>
                                </Stack>
                            </Paper>

                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Fleet
                                </Typography>
                                <Stack spacing={2}>
                                    {fileData.fleet.map((boat) => (
                                        <Box key={boat.YID} sx={{ display: 'flex', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: '100px' }}>
                                                {boat.YachtName}:
                                            </Typography>
                                            <Typography variant="body2">
                                                Sail No: {boat.SailNo || 'Not specified'}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>

                            <AddRacesDialog
                                open={addRacesOpen}
                                onClose={() => setAddRacesOpen(false)}
                                onSuccess={handleAddRacesSuccess}
                                fileData={fileData}
                            />
                        </Box>
                    ) : null}
                </Container>
            </Box>

            <Dialog open={newFileOpen} onClose={() => setNewFileOpen(false)}>
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
                    <Button onClick={() => setNewFileOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleCreateNewFile}
                        variant="contained"
                        disabled={!newFileData.eventTitle}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 