import React from 'react';
import { Box, TextField, Button } from '@mui/material';

interface EventFormProps {
  onSubmit: (data: {
    title: string;
    startDate: string;
    endDate: string;
    location: string;
    organizer: string;
  }) => void;
}

export const EventForm: React.FC<EventFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = React.useState({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    location: 'Haifa Bay',
    organizer: 'CYC'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Event Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        required
        fullWidth
      />
      <TextField
        label="Location"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        fullWidth
      />
      <TextField
        label="Organizer"
        value={formData.organizer}
        onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
        fullWidth
      />
      <TextField
        label="Start Date"
        type="date"
        value={formData.startDate}
        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <TextField
        label="End Date"
        type="date"
        value={formData.endDate}
        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
      <Button type="submit" variant="contained" disabled={!formData.title}>
        Next
      </Button>
    </Box>
  );
}; 