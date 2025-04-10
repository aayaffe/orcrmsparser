import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    CircularProgress,
    Alert,
    Stack,
    IconButton,
    InputAdornment,
    Drawer,
    AppBar,
    Toolbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Upload as UploadIcon, Sailing as SailingIcon, Folder as FolderIcon, Menu as MenuIcon, Download as DownloadIcon, Add as AddIcon } from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import type { OrcscFileInfo } from '../api/orcscApi';
import type { ClassRow, RaceRow, FleetRow } from '../types/orcsc';

const drawerWidth = 240;

export const Home: React.FC = () => {
    const [filePath, setFilePath] = useState('');
    const [files, setFiles] = useState<OrcscFileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
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
    const navigate = useNavigate();

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const fileList = await orcscApi.listFiles();
            setFiles(fileList);
            setError(null);
        } catch (err) {
            setError('Failed to load file list');
            console.error('Error fetching files:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (filePath) {
            const encodedPath = encodeURIComponent(filePath);
            navigate(`/view/${encodedPath}`);
        }
    };

    const handleFileSelect = (path: string) => {
        navigate(`/view/${encodeURIComponent(path)}`);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                setUploadError(null);
                const result = await orcscApi.uploadFile(file);
                await fetchFiles(); // Refresh the file list
                // Navigate to the uploaded file
                navigate(`/view/${encodeURIComponent(result.path)}`);
            } catch (err) {
                setUploadError('Failed to upload file');
                console.error('Error uploading file:', err);
            }
        }
    };

    const handleFileDownload = async () => {
        if (selectedFile) {
            try {
                await orcscApi.downloadFile(selectedFile);
            } catch (error) {
                console.error('Error downloading file:', error);
            }
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    const formatSize = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    const handleCreateNewFile = async () => {
        try {
            await orcscApi.createNewFile({
                title: newFileData.eventTitle,
                startDate: newFileData.startDate,
                endDate: newFileData.endDate,
                location: newFileData.venue,
                organizer: newFileData.organizer,
                classes: newFileData.classes.map(cls => cls.classId)
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
                                onClick={handleFileDownload}
                                disabled={!selectedFile}
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
                            <ListItem key={file.path} disablePadding>
                                <ListItemButton
                                    selected={selectedFile === file.path}
                                    onClick={() => handleFileSelect(file.path)}
                                >
                                    <ListItemIcon>
                                        <SailingIcon />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={file.name}
                                        secondary={`Modified: ${formatDate(file.modified)} • Size: ${formatSize(file.size)}`}
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
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    mt: '64px'
                }}
            >
                <Typography variant="h4" gutterBottom>
                    Welcome to ORCSC Parser
                </Typography>
                <Typography variant="body1" paragraph>
                    Select a file from the menu to view its contents or upload a new file.
                </Typography>
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