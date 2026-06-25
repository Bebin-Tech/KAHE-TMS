import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0f5ea8',
      light: '#3f8ed6',
      dark: '#0a3f72',
    },
    secondary: {
      main: '#16a085',
      light: '#54c7b3',
      dark: '#0c6d5b',
    },
    success: {
      main: '#11845b',
    },
    warning: {
      main: '#b7791f',
    },
    error: {
      main: '#c2413b',
    },
    background: {
      default: '#f4f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#172033',
      secondary: '#667085',
    },
    divider: '#dde5f0',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h4: {
      fontWeight: 800,
      letterSpacing: 0,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f4f7fb',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '9px 18px',
          borderRadius: 8,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 10px 22px -12px rgba(15, 94, 168, 0.8)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #dde5f0',
          boxShadow: '0 16px 40px -30px rgba(15, 32, 58, 0.55)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 16px 40px -32px rgba(15, 32, 58, 0.55)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#e7edf5',
        },
        head: {
          color: '#667085',
          fontWeight: 800,
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        },
      },
    },
  },
});

export default theme;
