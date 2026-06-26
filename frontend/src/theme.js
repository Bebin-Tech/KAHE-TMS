import { createTheme } from '@mui/material/styles';

const academicFontFamily = [
  'Aptos',
  'Segoe UI',
  'Inter',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
].join(', ');

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
    fontFamily: academicFontFamily,
    htmlFontSize: 16,
    allVariants: {
      fontFamily: academicFontFamily,
      letterSpacing: 0,
    },
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
    subtitle1: {
      fontWeight: 600,
    },
    subtitle2: {
      fontWeight: 600,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.55,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontFamily: academicFontFamily,
        },
        body: {
          backgroundColor: '#f4f7fb',
          fontFamily: academicFontFamily,
          fontFeatureSettings: '"kern"',
          textRendering: 'optimizeLegibility',
        },
        'button, input, textarea, select, table': {
          fontFamily: academicFontFamily,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '10px 20px',
          borderRadius: 8,
          lineHeight: 1.35,
        },
        outlinedPrimary: {
          backgroundColor: '#ffffff',
          borderColor: '#3f8ed6',
          borderWidth: 1.5,
          color: '#0f5ea8',
          fontSize: '1rem',
          fontWeight: 700,
          minHeight: 48,
          padding: '10px 26px',
          boxShadow: '0 10px 24px -18px rgba(15, 94, 168, 0.7)',
          '&:hover': {
            backgroundColor: '#f4f9ff',
            borderColor: '#0f5ea8',
            borderWidth: 1.5,
            boxShadow: '0 16px 30px -20px rgba(15, 94, 168, 0.8)',
          },
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
          borderRadius: 12,
          boxShadow: '0 18px 44px -34px rgba(15, 32, 58, 0.58)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          boxShadow: '0 18px 44px -34px rgba(15, 32, 58, 0.58)',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid #dde5f0',
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#e7edf5',
          paddingTop: 16,
          paddingBottom: 16,
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
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: '#f8fbff',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d7e0ec',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9bb5d1',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0f5ea8',
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#667085',
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
