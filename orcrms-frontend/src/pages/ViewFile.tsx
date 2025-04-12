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
    
    Stack
} from '@mui/material';
import {
    Menu as MenuIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import type { OrcscFile, ClassRow, YachtClass } from '../types/orcsc';
import { AddRacesDialog } from '../components/AddRacesDialog';
import { SideMenu } from '../components/SideMenu';
import { AddClassDialog } from '../components/AddClassDialog';
import { NewFileDialog } from '../components/NewFileDialog';

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
    const [addClassOpen, setAddClassOpen] = useState(false);

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

            <SideMenu
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onUpload={handleFileUpload}
                onNewFile={() => setNewFileOpen(true)}
                onDownload={handleDownload}
                onFileSelect={handleFileSelect}
                onHome={handleHome}
                files={files}
                selectedFile={filePath}
            />

            <NewFileDialog
                open={newFileOpen}
                onClose={() => setNewFileOpen(false)}
                onSuccess={handleNewFileSuccess}
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

            <AddClassDialog
                open={addClassOpen}
                onClose={() => setAddClassOpen(false)}
                onAdd={handleAddClass}
            />
        </Box>
    );
}; 