import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import EditorLayout from './components/EditorLayout';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import DatafilesPage from './pages/DatafilesPage';
import DatafileEditPage from './pages/DatafileEditPage';
import VariablesPage from './pages/VariablesPage';
import VariableDataPage from './pages/VariableDataPage';
import ExternalResourcesPage from './pages/ExternalResourcesPage';
import ExternalResourceEditPage from './pages/ExternalResourceEditPage';
import ExternalResourceImportPage from './pages/ExternalResourceImportPage';
import ImportPage from './pages/ImportPage';
import PublishPage from './pages/PublishPage';
import ValidationReportPage from './pages/ValidationReportPage';
import ProjectPackagePage from './pages/ProjectPackagePage';
import ChangeLogPage from './pages/ChangeLogPage';
import GeneratePdfPage from './pages/GeneratePdfPage';
import GeospatialFeaturesPage from './pages/GeospatialFeaturesPage';
import MetadataTypesPage from './pages/MetadataTypesPage';
import SdmxCsvExportPage from './pages/SdmxCsvExportPage';
import PlaceholderPage from './pages/PlaceholderPage';
import { useProjectStore } from './store/useProjectStore';

/**
 * App shell with HashRouter routing
 * Port of routes from index_vuetify_main_app.php lines 317-358
 * Uses HashRouter to match existing Vue Router hash mode behavior
 */
function App() {
  const projectId = useProjectStore((s) => s.project_id);
  const initData = useProjectStore((s) => s.initData);
  const initTreeItems = useProjectStore((s) => s.initTreeItems);

  useEffect(() => {
    // Initialize tree items from template
    initTreeItems();
    // Load project data if we have an ID
    if (projectId) {
      initData(projectId);
    }
  }, [projectId, initData, initTreeItems]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HashRouter>
        <Routes>
          <Route element={<EditorLayout />}>
            {/* Home/Summary */}
            <Route path="/" element={<HomePage />} />

            {/* Study/metadata section routes */}
            <Route path="/study/:elementId" element={<StudyPage />} />
            <Route path="/study/:elementId/:subElementId" element={<StudyPage />} />

            {/* Data files */}
            <Route path="/datafiles" element={<DatafilesPage />} />
            <Route path="/datafile/:fileId" element={<DatafileEditPage />} />
            <Route path="/datafile-import/:fileId" element={<PlaceholderPage title="Import Data File" />} />

            {/* Variables */}
            <Route path="/variables/:fileId" element={<VariablesPage />} />
            <Route path="/variable-data/:fileId" element={<VariableDataPage />} />

            {/* External resources */}
            <Route path="/external-resources" element={<ExternalResourcesPage />} />
            <Route path="/external-resources/import" element={<ExternalResourceImportPage />} />
            <Route path="/external-resources/:resourceId" element={<ExternalResourceEditPage />} />
            <Route path="/external-resources/add" element={<PlaceholderPage title="Add External Resource" />} />

            {/* Geospatial */}
            <Route path="/geospatial-features" element={<GeospatialFeaturesPage />} />
            <Route path="/geospatial-features/edit/:featureId" element={<PlaceholderPage title="Edit Geospatial Feature" />} />
            <Route path="/geospatial-features/:featureId/characteristics" element={<PlaceholderPage title="Feature Characteristics" />} />
            <Route path="/feature-catalogue/features" element={<GeospatialFeaturesPage />} />
            <Route path="/feature-catalogue/features/:featureId" element={<PlaceholderPage title="Feature Details" />} />
            <Route path="/feature-catalogue/features/:featureId/characteristics" element={<PlaceholderPage title="Feature Characteristics" />} />

            {/* Metadata types */}
            <Route path="/metadata-types" element={<MetadataTypesPage />} />
            <Route path="/metadata-types/:typeId" element={<PlaceholderPage title="Metadata Type" />} />

            {/* Import/Export */}
            <Route path="/import" element={<ImportPage />} />
            <Route path="/publish" element={<PublishPage />} />
            <Route path="/project-package" element={<ProjectPackagePage />} />

            {/* Reports */}
            <Route path="/validation-report" element={<ValidationReportPage />} />
            <Route path="/generate-pdf" element={<GeneratePdfPage />} />
            <Route path="/change-log" element={<ChangeLogPage />} />

            {/* SDMX */}
            <Route path="/sdmx-csv-export" element={<SdmxCsvExportPage />} />

            {/* Additional routes from Vue app */}
            <Route path="/datafile-cleanup" element={<PlaceholderPage title="Data File Cleanup" />} />
            <Route path="/variable-groups/:fileId" element={<PlaceholderPage title="Variable Groups" />} />
            <Route path="/batch-variable-edit/:fileId" element={<PlaceholderPage title="Batch Variable Edit" />} />
            <Route path="/import-variables/:fileId" element={<PlaceholderPage title="Import Variables" />} />
            <Route path="/project-lock" element={<PlaceholderPage title="Project Lock" />} />
            <Route path="/versions" element={<PlaceholderPage title="Versions" />} />

            {/* Catch-all */}
            <Route path="*" element={<PlaceholderPage title="Page Not Found" description="This route does not exist." />} />
          </Route>
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
