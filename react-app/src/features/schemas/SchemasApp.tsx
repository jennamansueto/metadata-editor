import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container } from '@mui/material';
import { AppContext, type CIGlobal } from '../../context/AppContext';
import {
  TranslationProvider,
} from '../../i18n/TranslationContext';
import { AlertProvider } from '../../hooks/useAlert';
import { ConfirmProvider } from '../../hooks/useConfirm';
import GlobalSiteHeader from '../../components/GlobalSiteHeader';
import MainNavigationTabs from '../../components/MainNavigationTabs';
import SchemaList from './SchemaList';
import SchemaForm from './SchemaForm';
import SchemaMappings from './SchemaMappings';

declare module '@mui/material/styles' {
  interface Palette {
    primaryDark: Palette['primary'];
  }
  interface PaletteOptions {
    primaryDark?: PaletteOptions['primary'];
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#526bc7',
    },
    primaryDark: {
      main: '#0c1a4d',
    },
    secondary: {
      main: '#b0bec5',
    },
    error: {
      main: '#b71c1c',
    },
  },
});

interface SchemasAppProps {
  ci: CIGlobal;
  translations: Record<string, string>;
}

export default function SchemasApp({ ci, translations }: SchemasAppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContext.Provider value={ci}>
        <TranslationProvider translations={translations}>
          <AlertProvider>
            <ConfirmProvider>
              <Box className="wrapper">
                <GlobalSiteHeader />
                <Box sx={{ px: 0 }}>
                  <Container maxWidth={false}>
                    <Box sx={{ mt: 5, mb: 4 }}>
                      <MainNavigationTabs activeTab="schemas" />
                    </Box>
                    <HashRouter>
                      <Routes>
                        <Route path="/" element={<SchemaList />} />
                        <Route
                          path="/create"
                          element={<SchemaForm mode="create" />}
                        />
                        <Route
                          path="/edit/:uid"
                          element={<SchemaForm mode="edit" />}
                        />
                        <Route
                          path="/mappings/:uid"
                          element={<SchemaMappings />}
                        />
                      </Routes>
                    </HashRouter>
                  </Container>
                </Box>
              </Box>
            </ConfirmProvider>
          </AlertProvider>
        </TranslationProvider>
      </AppContext.Provider>
    </ThemeProvider>
  );
}
