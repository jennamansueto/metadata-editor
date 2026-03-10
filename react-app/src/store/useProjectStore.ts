import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { get as _get, set as _set } from 'lodash-es';
import apiClient from '../api/client';
import type {
  FormTemplate,
  TemplateItem,
  Template,
  DataFile,
  Variable,
  ExternalResource,
  GeospatialFeature,
  MetadataType,
  VersionInfo,
} from '../types';
import { findTemplateItemByKey } from '../utils/helpers';

// Store state interface
interface ProjectState {
  // State (from Vuex state lines 381-455)
  user_has_edit_access: boolean;
  active_section: string;
  project_type: string;
  idno: string;
  metadata_idno: string;
  project_id: number | null;
  formData: Record<string, unknown>;
  formTemplate: FormTemplate;
  formTemplateParts: Record<string, unknown>;
  templates: Template[];
  treeActiveNode: TemplateItem | null;
  treeItems: TemplateItem[];
  external_resources: ExternalResource[];
  metadata_types: MetadataType[];
  data_files: DataFile[];
  variable_groups: unknown[];
  geospatial_features: GeospatialFeature[];
  variables: Record<string, Variable[]>;
  project_isloading: boolean;
  project_is_locked: boolean;
  project_version_info: VersionInfo | null;
  variables_loaded: boolean;
  variables_isloading: boolean;
  variables_active_tab: string;
  project_info?: { title?: string; idno?: string };
  is_dirty: boolean;

  // Actions
  initData: (datasetId: number) => Promise<void>;
  initTreeItems: () => void;
  loadTemplatesList: () => Promise<void>;
  loadTemplateByUID: (templateUid: string) => Promise<void>;
  loadProject: (datasetId: number) => Promise<void>;
  loadDataFiles: (datasetId: number) => Promise<void>;
  loadExternalResources: (datasetId: number) => Promise<void>;
  loadGeospatialFeatures: (datasetId: number) => Promise<void>;
  loadVariableGroups: (datasetId: number) => Promise<void>;
  loadMetadataTypesList: () => Promise<void>;
  loadVariables: (datasetId: number, fid: string) => Promise<Variable[]>;
  loadAllVariables: (datasetId: number) => Promise<void>;

  // Mutations
  setTreeActiveNodeByPath: (nodeKey: string) => void;
  setTreeActiveNodeData: (node: TemplateItem | null) => void;
  setExternalResources: (data: ExternalResource[]) => void;
  addExternalResource: (resource: ExternalResource) => void;
  setDataFiles: (data: DataFile[]) => void;
  addDataFile: (file: DataFile) => void;
  setGeospatialFeatures: (data: GeospatialFeature[]) => void;
  setMetadataTypes: (data: MetadataType[]) => void;
  setVariables: (fid: string, variables: Variable[]) => void;
  addVariable: (fid: string, variable: Variable) => void;
  removeVariable: (fid: string, idx: number) => void;
  setVariablesActiveTab: (tab: string) => void;
  setFormField: (path: string, value: unknown) => void;
  getFormField: (path: string) => unknown;
  setIsDirty: (dirty: boolean) => void;

  // Getters (computed-like)
  getDataFileById: (fid: string) => DataFile | undefined;
  getDataFileNameById: (fid: string) => string | undefined;
  getVariablesByFid: (fid: string) => Variable[] | undefined;
  getTemplateItemByKey: (key: string) => TemplateItem | null;
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    // State initialization from PHP-injected globals
    user_has_edit_access: window.user_has_edit_access ?? false,
    active_section: 'not set',
    project_type: window.project_type ?? '',
    idno: window.project_idno ?? '',
    metadata_idno: '',
    project_id: window.project_sid ?? null,
    formData: window.project_metadata ?? {},
    formTemplate: (window.form_template as FormTemplate) ?? {
      uid: '',
      template: { items: [] },
    },
    formTemplateParts: window.form_template_parts ?? {},
    templates: [],
    treeActiveNode: null,
    treeItems: [],
    external_resources: [],
    metadata_types: [],
    data_files: [],
    variable_groups: [],
    geospatial_features: [],
    variables: {},
    project_isloading: false,
    project_is_locked: false,
    project_version_info: null,
    variables_loaded: false,
    variables_isloading: false,
    variables_active_tab: 'documentation',
    is_dirty: false,

