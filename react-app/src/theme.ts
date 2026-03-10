import { createTheme } from '@mui/material/styles';

// Port of Vuetify theme from index_vuetify.php lines 157-172
export const theme = createTheme({
  palette: {
    primary: { main: '#526bc7', dark: '#0c1a4d' },
    secondary: { main: '#b0bec5' },
    error: { main: '#b71c1c' },
    success: { main: '#4caf50' },
    info: { main: '#2196f3' },
    warning: { main: '#ff9800' },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
  components: {
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiButton: {
      defaultProps: {
        size: 'small',
      },
    },
  },
});
