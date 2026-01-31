/* ImportBoatsWizard.tsx – Step 1: Upload & Parse CSV */

import React, { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, CircularProgress, FormControl, InputLabel, Select, MenuItem, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

interface ImportBoatsWizardProps {
    open: boolean;
    onClose: () => void;
    onImport: (boats: Array<{ yachtName: string; sailNo?: string; classId: string }>) => void;
}

export const ImportBoatsWizard: React.FC<ImportBoatsWizardProps> = ({ open, onClose, onImport }) => {
    const [csvData, setCsvData] = useState<Papa.ParseResult<Record<string, string>> | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mapping, setMapping] = useState<{ yachtName: string; sailNo: string; classId: string }>({ yachtName: '', sailNo: '', classId: '' });
    const [filterColumn, setFilterColumn] = useState<string>('');
    const [filterValue, setFilterValue] = useState<string>('');
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [importSummary, setImportSummary] = useState<Array<{ yachtName: string; sailNo?: string; classId: string }>>([]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setLoading(true);
        Papa.parse<Record<string, string>>(file, {
            header: true,
            encoding: 'UTF-8',
            complete: (results) => {
                setCsvData(results);
                setLoading(false);
            },
            error: (error) => {
                console.error("Error parsing CSV:", error);
                setLoading(false);
            }
        });
    };

    const handleCancel = () => {
        setCsvData(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onClose();
    };

    const handleMappingChange = (field: keyof typeof mapping, value: string) => {
        setMapping(prev => ({ ...prev, [field]: value }));
    };

    const handleFilterColumnChange = (e: any) => {
        const newFilterColumn = e.target.value as string;
        setFilterColumn(newFilterColumn);
        setFilterValue('');
        setSelectedRows([]);
    };

    const handleFilterValueChange = (e: any) => {
        const newFilterValue = e.target.value as string;
        setFilterValue(newFilterValue);
        setSelectedRows([]);
    };

    const handleRowToggle = (rowIndex: number) => {
        setSelectedRows(prev => (prev.includes(rowIndex) ? prev.filter(i => i !== rowIndex) : [...prev, rowIndex]));
    };

    const filteredRows = csvData && csvData.data.length > 0 && filterColumn && filterValue
        ? csvData.data.filter((row) => row[filterColumn] === filterValue)
        : (csvData ? csvData.data : []);

    const isAllSelected = filteredRows.length > 0 && selectedRows.length === filteredRows.length;
    const isIndeterminate = selectedRows.length > 0 && selectedRows.length < filteredRows.length;
    const handleSelectAllRows = (checked: boolean) => {
        if (checked) {
            setSelectedRows(filteredRows.map((_, i) => i));
        } else {
            setSelectedRows([]);
        }
    };

    useEffect(() => {
        if (csvData && mapping.yachtName && mapping.classId) {
            const boats = selectedRows.map((i: number) => {
                const row: Record<string, string> = filteredRows[i];
                return { yachtName: row[mapping.yachtName], sailNo: mapping.sailNo ? row[mapping.sailNo] : undefined, classId: row[mapping.classId] };
            });
            setImportSummary(boats);
        } else {
            setImportSummary([]);
        }
    }, [csvData, mapping, selectedRows, filterColumn, filterValue]);

    return (
        <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
            <DialogTitle>Import Boats from CSV</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        id="csv-upload"
                    />
                    <label htmlFor="csv-upload">
                        <Button variant="contained" component="span">Upload CSV File</Button>
                    </label>
                </Box>
                {loading && <CircularProgress />}
                {csvData && csvData.data.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">CSV Preview (first 5 rows):</Typography>
                        <Box sx={{ overflow: 'auto', maxHeight: '200px', border: '1px solid #ccc', p: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {csvData.meta.fields?.map((field, i) => (
                                            <th key={i} style={{ border: '1px solid #ccc', padding: '4px' }}>{field}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvData.data.slice(0, 5).map((row, i) => (
                                        <tr key={i}>
                                            {csvData.meta.fields?.map((field, j) => (
                                                <td key={j} style={{ border: '1px solid #ccc', padding: '4px' }}>{row[field]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                )}
                {csvData && csvData.meta.fields && csvData.meta.fields.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1">Map CSV Columns to Boat Fields</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel id="yachtName-label">Yacht Name</InputLabel>
                                <Select
                                    labelId="yachtName-label"
                                    value={mapping.yachtName}
                                    label="Yacht Name"
                                    onChange={(e) => handleMappingChange('yachtName', e.target.value)}
                                >
                                    {csvData.meta.fields.map((field, i) => (
                                        <MenuItem key={i} value={field}>{field}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel id="sailNo-label">Sail Number (Optional)</InputLabel>
                                <Select
                                    labelId="sailNo-label"
                                    value={mapping.sailNo}
                                    label="Sail Number (Optional)"
                                    onChange={(e) => handleMappingChange('sailNo', e.target.value)}
                                >
                                    <MenuItem value="">-- none --</MenuItem>
                                    {csvData.meta.fields.map((field, i) => (
                                        <MenuItem key={i} value={field}>{field}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel id="classId-label">Class</InputLabel>
                                <Select
                                    labelId="classId-label"
                                    value={mapping.classId}
                                    label="Class"
                                    onChange={(e) => handleMappingChange('classId', e.target.value)}
                                >
                                    {csvData.meta.fields.map((field, i) => (
                                        <MenuItem key={i} value={field}>{field}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>
                )}
                {csvData && csvData.meta.fields && csvData.meta.fields.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1">Filter and Select Rows</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel id="filterColumn-label">Filter Column</InputLabel>
                                <Select labelId="filterColumn-label" value={filterColumn} label="Filter Column" onChange={handleFilterColumnChange}>
                                    {csvData.meta.fields.map((field, i) => (
                                        <MenuItem key={i} value={field}>{field}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {filterColumn && (
                                <FormControl sx={{ minWidth: 200 }}>
                                    <InputLabel id="filterValue-label">Filter Value</InputLabel>
                                    <Select labelId="filterValue-label" value={filterValue} label="Filter Value" onChange={handleFilterValueChange}>
                                        {Array.from(new Set(csvData.data.map(row => row[filterColumn]))).map((val, i) => (
                                            <MenuItem key={i} value={val}>{val}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        </Box>
                        {filteredRows.length > 0 && (
                            <Box sx={{ mt: 2, overflow: 'auto', maxHeight: '300px' }}>
                                <TableContainer component={Paper}>
                                    <Table stickyHeader size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        indeterminate={isIndeterminate}
                                                        checked={isAllSelected}
                                                        onChange={(e) => handleSelectAllRows(e.target.checked)}
                                                    />
                                                </TableCell>
                                                {csvData.meta.fields?.map((field, i) => (
                                                    <TableCell key={i}>{field}</TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredRows.map((row, i) => (
                                                filteredRows.includes(row) && ( // Use filteredRows directly here
                                                    <TableRow key={i} hover>
                                                        <TableCell padding="checkbox">
                                                            <Checkbox checked={selectedRows.includes(i)} onChange={() => handleRowToggle(i)} />
                                                        </TableCell>
                                                        {csvData.meta.fields?.map((field, j) => (
                                                            <TableCell key={j}>{row[field]}</TableCell>
                                                        ))}
                                                    </TableRow>
                                                )
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </Box>
                )}
                {importSummary.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1">Import Summary (Boats to be Imported):</Typography>
                        <TableContainer component={Paper} sx={{ mt: 1, overflow: 'auto', maxHeight: '200px' }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Yacht Name</TableCell>
                                        <TableCell>Sail Number (Optional)</TableCell>
                                        <TableCell>Class</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {importSummary.map((boat, i) => (
                                        <TableRow key={i} hover>
                                            <TableCell>{boat.yachtName}</TableCell>
                                            <TableCell>{boat.sailNo || '–'}</TableCell>
                                            <TableCell>{boat.classId}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel}>Cancel</Button>
                {importSummary.length > 0 && (
                    <Button variant="contained" onClick={() => onImport(importSummary)}>Confirm Import</Button>
                )}
            </DialogActions>
        </Dialog>
    );
}; 