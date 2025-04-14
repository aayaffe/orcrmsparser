import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    AppBar,
    Toolbar,
    IconButton,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { orcscApi } from '../api/orcscApi';
import { SideMenu } from '../components/SideMenu';
import { NewFileDialog } from '../components/NewFileDialog';

const DRAWER_WIDTH = 240;

interface FileInfo {
    path: string;
    eventName: string;
}

export const Home: React.FC = () => {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [selectedFile, _setSelectedFile] = useState<FileInfo | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [newFileOpen, setNewFileOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFiles();
    }, []);

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
            setFiles(fileData.filter((file): file is FileInfo => file !== null));
        } catch (err) {
            console.error('Error fetching files:', err);
        }
    };

    const handleFileSelect = (path: string) => {
        navigate(`/view/${encodeURIComponent(path)}`);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const result = await orcscApi.uploadFile(file);
            await fetchFiles();
            navigate(`/view/${encodeURIComponent(result.path)}`);
        } catch (err) {
            console.error('Error uploading file:', err);
        }
    };

    const handleDownload = async () => {
        if (!selectedFile) return;

        try {
            await orcscApi.downloadFile(selectedFile.path);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
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
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'white' }}>
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
                files={files}
                selectedFile={selectedFile?.path}
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
                    width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                    ml: { sm: `${DRAWER_WIDTH}px` },
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