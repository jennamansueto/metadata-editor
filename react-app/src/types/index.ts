// TypeScript type definitions for the metadata editor
// Based on the Vuex store state in index_vuetify_main_app.php lines 380-455

export interface EnumItem {
  code: string;
  label: string;
}

export interface TemplateItem {
  key: string;
  title: string;
  type: string;
  display_type?: string;
  items?: TemplateItem[];
  props?: TemplateItem[];
  enum?: EnumItem[];
  help_text?: string;
  required?: boolean;
  is_required?: boolean;
  is_recommended?: boolean;
  is_readonly?: boolean;
  is_custom?: boolean;
  is_editable?: boolean;
  rules?: string;
  class?: string;
  content_format?: string;
  enum_store_column?: string;
  file?: string;
  [key: string]: unknown;
}

export interface FormTemplate {
  uid: string;
  name?: string;
  template: { items: TemplateItem[] };
  [key: string]: unknown;
}

export interface TreeItem {
  title: string;
  type: string;
  key: string;
  file?: string;
  items?: TreeItem[];
  is_required?: boolean;
  is_recommended?: boolean;
  help_text?: string;
  display_type?: string;
  index?: number;
  datafile?: DataFile;
  resource?: ExternalResource;
  feature?: GeospatialFeature;
  metadata_type?: MetadataType;
  [key: string]: unknown;
}

export interface Template {
  uid: string;
  name: string;
  version?: string;
  lang?: string;
  [key: string]: unknown;
}

export interface DataFile {
  file_id: string;
  file_name: string;
  file_type?: string;
  id?: number;
  [key: string]: unknown;
}

export interface Variable {
  vid: string;
  name: string;
  labl?: string;
  var_type?: string;
  [key: string]: unknown;
}

export interface ExternalResource {
  id: number;
  title: string;
  [key: string]: unknown;
}

export interface GeospatialFeature {
  id: number;
  name?: string;
  file_name?: string;
  [key: string]: unknown;
}

export interface MetadataType {
  id: number;
  name: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export interface VersionInfo {
  version_number?: string | number;
  version_created?: string;
  version_notes?: string;
  version_created_by?: string;
}

export interface ProjectEditStats {
  username?: string;
  username_cr?: string;
  created?: string;
  changed?: string;
  [key: string]: unknown;
}

export interface ProjectDiskUsage {
  size_formatted?: string;
  size?: number;
  [key: string]: unknown;
}

export interface ProjectInfo {
  title?: string;
  idno?: string;
}

export interface FormTextFieldStyle {
  clearable: boolean;
  dense: boolean;
  filled: boolean;
  outlined: boolean;
}

export interface AppState {
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
  project_info?: ProjectInfo;
  formTextFieldStyle: FormTextFieldStyle;
}
