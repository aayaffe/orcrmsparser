import React from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
import { EventForm } from '../components/FileEditor/EventForm';
import { useMutation } from 'react-query';
import { orcscApi } from '../api/orcscApi';

const steps = ['Event Details', 'Classes', 'Races', 'Boats'];

export const NewFile: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    location: 'Haifa Bay',
    organizer: 'CYC',
    classes: [] as string[]
  });

  const createFileMutation = useMutation(orcscApi.createNewFile);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    try {
      await createFileMutation.mutateAsync(formData);
      // Handle success (e.g., show success message, redirect)
    } catch (error) {
      console.error('Error creating file:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create New ORCSC File
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 2 }}>
        {activeStep === 0 && (
          <EventForm
            onSubmit={(data) => {
              setFormData(prev => ({
                ...prev,
                title: data.title,
                startDate: data.startDate,
                endDate: data.endDate,
                location: data.location,
                organizer: data.organizer
              }));
              handleNext();
            }}
          />
        )}
        {/* Add other form components for different steps */}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          disabled={activeStep === 0}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createFileMutation.isLoading || !formData.title}
          >
            Create File
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
}; 