    // Actions (port from Vuex actions lines 579-875)
    initData: async (datasetId: number) => {
      set((state) => {
        state.project_isloading = true;
      });
      await get().loadTemplatesList();
      await get().loadProject(datasetId);
      await get().loadDataFiles(datasetId);
      await get().loadExternalResources(datasetId);
      await get().loadVariableGroups(datasetId);
      await get().loadMetadataTypesList();

      if (get().project_type === 'geospatial') {
        await get().loadGeospatialFeatures(datasetId);
      }

      set((state) => {
        state.variables_loaded = true;
        state.project_isloading = false;
      });
    },

    initTreeItems: () => {
      set((state) => {
        state.treeItems = state.formTemplate.template.items as TemplateItem[];
      });
    },

    loadTemplatesList: async () => {
      try {
        const url = `/api/templates/list/${get().project_type}`;
        const response = await apiClient.get(url);
        set((state) => {
          state.templates = response.data.result || [];
        });
      } catch (error) {
        console.error('Error loading templates list:', error);
      }
    },

    loadTemplateByUID: async (templateUid: string) => {
      try {
        const url = `/api/templates/${templateUid}`;
        const response = await apiClient.get(url);
        if (response.data.template) {
          set((state) => {
            state.formTemplate = response.data;
          });
        } else {
          console.error('Error loading template', response.data);
        }
      } catch (error) {
        console.error('Error loading template:', error);
      }
    },

    loadProject: async (datasetId: number) => {
      try {
        const url = `/api/editor/${datasetId}`;
        const response = await apiClient.get(url);
        if (response.data.project?.metadata) {
          const project = response.data.project;
          if (
            project.metadata &&
            typeof project.metadata === 'object' &&
            !Array.isArray(project.metadata)
          ) {
            set((state) => {
              state.formData = project.metadata;
              if (project.study_idno) {
                state.metadata_idno = project.study_idno;
              }
              if (project.is_locked) {
                state.project_is_locked = project.is_locked;
              }
              state.project_version_info = {
                version_number: project.version_number,
                version_created: project.version_created,
                version_notes: project.version_notes,
                version_created_by: project.version_created_by,
              };
            });
          } else {
            console.error('Error reading project metadata', response.data);
            set((state) => {
              state.formData = {};
            });
          }
        }
      } catch (error) {
        console.error('Error loading project:', error);
      }
    },

    loadDataFiles: async (datasetId: number) => {
      try {
        const url = `/api/datafiles/${datasetId}`;
        const response = await apiClient.get(url);
        if (response.data.datafiles) {
          const dataFiles: DataFile[] = [];
          Object.keys(response.data.datafiles).forEach((key) => {
            dataFiles.push(response.data.datafiles[key]);
          });
          set((state) => {
            state.data_files = dataFiles;
          });
        }
      } catch (error) {
        console.error('Error loading datafiles:', error);
      }
    },

    loadGeospatialFeatures: async (datasetId: number) => {
      try {
        const url = `/api/geospatial-features/${datasetId}`;
        const response = await apiClient.get(url);
        if (response.data.status === 'success') {
          set((state) => {
            state.geospatial_features = response.data.features || [];
          });
        }
      } catch (error) {
        console.error('Error loading geospatial features:', error);
      }
    },

    loadExternalResources: async (datasetId: number) => {
      try {
        const url = `/api/resources/${datasetId}`;
        const response = await apiClient.get(url);
        if (response.data.resources) {
          set((state) => {
            state.external_resources = response.data.resources;
          });
        }
      } catch (error) {
        console.error('Error loading external resources:', error);
      }
    },

    loadMetadataTypesList: async () => {
      try {
        const projectId = get().project_id;
        const url = `/api/admin-metadata/templates_by_project/${projectId}`;
        const response = await apiClient.get(url);
        set((state) => {
          state.metadata_types = response.data.result || [];
        });
      } catch (error) {
        console.error('Error loading metadata types:', error);
      }
    },

    loadVariableGroups: async (datasetId: number) => {
      try {
        const url = `/api/variable_groups/${datasetId}?variable_groups`;
        const response = await apiClient.get(url);
        if (response.data.variable_groups) {
          set((state) => {
            state.variable_groups = response.data.variable_groups;
          });
        }
      } catch (error) {
        console.error('Error loading variable groups:', error);
      }
    },

