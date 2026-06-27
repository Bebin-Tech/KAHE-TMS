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
      main: '#3B8FF3',
      light: '#d8ecff',
      dark: '#237dba',
    },
    secondary: {
      main: '#34B1AA',
      light: '#dff7f5',
      dark: '#1f7f79',
    },
    success: {
      main: '#34B1AA',
    },
    warning: {
      main: '#E0B50F',
    },
    error: {
      main: '#c2413b',
    },
    background: {
      default: '#f6f6f7',
      paper: '#ffffff',
    },
    text: {
      primary: '#1E1E2C',
      secondary: '#667085',
    },
    divider: '#e5e2df',
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
          backgroundColor: '#f6f6f7',
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
          borderColor: '#3B8FF3',
          borderWidth: 1.5,
          color: '#1E1E2C',
          fontSize: '1rem',
          fontWeight: 700,
          minHeight: 48,
          padding: '10px 26px',
          boxShadow: '0 10px 24px -18px rgba(59, 143, 243, 0.7)',
          '&:hover': {
            backgroundColor: '#eaf3ff',
            borderColor: '#3B8FF3',
            borderWidth: 1.5,
            boxShadow: '0 16px 30px -20px rgba(59, 143, 243, 0.8)',
          },
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 10px 22px -12px rgba(59, 143, 243, 0.8)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e5e2df',
          borderRadius: 12,
          boxShadow: '0 18px 44px -34px rgba(30, 30, 44, 0.38)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 12,
          boxShadow: '0 18px 44px -34px rgba(30, 30, 44, 0.38)',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid #e5e2df',
          borderRadius: 12,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#ece8e3',
          paddingTop: 16,
          paddingBottom: 16,
        },
        head: {
          color: '#6f6f78',
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
            backgroundColor: '#f4f9ff',
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
            borderColor: '#ded8d2',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3B8FF3',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3B8FF3',
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#6f6f78',
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

