import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    AppBar,
    Toolbar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Stack
} from '@mui/material';
import {
    Menu as MenuIcon,
    Add as AddIcon,
    Upload as UploadIcon
} from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import type { OrcscFileInfo } from '../api/orcscApi';
import type { ClassRow, RaceRow, FleetRow, YachtClass } from '../types/orcsc';
import { SideMenu } from '../components/SideMenu';
import { NewFileDialog } from '../components/NewFileDialog';

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

    const handleNewFileSuccess = (filePath: string) => {
        setNewFileOpen(false);
        navigate(`/view/${encodeURIComponent(filePath)}`);
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

            <SideMenu
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onUpload={handleFileUpload}
                onNewFile={() => setNewFileOpen(true)}
                onDownload={handleFileDownload}
                onFileSelect={handleFileSelect}
                files={files.map(file => file.path)}
                selectedFile={selectedFile || undefined}
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

        </Box>
    );
}; 