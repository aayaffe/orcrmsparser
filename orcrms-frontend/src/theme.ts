import { createTheme } from '@mui/material/styles';

const marineTheme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Deep navy blue
      light: '#534bae',
      dark: '#000051',
    },
    secondary: {
      main: '#0288d1', // Ocean blue
      light: '#5eb8ff',
      dark: '#005b9f',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a237e',
      secondary: '#0288d1',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
      color: '#1a237e',
    },
    h2: {
      fontWeight: 600,
      fontSize: 'clamp(1.5rem, 4vw, 2rem)',
      color: '#1a237e',
    },
    h3: {
      fontWeight: 600,
      fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
      color: '#1a237e',
    },
    h4: {
      fontWeight: 600,
      fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
      color: '#1a237e',
    },
    h5: {
      fontWeight: 600,
      fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
      color: '#1a237e',
    },
    h6: {
      fontWeight: 600,
      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
      color: '#1a237e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px',
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default marineTheme; 