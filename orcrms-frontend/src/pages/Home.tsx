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
    ListItemText,
    Divider,
    CircularProgress,
    Alert,
    Stack,
    IconButton,
    InputAdornment
} from '@mui/material';
import { Upload as UploadIcon, Sailing as SailingIcon, Folder as FolderIcon } from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import type { OrcscFileInfo } from '../api/orcscApi';

export const Home: React.FC = () => {
    const [filePath, setFilePath] = useState('');
    const [files, setFiles] = useState<OrcscFileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
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
        if (!file) return;

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

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <SailingIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h3" component="h1" gutterBottom>
                        ORCSC File Viewer
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        View and manage your sailing race results
                    </Typography>
                </Box>

                {/* File Upload Section */}
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4, 
                        mb: 4,
                        background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                        border: '1px solid rgba(0,0,0,0.1)'
                    }}
                >
                    <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                        Upload ORCSC File
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Button
                            variant="contained"
                            component="label"
                            startIcon={<UploadIcon />}
                            sx={{ 
                                background: 'linear-gradient(45deg, #0288d1 30%, #0277bd 90%)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #0277bd 30%, #01579b 90%)',
                                }
                            }}
                        >
                            Choose File
                            <input
                                type="file"
                                hidden
                                accept=".orcsc"
                                onChange={handleFileUpload}
                            />
                        </Button>
                        {uploadError && (
                            <Alert severity="error" sx={{ flex: 1 }}>
                                {uploadError}
                            </Alert>
                        )}
                    </Stack>
                </Paper>

                {/* Manual Path Entry */}
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4, 
                        mb: 4,
                        background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                        border: '1px solid rgba(0,0,0,0.1)'
                    }}
                >
                    <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                        Enter File Path
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="ORCSC File Path"
                            value={filePath}
                            onChange={(e) => setFilePath(e.target.value)}
                            placeholder="Enter the path to your ORCSC file"
                            variant="outlined"
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FolderIcon color="primary" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={!filePath}
                            sx={{ 
                                background: 'linear-gradient(45deg, #1a237e 30%, #000051 90%)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #000051 30%, #1a237e 90%)',
                                }
                            }}
                        >
                            View File
                        </Button>
                    </form>
                </Paper>

                {/* Available Files List */}
                <Paper 
                    elevation={3} 
                    sx={{ 
                        p: 4,
                        background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
                        border: '1px solid rgba(0,0,0,0.1)'
                    }}
                >
                    <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
                        Available Files
                    </Typography>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error">{error}</Alert>
                    ) : files.length === 0 ? (
                        <Alert severity="info">No ORCSC files available</Alert>
                    ) : (
                        <List>
                            {files.map((file, index) => (
                                <React.Fragment key={file.path}>
                                    <ListItem
                                        onClick={() => handleFileSelect(file.path)}
                                        sx={{ 
                                            cursor: 'pointer',
                                            '&:hover': {
                                                background: 'rgba(2, 136, 209, 0.08)',
                                            },
                                            transition: 'background-color 0.2s',
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle1" color="primary">
                                                    {file.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="body2" color="text.secondary">
                                                    Modified: {formatDate(file.modified)} • Size: {formatSize(file.size)}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                    {index < files.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Paper>
            </Box>
        </Container>
    );
}; 