    loadVariables: async (datasetId: number, fid: string) => {
      const BATCH_SIZE = 500;
      let offset = 0;
      let allVariables: Variable[] = [];
      let total: number | null = null;

      do {
        try {
          const url = `/api/variables/${datasetId}/${fid}?detailed=1&offset=${offset}&limit=${BATCH_SIZE}`;
          const response = await apiClient.get(url);

          if (response.data.variables?.length > 0) {
            allVariables = allVariables.concat(response.data.variables);
            if (total === null && response.data.total !== undefined) {
              total = response.data.total;
            }
            offset += response.data.variables.length;
            if (response.data.variables.length < BATCH_SIZE) {
              break;
            }
          } else {
            break;
          }
        } catch (error) {
          console.error('Error loading variables batch:', error);
          throw error;
        }
      } while (total === null || offset < total);

      if (allVariables.length > 0) {
        set((state) => {
          state.variables[fid] = allVariables;
        });
      }

      return allVariables;
    },

    loadAllVariables: async (datasetId: number) => {
      const files = get().data_files;
      for (const file of files) {
        await get().loadVariables(datasetId, file.file_id);
      }
    },

    // Mutations (port from lines 876-933)
    setTreeActiveNodeByPath: (nodeKey: string) => {
      const items = get().formTemplate.template.items;
      const node = findTemplateItemByKey(
        items as Array<{ key?: string; items?: unknown[] }>,
        nodeKey
      ) as TemplateItem | null;
      set((state) => {
        state.treeActiveNode = node;
      });
    },

    setTreeActiveNodeData: (node: TemplateItem | null) => {
      set((state) => {
        state.treeActiveNode = node;
      });
    },

    setExternalResources: (data: ExternalResource[]) => {
      set((state) => {
        state.external_resources = data;
      });
    },

    addExternalResource: (resource: ExternalResource) => {
      set((state) => {
        state.external_resources.push(resource);
      });
    },

    setDataFiles: (data: DataFile[]) => {
      set((state) => {
        state.data_files = data;
      });
    },

    addDataFile: (file: DataFile) => {
      set((state) => {
        state.data_files.push(file);
      });
    },

    setGeospatialFeatures: (data: GeospatialFeature[]) => {
      set((state) => {
        state.geospatial_features = data;
      });
    },

    setMetadataTypes: (data: MetadataType[]) => {
      set((state) => {
        state.metadata_types = data;
      });
    },

    setVariables: (fid: string, variables: Variable[]) => {
      set((state) => {
        state.variables[fid] = variables;
      });
    },

    addVariable: (fid: string, variable: Variable) => {
      set((state) => {
        if (!state.variables[fid]) {
          state.variables[fid] = [];
        }
        state.variables[fid].push(variable);
      });
    },

    removeVariable: (fid: string, idx: number) => {
      set((state) => {
        if (state.variables[fid]) {
          state.variables[fid].splice(idx, 1);
        }
      });
    },

    setVariablesActiveTab: (tab: string) => {
      set((state) => {
        state.variables_active_tab = tab;
      });
    },

    // Deep form data binding - replaces vue-deepset $deepModel pattern
    setFormField: (path: string, value: unknown) => {
      set((state) => {
        _set(state.formData, path, value);
        state.is_dirty = true;
      });
    },

    getFormField: (path: string) => {
      return _get(get().formData, path);
    },

    setIsDirty: (dirty: boolean) => {
      set((state) => {
        state.is_dirty = dirty;
      });
    },

    // Getters
    getDataFileById: (fid: string) => {
      return get().data_files.find((f) => f.file_id === fid);
    },

    getDataFileNameById: (fid: string) => {
      const file = get().data_files.find((f) => f.file_id === fid);
      return file?.file_name;
    },

    getVariablesByFid: (fid: string) => {
      return get().variables[fid];
    },

    getTemplateItemByKey: (key: string) => {
      const items = get().formTemplate.template.items;
      return findTemplateItemByKey(
        items as Array<{ key?: string; items?: unknown[] }>,
        key
      ) as TemplateItem | null;
    },
  }))
);
