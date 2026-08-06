import { createTheme } from '@mui/material/styles';

const academicFontFamily = [
  'Aptos',
  'Inter',
  'Segoe UI Variable',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'sans-serif',
].join(', ');

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
      light: '#dbeafe',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f766e',
      light: '#ccfbf1',
      dark: '#115e59',
      contrastText: '#ffffff',
    },
    success: {
      main: '#059669',
    },
    warning: {
      main: '#d97706',
    },
    error: {
      main: '#dc2626',
    },
    background: {
      default: '#f4f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  shape: {
    borderRadius: 8,
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
      lineHeight: 1.1,
    },
    h4: {
      fontWeight: 800,
      letterSpacing: 0,
      lineHeight: 1.15,
    },
    h5: {
      fontWeight: 760,
      lineHeight: 1.22,
    },
    h6: {
      fontWeight: 720,
      lineHeight: 1.28,
    },
    subtitle1: {
      fontWeight: 680,
    },
    subtitle2: {
      fontWeight: 720,
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      lineHeight: 1.55,
    },
    button: {
      textTransform: 'none',
      fontWeight: 720,
      letterSpacing: 0,
    },
    overline: {
      fontSize: '0.72rem',
      fontWeight: 760,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontFamily: academicFontFamily,
          backgroundColor: '#f4f7fb',
        },
        body: {
          backgroundColor: '#f4f7fb',
          fontFamily: academicFontFamily,
          color: '#0f172a',
          fontFeatureSettings: '"kern", "liga", "calt"',
          textRendering: 'optimizeLegibility',
          overflowX: 'hidden',
        },
        '::selection': {
          backgroundColor: '#bfdbfe',
          color: '#0f172a',
        },
        'button, input, textarea, select, table': {
          fontFamily: academicFontFamily,
        },
        '#root': {
          minHeight: '100vh',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          padding: '9px 18px',
          borderRadius: 8,
          lineHeight: 1.35,
          minHeight: 42,
          minWidth: 0,
          textAlign: 'center',
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          boxShadow: 'none',
          transition: 'transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease, border-color 160ms ease',
          '& .MuiButton-startIcon, & .MuiButton-endIcon': {
            flexShrink: 0,
          },
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlinedPrimary: {
          backgroundColor: '#ffffff',
          borderColor: '#bfdbfe',
          color: '#1d4ed8',
          '&:hover': {
            backgroundColor: '#eff6ff',
            borderColor: '#60a5fa',
            boxShadow: '0 14px 26px -22px rgba(37, 99, 235, 0.7)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          '&:hover': {
            boxShadow: '0 16px 28px -20px rgba(37, 99, 235, 0.85)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          maxWidth: '100%',
          boxShadow: '0 18px 42px -34px rgba(15, 23, 42, 0.38)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 10,
          maxWidth: '100%',
          boxShadow: '0 18px 42px -34px rgba(15, 23, 42, 0.34)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 760,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          maxWidth: '100%',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#e2e8f0',
          paddingTop: 15,
          paddingBottom: 15,
          verticalAlign: 'middle',
        },
        head: {
          color: '#475569',
          fontWeight: 760,
          fontSize: '0.75rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          backgroundColor: '#f8fafc',
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
          borderRadius: 8,
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#cbd5e1',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#60a5fa',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2563eb',
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#64748b',
          fontWeight: 680,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100dvh - 32px)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          fontWeight: 720,
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
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: '#e2e8f0',
        },
        bar: {
          borderRadius: 999,
        },
      },
    },
  },
});

export default theme;

