import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Drawer,
    Typography
} from '@mui/material';
import {
    Upload as UploadIcon,
    Download as DownloadIcon,
    Sailing as SailingIcon,
    Add as AddIcon,
    Home as HomeIcon
} from '@mui/icons-material';

interface SideMenuProps {
    open: boolean;
    onClose: () => void;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onNewFile: () => void;
    onDownload?: () => void;
    onFileSelect: (file: string) => void;
    onHome?: () => void;
    files: string[];
    selectedFile?: string;
    drawerWidth?: number;
}

export const SideMenu: React.FC<SideMenuProps> = ({
    open,
    onClose,
    onUpload,
    onNewFile,
    onDownload,
    onFileSelect,
    onHome,
    files,
    selectedFile,
    drawerWidth = 240
}) => {
    return (
        <Drawer
            variant="persistent"
            anchor="left"
            open={open}
            onClose={onClose}
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
                    {onHome && (
                        <ListItem disablePadding>
                            <ListItemButton onClick={onHome}>
                                <ListItemIcon sx={{ minWidth: '40px' }}>
                                    <HomeIcon />
                                </ListItemIcon>
                                <ListItemText primary="Home" />
                            </ListItemButton>
                        </ListItem>
                    )}

                    <ListItem disablePadding>
                        <ListItemButton component="label">
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <UploadIcon />
                            </ListItemIcon>
                            <ListItemText primary="Upload File" />
                            <input
                                type="file"
                                hidden
                                accept=".orcsc"
                                onChange={onUpload}
                            />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton onClick={onNewFile}>
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <AddIcon />
                            </ListItemIcon>
                            <ListItemText primary="New File" />
                        </ListItemButton>
                    </ListItem>

                    {onDownload && (
                        <ListItem disablePadding>
                            <ListItemButton 
                                onClick={onDownload}
                                disabled={!selectedFile}
                            >
                                <ListItemIcon sx={{ minWidth: '40px' }}>
                                    <DownloadIcon />
                                </ListItemIcon>
                                <ListItemText primary="Download File" />
                            </ListItemButton>
                        </ListItem>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" sx={{ px: 2, py: 1 }}>
                        Available Files
                    </Typography>

                    {files.map((file) => (
                        <ListItem key={file} disablePadding>
                            <ListItemButton
                                selected={selectedFile === file}
                                onClick={() => onFileSelect(file)}
                            >
                                <ListItemIcon sx={{ minWidth: '40px' }}>
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
    );
}; 