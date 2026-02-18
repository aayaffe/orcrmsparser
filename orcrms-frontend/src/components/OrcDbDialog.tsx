import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, CircularProgress, Box, Typography, TextField, Checkbox } from '@mui/material';
import type { OrcscFile } from '../types/orcsc';

interface OrcDbDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (selectedBoats: BoatCertificate[]) => void;
    fileData: OrcscFile;
}

interface Country {
    id: string;
    name: string;
}

interface BoatCertificate {
    YachtName: string;
    SailNo: string;
    CertDate: string;
    CertType: string; // ORC, NS, DH
    _original?: BoatCertificate;
}

export const OrcDbDialog: React.FC<OrcDbDialogProps> = ({ open, onClose, onSuccess }) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [boats, setBoats] = useState<BoatCertificate[]>([]);
    const [boatsLoading, setBoatsLoading] = useState(false);
    const [boatsError, setBoatsError] = useState<string | null>(null);
    const [searchName, setSearchName] = useState('');
    const [searchSailNo, setSearchSailNo] = useState('');
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    useEffect(() => {
        if (open) {
            setLoading(true);
            setError(null);
            fetch('https://data.orc.org/public/WPub.dll')
                .then(async (res) => {
                    const text = await res.text();
                    // Parse XML to extract country list
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(text, 'application/xml');
                    const rowNodes = Array.from(xml.getElementsByTagName('ROW'));
                    // Deduplicate by id
                    const seen = new Set();
                    const countryList = rowNodes.map((node) => {
                        const idNode = node.getElementsByTagName('CountryId')[0];
                        const nameNode = node.getElementsByTagName('CountryName')[0];
                        return {
                            id: idNode ? idNode.textContent || '' : '',
                            name: nameNode ? nameNode.textContent || '' : '',
                        };
                    }).filter(c => c.id && c.name && !seen.has(c.id) && seen.add(c.id));
                    setCountries(countryList);
                    setLoading(false);
                })
                .catch(() => {
                    setError('Failed to fetch country list');
                    setLoading(false);
                });
        } else {
            setCountries([]);
            setSelectedCountry('');
            setError(null);
        }
    }, [open]);

    useEffect(() => {
        if (selectedCountry) {
            setBoatsLoading(true);
            setBoatsError(null);
            // Helper to fetch for a given family
            const fetchFamily = (family: string) =>
                fetch(`https://data.orc.org/public/WPub.dll?action=DownRMS&CountryId=${selectedCountry}&Family=${family}&ext=json`)
                    .then(res => res.json())
                    .then(data => Array.isArray(data.rms) ? data.rms : [])
                    .catch(() => []);
            // Fetch all types in parallel
            Promise.all([
                fetchFamily('ORC'),
                fetchFamily('NS'),
                fetchFamily('DH'),
            ]).then(([orc, ns, dh]) => {
                // Add CertType to each
                const addType = (arr: any[], type: string) => arr.map(b => ({
                    YachtName: b.YachtName || '',
                    SailNo: b.SailNo || '',
                    CertDate: b.IssueDate || '',
                    CertType: type,
                    _original: b
                }));
                // Combine and deduplicate by YachtName+SailNo+CertDate+CertType
                const all = [...addType(orc, 'ORC'), ...addType(ns, 'NS'), ...addType(dh, 'DH')];
                const seen = new Set();
                const deduped = all.filter(b => {
                    const key = `${b.YachtName}|${b.SailNo}|${b.CertDate}|${b.CertType}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });
                setBoats(deduped);
                setBoatsLoading(false);
            }).catch(() => {
                setBoats([]);
                setBoatsError('Failed to fetch boats');
                setBoatsLoading(false);
            });
        } else {
            setBoats([]);
            setBoatsError(null);
        }
    }, [selectedCountry]);

    // Filtered boats for display
    const filteredBoats = boats
        .filter(boat =>
            (!searchName || boat.YachtName.toLowerCase().includes(searchName.toLowerCase())) &&
            (!searchSailNo || boat.SailNo.toLowerCase().includes(searchSailNo.toLowerCase()))
        )
        .sort((a, b) => a.YachtName.localeCompare(b.YachtName));

    // Handle select all
    const allFilteredIndices = filteredBoats.map((_, i) => i);
    const isAllSelected = selectedIndices.length === filteredBoats.length && filteredBoats.length > 0;
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIndices(allFilteredIndices);
        } else {
            setSelectedIndices([]);
        }
    };
    // Handle individual row select
    const handleRowSelect = (i: number) => {
        setSelectedIndices(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]);
    };
    // Selected boats
    const selectedBoats = selectedIndices
  .map(i => filteredBoats[i])
  .filter(b => !!b)
  .map(b => b._original || b);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Add Boats from ORC DB</DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : (
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="country-select-label">Select Country</InputLabel>
                        <Select
                            labelId="country-select-label"
                            value={selectedCountry}
                            label="Select Country"
                            onChange={e => setSelectedCountry(e.target.value)}
                        >
                            {countries.map((country) => (
                                <MenuItem key={country.id} value={country.id}>{country.name} ({country.id})</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                {selectedCountry && (
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                label="Search by Yacht Name"
                                value={searchName}
                                onChange={e => setSearchName(e.target.value)}
                                size="small"
                            />
                            <TextField
                                label="Search by Sail Number"
                                value={searchSailNo}
                                onChange={e => setSearchSailNo(e.target.value)}
                                size="small"
                            />
                        </Box>
                        {boatsLoading ? (
                            <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
                                <CircularProgress />
                            </Box>
                        ) : boatsError ? (
                            <Typography color="error">{boatsError}</Typography>
                        ) : (
                            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ border: '1px solid #ccc', padding: '4px' }}>
                                                <Checkbox
                                                    checked={isAllSelected}
                                                    indeterminate={selectedIndices.length > 0 && !isAllSelected}
                                                    onChange={handleSelectAll}
                                                />
                                            </th>
                                            <th style={{ border: '1px solid #ccc', padding: '4px' }}>Yacht Name</th>
                                            <th style={{ border: '1px solid #ccc', padding: '4px' }}>Sail No</th>
                                            <th style={{ border: '1px solid #ccc', padding: '4px' }}>Cert Date</th>
                                            <th style={{ border: '1px solid #ccc', padding: '4px' }}>Cert Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBoats.map((boat, i) => (
                                            <tr key={i}>
                                                <td style={{ border: '1px solid #ccc', padding: '4px' }}>
                                                    <Checkbox
                                                        checked={selectedIndices.includes(i)}
                                                        onChange={() => handleRowSelect(i)}
                                                    />
                                                </td>
                                                <td style={{ border: '1px solid #ccc', padding: '4px' }}>{boat.YachtName}</td>
                                                <td style={{ border: '1px solid #ccc', padding: '4px' }}>{boat.SailNo}</td>
                                                <td style={{ border: '1px solid #ccc', padding: '4px' }}>{boat.CertDate}</td>
                                                <td style={{ border: '1px solid #ccc', padding: '4px' }}>{boat.CertType}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    disabled={selectedBoats.length === 0}
                    onClick={() => onSuccess(selectedBoats)}
                >
                    Confirm Import
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 