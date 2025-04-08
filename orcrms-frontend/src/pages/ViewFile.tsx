import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
} from '@mui/material';
import { orcscApi } from '../api/orcscApi';
import { OrcscFile } from '../types/orcsc';

export const ViewFile: React.FC = () => {
    const { filePath } = useParams<{ filePath: string }>();
    const [fileData, setFileData] = useState<OrcscFile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                if (!filePath) {
                    throw new Error('File path is required');
                }
                // Decode the URL-encoded file path
                const decodedPath = decodeURIComponent(filePath);
                console.log('Fetching file:', decodedPath);
                const data = await orcscApi.getFile(decodedPath);
                console.log('Received data:', data);
                setFileData(data);
            } catch (err) {
                console.error('Error fetching file:', err);
                setError(err instanceof Error ? err.message : 'Failed to load file');
            } finally {
                setLoading(false);
            }
        };

        fetchFile();
    }, [filePath]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">
                    <Typography variant="h6">Error loading file</Typography>
                    <Typography>{error}</Typography>
                </Alert>
            </Box>
        );
    }

    if (!fileData) {
        return (
            <Box p={3}>
                <Alert severity="warning">No data available</Alert>
            </Box>
        );
    }

    return (
        <Box p={3}>
            {/* Event Information */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    {fileData.event.EventTitle}
                </Typography>
                <Typography variant="body1">
                    Venue: {fileData.event.Venue}
                </Typography>
                <Typography variant="body1">
                    Organizer: {fileData.event.Organizer}
                </Typography>
                <Typography variant="body1">
                    Dates: {fileData.event.StartDate} to {fileData.event.EndDate}
                </Typography>
            </Paper>

            {/* Classes */}
            <Typography variant="h5" gutterBottom>
                Classes
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Class ID</TableCell>
                            <TableCell>Class Name</TableCell>
                            <TableCell>Yacht Class</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {fileData.classes.map((cls) => (
                            <TableRow key={cls.ClassId}>
                                <TableCell>{cls.ClassId}</TableCell>
                                <TableCell>{cls.ClassName}</TableCell>
                                <TableCell>{cls.YachtClass}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Races */}
            <Typography variant="h5" gutterBottom>
                Races
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Race ID</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Start Time</TableCell>
                            <TableCell>Class</TableCell>
                            <TableCell>Scoring Type</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {fileData.races.map((race) => (
                            <TableRow key={race.RaceId}>
                                <TableCell>{race.RaceId}</TableCell>
                                <TableCell>{race.RaceName}</TableCell>
                                <TableCell>{race.StartTime}</TableCell>
                                <TableCell>{race.ClassId}</TableCell>
                                <TableCell>{race.ScoringType}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Fleet */}
            <Typography variant="h5" gutterBottom>
                Fleet
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>YID</TableCell>
                            <TableCell>Yacht Name</TableCell>
                            <TableCell>Sail Number</TableCell>
                            <TableCell>Class</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {fileData.fleet.map((boat) => (
                            <TableRow key={boat.YID}>
                                <TableCell>{boat.YID}</TableCell>
                                <TableCell>{boat.YachtName}</TableCell>
                                <TableCell>{boat.SailNo || '-'}</TableCell>
                                <TableCell>{boat.ClassId}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}; 