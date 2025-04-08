import React from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
import { EventForm } from '../components/FileEditor/EventForm';
import { ClassesForm } from '../components/FileEditor/ClassesForm';
import { RacesForm } from '../components/FileEditor/RacesForm';
import { BoatsForm } from '../components/FileEditor/BoatsForm';
import { useMutation } from 'react-query';
import { orcscApi } from '../api/orcscApi';

const steps = ['Event Details', 'Classes', 'Races', 'Boats'];

export const NewFile: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    event: null,
    classes: [],
    races: [],
    boats: []
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
      // Handle error
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
              setFormData(prev => ({ ...prev, event: data }));
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
            disabled={createFileMutation.isLoading}
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