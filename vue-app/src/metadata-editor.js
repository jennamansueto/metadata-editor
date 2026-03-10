/**
 * Metadata Editor - Vite Bundle Entry Point
 * 
 * This file bundles all Vue components, the Vuex store, Vue Router setup,
 * VeeValidate rules, and the Vue app creation for the metadata editor.
 * 
 * External libraries (Vue, Vuex, Vuetify, axios, etc.) are loaded via
 * <script> tags before this bundle and are available as globals.
 * 
 * PHP-templated variables (CI, sid, form_template, project_metadata, etc.)
 * are set in inline <script> blocks in the PHP view before this bundle loads.
 */

// ============================================================
// 1. Plugin Registration
// ============================================================
Vue.use(Vuex);
Vue.use(VueDeepSet);

window.bus = new Vue();

// ============================================================
// 2. Global Mixin
// ============================================================
Vue.mixin({
    methods: {
        normalizeClassID: function(class_id){
            return class_id.replace(/\./g, "-");
        },
        nestedArrayToStringValue: function(arr, output='') 
        {
            let vm=this;
            if (Array.isArray(arr)) {
                arr.forEach(function (item) {
                output = vm.nestedArrayToStringValue(item, output);
                });
            } else {
                if (typeof arr === 'object') {
                let keys = Object.keys(arr);
                keys.forEach(function (key) {
                    if (typeof arr[key] === 'object'){
                    output = vm.nestedArrayToStringValue(arr[key], output);
                    }else{
                    output+= " " + arr[key];
                    }            
                });
                }
            }
            return output.trim();
        },
        copyToClipBoard: function(textToCopy){
            const tmpTextField = document.createElement("textarea")
            tmpTextField.textContent = textToCopy
            tmpTextField.setAttribute("style","position:absolute; right:200%;")
            document.body.appendChild(tmpTextField)
            tmpTextField.select()
            tmpTextField.setSelectionRange(0, 99999) /*For mobile devices*/
            document.execCommand("copy")
            tmpTextField.remove();
        },

        pasteFromClipBoard: async function() 
        {
            const text = await navigator.clipboard.readText();
            return text;                    
        },
        CSVToArray: function ( strData, strDelimiter )
        {
            //source: https://gist.github.com/bennadel/9753411#file-code-1-htm
            
            // Check to see if the delimiter is defined. If not,
            // then default to comma.
            strDelimiter = (strDelimiter || ",");

            // Create a regular expression to parse the CSV values.
            var objPattern = new RegExp(
                (
                    // Delimiters.
                    "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

                    // Quoted fields.
                    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

                    // Standard fields.
                    "([^\"\\" + strDelimiter + "\\r\\n]*))"
                ),
                "gi"
                );


            // Create an array to hold our data. Give the array
            // a default empty first row.
            var arrData = [[]];

            // Create an array to hold our individual pattern
            // matching groups.
            var arrMatches = null;


            // Keep looping over the regular expression matches
            // until we can no longer find a match.
            while (arrMatches = objPattern.exec( strData )){

                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[ 1 ];

                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                if (
                    strMatchedDelimiter.length &&
                    strMatchedDelimiter !== strDelimiter
                    ){

                    // Since we have reached a new row of data,
                    // add an empty row to our data array.
                    arrData.push( [] );

                }

                var strMatchedValue;

                // Now that we have our delimiter out of the way,
                // let's check to see which kind of value we
                // captured (quoted or unquoted).
                if (arrMatches[ 2 ]){

                    // We found a quoted value. When we capture
                    // this value, unescape any double quotes.
                    strMatchedValue = arrMatches[ 2 ].replace(
                        new RegExp( "\"\"", "g" ),
                        "\""
                        );

                } else {

                    // We found a non-quoted value.
                    strMatchedValue = arrMatches[ 3 ];

                }


                // Now that we have our value string, let's add
                // it to the data array.
                arrData[ arrData.length - 1 ].push( strMatchedValue );
            }

            // Return the parsed data.
            return( arrData );
        }
    }
});

// ============================================================
// 3. Component Imports (side-effect only, same order as PHP includes)
// ============================================================

// Global components
import './components/vue/vue-global-eventbus.js';
import './components/vue/vue-alert-dialog-component.js';
import './components/editor_common/global-site-header-component.js';

// Metadata editor components
import './components/metadata_editor/vue-project-export-json-component.js';
import './components/metadata_editor/vue-template-validation-component.js';
import './components/metadata_editor/vue-template-apply-defaults-component.js';
import './components/metadata_editor/vue-toast-component.js';
import './components/metadata_editor/vue-login-component.js';
import './components/metadata_editor/fields/vue-field-date.js';
import './components/metadata_editor/fields/vue-field-bounding-box.js';

import './components/metadata_editor/vue-spreadmetadata-component.js';
import './components/metadata_editor/vue-form-main-component.js';
import './components/metadata_editor/vue-form-component.js';
import './components/metadata_editor/vue-form-preview-component.js';
import './components/metadata_editor/vue-nested-section-preview-component.js';

import './components/metadata_editor/vue-files-component.js';
import './components/metadata_editor/vue-external-resources-component.js';
import './components/metadata_editor/vue-external-resources-edit-component.js';
import './components/metadata_editor/vue-resumable-file-upload-component.js';
import './components/metadata_editor/vue-external-resources-create-component.js';
import './components/metadata_editor/vue-datafiles-component.js';
import './components/metadata_editor/vue-datafile-edit-component.js';
import './components/metadata_editor/vue-datafile-component.js';
import './components/metadata_editor/vue-datafile-import-component.js';
import './components/metadata_editor/vue-datafile-data-explorer-component.js';
import './components/metadata_editor/vue-dialog-datafile-export-component.js';
import './components/metadata_editor/vue-dialog-batch-export-component.js';
import './components/metadata_editor/vue-dialog-batch-sum-stats-options-component.js';

import './components/metadata_editor/vue-variable-edit-documentation-component.js';
import './components/metadata_editor/vue-variables-component.js';
import './components/metadata_editor/vue-variables-validation-component.js';
import './components/metadata_editor/vue-variable-edit-component.js';
import './components/metadata_editor/vue-variable-weights-component.js';
import './components/metadata_editor/vue-variable-categories-component.js';
import './components/metadata_editor/vue-variable-info-edit-component.js';

// Tree view component
import './components/metadata_editor/vue-form-tree.js';

// Metadata grid component
import './components/metadata_editor/vue-grid-component.js';
import './components/metadata_editor/vue-grid-preview-component.js';

// Nested
import './components/metadata_editor/vue-nested-section-component.js';
import './components/metadata_editor/vue-form-input-component.js';
import './components/metadata_editor/vue-nested-array-component.js';

import './components/metadata_editor/vue-simple-array-component.js';
import './components/metadata_editor/vue-table-component.js';

import './components/metadata_editor/vue-geospatial-identification-component.js';

import './components/metadata_editor/vue-import-options-component.js';
import './components/metadata_editor/vue-publish-options-component.js';
import './components/metadata_editor/vue-sdmx-csv-export-component.js';
import './components/metadata_editor/vue-project-package-component.js';
import './components/metadata_editor/vue-external-resources-import-component.js';
import './components/metadata_editor/vue-configure-catalog-component.js';
import './components/metadata_editor/vue-summary-component.js';
import './components/metadata_editor/vue-summary-files-component.js';
import './components/metadata_editor/vue-summary-sharing-component.js';
import './components/metadata_editor/vue-thumbnail-component.js';

import './components/metadata_editor/vue-table-grid-component.js';
import './components/metadata_editor/vue-nested-section-subsection-component.js';
import './components/metadata_editor/vue-repeated-field-component.js';
import './components/metadata_editor/vue-form-section-component.js';
import './components/metadata_editor/vue-generate-pdf-component.js';
import './components/metadata_editor/vue-variable-groups-component.js';
import './components/metadata_editor/vue-dialog-variable-selection-component.js';
import './components/metadata_editor/vue-dialog-weight-variable-selection-component.js';
import './components/metadata_editor/vue-dialog-component.js';
import './components/metadata_editor/vue-dialog-datafile-replace-component.js';
import './components/metadata_editor/vue-dialog-enum-selection-component.js';
import './components/metadata_editor/vue-geospatial-feature-component.js';

import './components/metadata_editor/vue-page-preview-component.js';
import './components/metadata_editor/vue-geospatial-gallery-component.js';

import './components/project/vue-project-share-component.js';
import './components/project/vue-collection-share-component.js';
import './components/metadata_editor/vue-summary-collections-component.js';
import './components/metadata_editor/vue-project-tags-component.js';
import './components/metadata_editor/vue-textarea-latex-component.js';
import './components/metadata_editor/vue-project-history-component.js';
import './components/metadata_editor/vue-admin-metadata-history-component.js';

import './components/metadata_editor/vue-metadata-type-edit-component.js';
import './components/metadata_editor/vue-metadata-types-component.js';

import './components/metadata_editor/vue-schema-array-field-component.js';
import './components/metadata_editor/vue-schema-object-field-component.js';

import './components/metadata_editor/vue-admin-metadata-edit-component.js';
import './components/metadata_editor/vue-dialog-admin-metadata-component.js';
import './components/metadata_editor/vue-summary-templates-component.js';
import './components/metadata_editor/vue-json-edit-component.js';
import './components/metadata_editor/vue-validation-report-component.js';
import './components/metadata_editor/vue-geospatial-features-component.js';
import './components/metadata_editor/vue-geospatial-feature-edit-component.js';
import './components/metadata_editor/vue-geospatial-feature-import-component.js';
import './components/metadata_editor/vue-geospatial-feature-characteristics-component.js';
import './components/metadata_editor/vue-geospatial-feature-data-component.js';
import './components/metadata_editor/vue-geospatial-feature-description-component.js';

import './components/metadata_editor/vue-indicator-dsd-component.js';
import './components/metadata_editor/vue-indicator-dsd-edit-component.js';
import './components/metadata_editor/vue-indicator-dsd-import-component.js';
import './components/metadata_editor/vue-indicator-dsd-chart-component.js';

// ============================================================
// 4. Route Definitions
// ============================================================

// Define route components
const main = {props:['element_id'],template: '<div><form-main/></div>' };
const Home = { template: '<div><summary-component/> </div>' };
const PublishProject = { template: '<div><publish-options/> </div>' };
const ProjectPackage = { template: '<div><project-package/> </div>' };
const ProjectPdf = { template: '<div><generate-pdf/> </div>' };
const ConfigureCatalog = { template: '<div><configure-catalog/> </div>' };
const ImportOptions = { template: '<div><import-options/> </div>' };
const _main = {props: ['active_section'],template: '<div><study-metadata/></div>' };
const Datafiles ={template: '<div><datafiles/></div>'};
const Datafile = {props: ['file_id'],template: '<div><datafile/></div>' };
const DatafileEdit=Vue.component('datafile-edit');
const DatafileExplorer = {props: ['file_id'],template: '<div><datafile-data-explorer/></div>' };
const DatafileImport = {template: '<div><datafile-import/></div>' };
const Variables ={props: ['file_id'],template: '<div><variables/></div>'};
const VariableGroups ={template: '<div><variable-groups /> </div>'};
const ResourcesComp =Vue.component('external-resources');
const FileManager ={props: ['index'],template: '<div><file-manager /></div>'};
const ResourcesImport ={template: '<div> <external-resources-import /></div>'};
const ResourcesEditComp =Vue.component('external-resources-edit');
const ResourcesCreateComp =Vue.component('external-resources-create');
const GeoFeatures ={props: ['index'],template: '<div><geospatial-features/></div>'};
const GeoFeaturesImport ={props: ['index'],template: '<div><geospatial-feature-import/></div>'};
const GeoFeature ={props: ['id'],template: '<div><geospatial-feature-edit :feature_id="id"/></div>'};
const GeoFeatureCharacteristics ={props: ['feature_id'],template: '<div><geospatial-feature-characteristics :feature_id="feature_id"/></div>'};
const GeoFeatureData ={props: ['feature_id'],template: '<div><geospatial-feature-data :feature_id="feature_id"/></div>'};
const GeoFeatureDescription ={template: '<div><geospatial-feature-description/></div>'};
const PagePreview ={template: '<div><page-preview/></div>'};
const GeoGallery ={template: '<div><geospatial-gallery/></div>'};
const IndicatorDsd ={template: '<div><indicator-dsd/></div>'};
const IndicatorDsdImport ={template: '<div><indicator-dsd-import/></div>'};
const IndicatorDsdChart ={template: '<div><indicator-dsd-chart/></div>'};
const ProjectHistory ={template: '<div><project-history/></div>'};
const AdminMetadataHistory ={template: '<div><admin-metadata-history/></div>'};
const SdmxCsvExport = {template: '<div><sdmx-csv-export-options/></div>'};
const ValidationReport ={template: '<div><validation-report/></div>'};

const AdminMetadataEdit= Vue.component('admin-metadata-edit');
const MetadataTypesComp =Vue.component('metadata-types');

// Routes
const routes = [
    { path: '/', component: Home },
    { path: '/page-preview', component: PagePreview },
    { path: '/publish', component: PublishProject },
    { path: '/project-package', component: ProjectPackage },
    { path: '/generate-pdf', component: ProjectPdf },            
    { path: '/configure-catalog', component: ConfigureCatalog },
    { path: '/import', component: ImportOptions },
    { path: '/study/:element_id', component: main, name: 'study',props: true },
    { path: '/datafile/:file_id', component: DatafileEdit, props:true, name: 'datafile-edit' },
    { path: '/data-explorer/:file_id', component: DatafileExplorer, props:true },
    { path: '/datafiles', component: Datafiles },
    { path: '/datafiles/import', component: DatafileImport },
    { path: '/variables/:file_id', component: Variables, props: true },
    { path: '/variables-validation/:file_id', component: { props: ['file_id'], template: '<div><variables-validation></variables-validation></div>' }, props: true, name: 'variables-validation' },
    { path: '/variable-groups', component: VariableGroups},
    { path: '/external-resources', component: ResourcesComp, props: true, name: 'external-resources'},
    { path: '/external-resources/create', component: ResourcesCreateComp, props: true, name: 'external-resources-create'},
    { path: '/external-resources/import', component: ResourcesImport},
    { path: '/external-resources/:index', component: ResourcesEditComp, props: true, name: 'external-resources-edit'},            
    { path: '/files', component: FileManager, props: true},
    { path: '/geospatial-features', component: GeoFeatures, props: true},
    { path: '/geospatial-features/description', component: GeoFeatureDescription, props: true},
    { path: '/geospatial-features/import', component: GeoFeaturesImport, props: true},
    { path: '/geospatial-features/edit/:id', component: GeoFeature, props: true },
    { path: '/geospatial-features/:feature_id/characteristics', component: GeoFeatureCharacteristics, props: true },
    { path: '/geospatial-features/:feature_id/data', component: GeoFeatureData, props: true },
    // This route must come last to avoid matching /description or /import
    { path: '/geospatial-features/:id', component: GeoFeature, props: true },
    { path: '/geospatial-gallery', component: GeoGallery, props: true },
    { path: '/indicator-dsd', component: IndicatorDsd, name: 'indicator-dsd', props: true },
    { path: '/indicator-dsd-import', component: IndicatorDsdImport, name: 'indicator-dsd-import', props: true },
    { path: '/indicator-dsd-chart', component: IndicatorDsdChart, name: 'indicator-dsd-chart', props: true },
    { path: '/change-log', component: ProjectHistory },
    { path: '/sdmx-csv-export', component: SdmxCsvExport },
    { path: '/validation-report', component: ValidationReport, name: 'validation-report', props: true },
    { path: '/metadata-types', component: MetadataTypesComp, name:'metadata-types', props: true },
    { path: '/metadata-types/:type_id/change-log', component: AdminMetadataHistory, name:'admin-metadata-change-log', props: true },
    { path: '/metadata-types/:type_id', component: AdminMetadataEdit, name:'metadata-type', props: true }
];

window.router = new VueRouter({
    routes
});

window.router.beforeEach((to, from, next)=>{
    var route_path=to.path.replace('/study/','');

    console.log("route path",route_path);
    
    if (!store.state.treeActiveNode){
        console.log("no active node");
        if (store.getters.getTemplateItemByKey(route_path)){
            store.commit('tree_active_node_path',route_path);
        }
    }

    next();
});

// Make router available without window prefix for component compatibility
var router = window.router;

// ============================================================
// 5. Vuex Store
// ============================================================

window.store = new Vuex.Store({
    state: {
        user_has_edit_access:user_has_edit_access,
        active_section: "not set",
        project_type:project_type,
        idno:project_idno, //project unique ID
        metadata_idno:'',//study idno
        project_id:project_sid,
        formData: project_metadata,
        formTemplate:form_template,
        formTemplateParts:form_template_parts,
        templates:[],//list of templates available                
        treeActiveNode:null,
        treeItems:[],
        active_node: {
            id: 'table_description.title_statement.table_number'
        },
        external_resources:[],
        metadata_types:[],//business/application/other metadata
        data_files:[],
        variable_groups:[],
        geospatial_features:[],
        variables:{
            "F1":{}
        },
        project_isloading:false,
        project_is_locked:false,
        project_version_info:null,
        variables_loaded:false,
        variables_isloading:false,
        variables_active_tab:"documentation",
        variable_documentation_fields:[
            "variable.var_imputation",
            "variable.var_derivation",
            "variable.var_security",
            "variable.var_respunit",
            "variable.var_qstn_preqtxt",
            "variable.var_qstn_qstnlit",
            "variable.var_qstn_postqtxt",
            "variable.var_forward",
            "variable.var_backward",                    
            "variable.var_qstn_ivuinstr",
            "variable.var_universe",
            "variable.var_txt",
            "variable.var_codinstr",
            "variable.var_concept",
            "variable.var_notes",
            "variable.var_std_catgry"
        ],
        variable_template_items_enabled:[
            "variable.var_imputation",
            "variable.var_derivation",
            "variable.var_security",
            "variable.var_respunit",
            "variable.var_qstn_preqtxt",
            "variable.var_qstn_qstnlit",
            "variable.var_qstn_postqtxt",
            "variable.var_forward",
            "variable.var_backward",                    
            "variable.var_qstn_ivuinstr",
            "variable.var_universe",
            "variable.var_txt",
            "variable.var_codinstr",
            "variable.var_concept",
            "variable.var_notes",
            "variable.var_std_catgry"
        ],                                    
        formTextFieldStyle:
        { 
            clearable: true,
            "single-line":true,
            dense:true,
            filled:false,
            outlined:true,                    
            style:"xborder-top:1px solid gray;"
        }
    },
    getters: {
        getUserHasEditAccess(state){
            return state.user_has_edit_access;
        },
        getProjectIsLocked(state){
            return state.project_is_locked;
        },
        getProjectVersionInfo(state){
            return state.project_version_info;
        },
        getIDNO(state){
            return state.idno;
        },
        getProjectID(state){
            return state.project_id;
        },
        getProjectType(state){
            return state.project_type;
        },
        getMetadataTypes(state){//todo remove
            return state.metadata_types;
        },
        getAdminMetadataTemplates(state){
            return state.metadata_types;
        },
        getProjectTemplate(state){
            return state.formTemplate;
        },
        getDataFiles(state) {
            return state.data_files;
        },
        getDataFileById: (state) => (fid) => {
            for(var i=0;i<state.data_files.length;i++){
                if(state.data_files[i].file_id==fid){
                    return state.data_files[i];
                }
            }
        },
        getDataFileNameById: (state) => (fid) => {
            for(var i=0;i<state.data_files.length;i++){
                if(state.data_files[i].file_id==fid){
                    return state.data_files[i].file_name;
                }
            }
        },                
        getVariablesAll(state) {                
            return state.variables;
        },
        getVariablesByFid: (state) => (fid) => {
            return state.variables[fid];
        },
        getMaxFileId: function(state){
            var max_file_id=0;
            let datafiles=state.data_files;
            
            for(var i=0;i<datafiles.length;i++){
                var file_id=datafiles[i].file_id;
                if (parseInt(file_id.substr(1))>max_file_id){
                    max_file_id=file_id.substr(1);
                }
            }

            return parseInt(max_file_id);
        },
        getMaxVariableId: function(state){
            var max_var=0;
            let variables=state.variables;
            let datafile_names=Object.keys(variables);

            for(var k=0;k<datafile_names.length;k++){
                var fid=datafile_names[k];
                
                for(var i=0;i<variables[fid].length;i++){
                    var variable=variables[fid][i];
                    if(parseInt(variable.vid.substr(1))>max_var){
                        max_var=variable.vid.substr(1);
                    }
                }
            }
            return parseInt(max_var);
        },
        getVariablesActiveTab: function(state){
            return state.variables_active_tab;
        },
        getTreeItems(state){
            return state.treeItems;
        },
        //find template item by key                
        getTemplateItemByKey: (state) => (key) => {
            
            let findTemplateByItemKey= function (items,key){
                let item=null;
                let found=false;
                let i=0;

                while(!found && i<items.length){
                    if (items[i].key==key){
                        item=items[i];
                        found=true;
                    }else{
                        if (items[i].items){
                            item=findTemplateByItemKey(items[i].items,key);
                            if (item){
                                found=true;
                            }
                        }
                    }
                    i++;                        
                }
                return item;
            }

            //search nested formTemplate
            let items=window.store.state.formTemplate.template.items;
            let item=findTemplateByItemKey(items,key);

            return item;
        },
        GetVariableDocumentationFields: function(state){                    
            return state.variable_documentation_fields;
        },
    },
    actions: {               
        async initData({commit},options) {
            window.store.state.project_isloading=true;
            await window.store.dispatch('loadTemplatesList',{});
            await window.store.dispatch('loadProject',{dataset_id:options.dataset_id});
            await window.store.dispatch('loadDataFiles',{dataset_id:options.dataset_id});
            await window.store.dispatch('loadExternalResources',{dataset_id:options.dataset_id});
            await window.store.dispatch('loadVariableGroups',{dataset_id:options.dataset_id});
            await window.store.dispatch('loadMetadataTypesList',{});
            
            // Load geospatial features for geospatial projects
            if (window.store.state.project_type === 'geospatial') {
                await window.store.dispatch('loadGeospatialFeatures',{dataset_id:options.dataset_id});
            }
            
            window.store.state.variables_loaded=true;
            window.store.state.project_isloading=false;
        },
        async initTreeItems({commit},options) {               
            window.store.state.treeItems=window.store.state.formTemplate.template.items;    
        },
        async loadTemplatesList({commit},options) {
            let url=CI.base_url + '/api/templates/list/'+window.store.state.project_type;
            return axios
            .get(url)
            .then(function (response) {
                window.store.state.templates=response.data.result;
            })
            .catch(function (error) {
                console.log(error);
            });
        },
        async loadTemplateByUID({commit},options) {                    
            let url=CI.base_url + '/api/templates/'+options.template_uid;
            return axios
            .get(url)
            .then(function (response) {                        
                if (response.data.template){
                    window.store.state.formTemplate=response.data;
                }else{
                    console.log("error load template", response.data);
                    alert("error loading template");
                }
            })
            .catch(function (error) {
                console.log(error);
            });
        },
        async loadProject({commit},options) {
            let url=CI.base_url + '/api/editor/'+options.dataset_id;
            return axios
            .get(url)
            .then(function (response) {                        
                if (response.data.project && response.data.project.metadata){
                    if (response.data.project.metadata.constructor.name == 'Object'){
                        window.store.state.formData=response.data.project.metadata;
                        if (response.data.project.study_idno){
                            window.store.state.metadata_idno=response.data.project.study_idno;
                        }
                        
                        if (response.data.project.is_locked){
                            window.store.state.project_is_locked=response.data.project.is_locked;
                        }

                        window.store.state.project_version_info={
                            version_number:response.data.project.version_number,
                            version_created:response.data.project.version_created,
                            version_notes:response.data.project.version_notes,
                            version_created_by:response.data.project.version_created_by
                        }
                        
                    }else{
                        alert("Error reading project metadata");
                        console.log("Error reading project metadata",response.data);
                        window.store.state.formData={};
                    }
                }                        
            })
            .catch(function (error) {
                console.log("error loading project",error);
            });
        },
        async loadDataFiles({commit},options) {                    
            let url=CI.base_url + '/api/datafiles/'+options.dataset_id;
            return axios
            .get(url)
            .then(function (response) {
                let data_files_=[];
                if(response.data.datafiles){
                    Object.keys(response.data.datafiles).forEach(function(element, index) { 
                        data_files_.push(response.data.datafiles[element]);
                    })
                    commit('data_files',data_files_);
                }
            })
            .catch(function (error) {
                console.log("error loading datafiles", error);
            });                    
        },
        async loadGeospatialFeatures({commit},options) {                    
            let url=CI.base_url + '/api/geospatial-features/'+options.dataset_id;
            return axios
            .get(url)
            .then(function (response) {
                if(response.data.status === 'success'){
                    commit('setGeospatialFeatures',response.data.features);
                }
            })
            .catch(function (error) {
                console.log("error loading geospatial features", error);
            });                    
        },
        async loadAllVariables({commit,state},options) {                    
            var i=0;
            for (let file of state.data_files) {
                await window.store.dispatch('loadVariables',{dataset_id:options.dataset_id, fid:file.file_id});
            }
        },
        async loadVariables({commit}, options) {
            // Load variables in batches to improve performance
            const BATCH_SIZE = 500;
            let offset = 0;
            let allVariables = [];
            let total = null;
            
            do {
                let url = CI.base_url + '/api/variables/' + options.dataset_id + '/' + options.fid + '?detailed=1&offset=' + offset + '&limit=' + BATCH_SIZE;
                
                try {
                    let response = await axios.get(url);
                    
                    if(response.data.variables && response.data.variables.length > 0){
                        allVariables = allVariables.concat(response.data.variables);
                        
                        if(total === null && response.data.total !== undefined){
                            total = response.data.total;
                        }
                        
                        offset += response.data.variables.length;
                        
                        if(response.data.variables.length < BATCH_SIZE){
                            break;
                        }
                    } else {
                        break;
                    }
                } catch (error) {
                    console.log("error loading variables batch", error);
                    throw error;
                }
            } while(total === null || offset < total);

            if(allVariables.length > 0){
                commit('variables',{
                    'variables':allVariables,
                    'fid':options.fid
                });
            }
            
            return allVariables;
        },
        async loadExternalResources({commit}, options) {
            let url=CI.base_url + '/api/resources/'+options.dataset_id;
            return axios
            .get(url)
            .then(function (response) {
                if(response.data.resources){
                    commit('external_resources',response.data.resources);
                }
            })
            .catch(function (error) {
                console.log("external resource loading error",error);
            });
        },
        async loadAdminMetadataTemplates({commit}, options){
            window.store.dispatch('loadMetadataTypesList');
        },
        async loadMetadataTypesList({commit},options) {
            let url=CI.base_url + '/api/admin-metadata/templates_by_project/'+window.store.state.project_id;
            return axios
            .get(url)
            .then(function (response) {
                commit('setMetadataTypes', response.data.result);
            })
            .catch(function (error) {
                console.log('loadMetadataTypesList error:', error);
            });
        },
        async loadVariableGroups({commit},options) {
            let url=CI.base_url + '/api/variable_groups/'+options.dataset_id + "?variable_groups";
            return axios
            .get(url)
            .then(function (response) {                        
                if(response.data.variable_groups){                            
                    window.store.state.variable_groups=response.data.variable_groups;
                }
            })
            .catch(function (error) {
                console.log("error loading variable groups", error);
            });                    
        },
        async importDataFileSummaryStatistics({commit,getters}, options)
        {
            let url=CI.base_url + '/api/data/generate_summary_stats/'+getters.getProjectID + '/' + options.file_id;                    
            let resp = await axios.get(url);
            return resp;
        },
        async importDataFileSummaryStatisticsQueue({commit,getters}, options)
        {
            let url=CI.base_url + '/api/data/generate_summary_stats_queue/'+getters.getProjectID + '/' + options.file_id;                    
            let resp = await axios.get(url);
            return resp;
        },
        async importDataFileSummaryStatisticsQueueStatusCheck({commit,getters}, options)
        {
            let url=CI.base_url + '/api/data/summary_stats_queue_status/'+getters.getProjectID + '/' + options.file_id + '/' +  options.job_id;
            let resp = await axios.get(url);
            return resp;
        },                 
        async importVariableSummaryStatistics({commit,getters}, options)
        {
            let formData = {
                "var_names": options.var_names,
                "weights": options.weights
            }

            let url=CI.base_url + '/api/data/generate_summary_stats_variable/'+getters.getProjectID + '/' + options.file_id;
            let resp = await axios.post(url,formData);
            return resp;                
        },
        async generateCsvQueue({commit,getters}, options)
        {
            let url=CI.base_url + '/api/data/generate_csv_queue/'+getters.getProjectID + '/' + options.file_id;
            let resp = await axios.get(url);
            return resp;                
        },
        async generateCsvQueueStatusCheck({commit,getters}, options)
        {
            let url=CI.base_url + '/api/data/generate_csv_job_status/'+getters.getProjectID + '/' + options.file_id + '/' +  options.job_id;
            let resp = await axios.get(url);
            return resp;                
        },
        async validateExport({commit,getters}, options)
        {
            let url=CI.base_url + '/api/data/validate_export/'+getters.getProjectID + '/' + options.file_id;
            let params = {
                "format": options.format,
                "show_all_errors": options.show_all_errors || false
            }

            let resp = await axios.get(url, {params: params});
            return resp;                
        },
        async exportDatafileQueue({commit,getters}, options)
        {
            let url=CI.base_url + '/api/data/export_datafile_queue/'+getters.getProjectID + '/' + options.file_id;
            let formData = {
                "format": options.format
            };
            if (options.export_options != null && typeof options.export_options === 'object') {
                formData.export_options = options.export_options;
            }

            let resp = await axios.post(url,formData);
            return resp;                
        },
        async getJobStatus({commit,getters}, options)
        {
            let url=CI.base_url + '/api/data/job_status/'+ options.job_id;
            let resp = await axios.get(url);
            return resp;                
        },
        async cleanUpData({commit,getters}, options)
        {
            let url=CI.base_url + '/api/datafiles/cleanup/'+getters.getProjectID;
            let resp = await axios.post(url);
            return resp;                
        },
        async createBatchExportZip({commit,getters}, options)
        {
            let url=CI.base_url + '/api/datafiles/batch_export_zip/'+getters.getProjectID;
            let body = { filenames: options.filenames || [] };
            if (options.zip_filename) body.zip_filename = options.zip_filename;
            let resp = await axios.post(url, body);
            return resp;
        },
    },
    mutations: VueDeepSet.extendMutation({
        // other mutations
        data_model (state,data) {
            console.log("value added");
        },
        tree_active_node(state,node){//tobe removed
            alert("toberemoved");
        },
        tree_active_node_path(state,node_key){
            state.treeActiveNode=window.store.getters.getTemplateItemByKey(node_key);
        },
        tree_active_node_data(state,node){
            console.log("active node",node);
            state.treeActiveNode=node;
        },

        external_resources(state,data){
            state.external_resources=data;
        },
        external_resources_add(state,newResource){
            let new_idx=state.external_resources.push(newResource)-1;
            return new_idx;
        },
        data_files(state,data){
            state.data_files=data;                    
        },
        data_files_add(state,newFile){
            let new_idx=state.data_files.push(newFile)-1;
            return new_idx;
        },
        setGeospatialFeatures(state,data){
            state.geospatial_features=data;                    
        },
        setMetadataTypes(state,data){
            state.metadata_types=data;
        },
        variables(state,data){
            Vue.set(state.variables, data.fid, data.variables);
        },
        variable_add(state,data){
            if (state.variables[data.fid]==undefined){
                Vue.set(state.variables,data.fid,[]);
                Vue.set(state.variables[data.fid],data.fid,{});
            }

            let new_idx=state.variables[data.fid].push(data.variable)-1;
        },
        variable_remove(state,data){
            if (state.variables[data.fid]==undefined){
                return;
            }
            state.variables[data.fid].splice(data.idx, 1);
        },
        variables_active_tab(state,data){
            state.variables_active_tab=data;
        }
    })            
});

// Make store available without window prefix for component compatibility
var store = window.store;

// ============================================================
// 6. VeeValidate Rules
// ============================================================
// Note: isUniqueIDNO is defined in the PHP view (contains PHP interpolation)
// and is available as a global when this bundle runs.

VeeValidate.extend('idno', {
    validate: isUniqueIDNO,
    getMessage: (field, params, data) => {
        return data.message;
    },
    message: 'Please enter a unique value.'
});

VeeValidate.extend('is_uri', {
    validate(value){
        
        try { 
            return Boolean(new URL(value)); 
        }
        catch(e){ 
            return false; 
        }
    },
    getMessage: (field, params, data) => {
        return data.message;
    },
    message: 'Value must be a URL e.g. http://example.com'
});

//ignore validation if a required field is empty ('',null or undefined)
VeeValidate.extend('required', {
    validate (value) {
        return {
            required: true,
            valid: ['', null, undefined].indexOf(value) === -1
        };        
    },
    computesRequired: true
});

// Data type validation: checks for type mismatch (e.g., array/object where string expected)
VeeValidate.extend('data_type', {
    validate(value, [fieldType]) {

        // fieldType comes from field.type passed as parameter
        
        // Skip data_type validation for dropdown fields - they have their own validation through enum selection
        // and the v-model may be an enum object for display purposes
        if (fieldType === 'dropdown' || fieldType === 'dropdown-custom') {
            return true;
        }
        
        // Map field types to expected types
        const typeMap = {
            'text': 'string',
            'string': 'string',
            'textarea': 'string',
            'number': 'number',
            'integer': 'number',
            'array': 'array'
        };
        
        const expectedType = typeMap[fieldType];
        
        // Skip validation for unsupported types
        if (!expectedType) {
            return true;
        }
        
        // Skip if empty - let 'required' rule handle empty values
        if (value === null || value === undefined || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
            return true;
        }
        
        // Determine actual type of the value
        const actualType = Array.isArray(value) ? 'array' : 
                         (typeof value === 'object' && value !== null) ? 'object' : 
                         typeof value;
        
        let isValid = false;
        let typeMismatch = false;
        
        if (expectedType === 'array') {
            // For array type, value must be an array
            isValid = Array.isArray(value);
            typeMismatch = !isValid && (actualType === 'object' || actualType === 'string');
        } else if (expectedType === 'string') {
            // For string type, value must be a string (not array or object)
            isValid = actualType === 'string';
            typeMismatch = !isValid && (actualType === 'array' || actualType === 'object');
        } else if (expectedType === 'number') {
            // For number type, value must be a number
            isValid = actualType === 'number';
            typeMismatch = !isValid;
        }
        
        if (typeMismatch) {
            // Construct error message with expected and actual types
            const errorMessage = `Expected ${expectedType}, found ${actualType}. To fix, delete the field value and then type/select a new value.`;
            
            // Return error message via params
            return {
                valid: false,
                data: {
                    message: errorMessage
                }
            };
        }
        
        return isValid;
    },
    getMessage: (field, params, data) => {
        // data.message contains the error message from validate function
        return data && data.message ? data.message : 'Invalid value. To fix, delete the field value and then type/select a new value';
    },
    message: 'Invalid value. To fix, delete the field value and then type/select a new value'
});

// ============================================================
// 7. Component Registration (VeeValidate, Splitpanes, VueJsonPretty)
// ============================================================

Vue.component('ValidationProvider', VeeValidate.ValidationProvider);
Vue.component('ValidationObserver', VeeValidate.ValidationObserver);

const { Splitpanes, Pane } = splitpanes;
Vue.component("pane", Pane);
Vue.component("splitpanes", Splitpanes);

// ============================================================
// 8. Vue Filters, Vuetify, GlobalLoginPlugin
// ============================================================

Vue.filter('truncate', function (text, stop, clamp) {
    return text.slice(0, stop) + (stop < text.length ? clamp || '...' : '')
});

Vue.filter('kb', val => {
  return Math.floor(val/1024);  
});

Vue.filter('mb', val => {
  return (val / (1024*1024)).toFixed(2);
});

Vue.filter('kbmb', val => {
  if (val<1024*1024){
    return Math.floor(val/1024) + ' KB';  
  }

  return (val / (1024*1024)).toFixed(2) + ' MB';
});

const vuetify = new Vuetify({
        theme: {
        themes: {
            light: {
                primary: '#526bc7',
                "primary-dark": '#0c1a4d',
                secondary: '#b0bec5',
                accent: '#8c9eff',
                error: '#b71c1c',
                success: '#4caf50',
                info: '#2196f3',
                warning: '#ff9800',
            },
        },
        },
    });

// Use GlobalLoginPlugin for session handling
if (typeof GlobalLoginPlugin !== 'undefined') {
    Vue.use(GlobalLoginPlugin);
}

// ============================================================
// 9. Vue App Creation
// ============================================================
// Note: i18n is created in the PHP view (depends on PHP-templated translations)
// and is available as a global when this bundle runs.

window.vue_app=new Vue({
  el: '#app',
  i18n,
  vuetify: vuetify,
  router:router,
  store,
  data:{          
      active_section:null,
      active_form_field:null,
      schema_validator: null,
      dataset_id:sid,
      dataset_idno:project_idno,
      dataset_type:project_type,
      is_loading:false,
      is_dirty:false,//form data has been modified
      vuex_is_loaded:false,
      loading_status:null,
      form_errors:[],
      schema_errors:[],
      initiallyOpen: [],
      toggleTreeExpand: false,
      files: {
        html: 'mdi-language-html5',
        js: 'mdi-nodejs',
        json: 'mdi-code-json',
        md: 'mdi-language-markdown',
        pdf: 'mdi-file-pdf',
        png: 'mdi-file-image',
        txt: 'mdi-file-document-outline',
        xls: 'mdi-file-excel',
        folder:'mdi-folder-multiple',
        file:'mdi-file-document-outline',
        database:'mdi-folder-table',
        table:'mdi-table',
        datafile:'mdi-database',
        variable:'mdi-file-table-outline',
        resource: 'mdi-folder-text',
        'file-manager':'mdi-folder-network',
        chart: 'mdi-chart-box'
      },
    tree: [],
    items: [],
    tree_active_items:[],
    tree_search:'',
    login_dialog:false,
    export_json_dialog:false,
    base_url:CI.base_url,
    show_fields_mandatory:false,
    show_fields_recommended:false,
    show_fields_empty:false,
    show_fields_nonempty:false,
    show_fields_validation_errors:false,
    // schema core field mappings and icon loaded from API
    schema_core_fields: { idno:[], title:[] },
    schema_icon: null,

    apply_defaults_dialog:false,
    apply_defaults_dialog_key:0
  },
  created: async function(){
    await this.$store.dispatch('initData',{dataset_id:this.dataset_id});
    await this.$store.dispatch('initTreeItems');
    this.init_tree_data();

    let vm=this;

    window.addEventListener('beforeunload', function(event) {
      return vm.onWindowUnload(event);
    });
  }
  ,
  mounted: function(){
    let vm=this;
    // load core field mappings for current schema
    this.loadSchemaCoreMappings();
    axios.interceptors.response.use(
      function(resp) {            
        return resp;
      },
      function(error) {
        if (error.response.status==401){
          vm.login_dialog=true;
        }
        return Promise.reject(error);
      }
    );
  },
  computed:{
    ProjectIsLoading(){
      return this.$store.state.project_isloading;
    },
    hideProjectSaveOnRoute(){
      return this.$route.path.startsWith("/datafile/") 
        || this.$route.path.startsWith("/external-resources/") ;
    },
    form_template(){
      return this.$store.state.formTemplate;
    },
    projectTemplateUID(){
        return this.$store.state.formTemplate.uid;
    },
    UserHasEditAccess(){
      return this.$store.state.user_has_edit_access && !this.$store.state.project_is_locked;
    },
    ProjectIsLocked(){
      return this.$store.state.project_is_locked;
    },
    ProjectVersionInfo(){
      return this.$store.state.project_version_info;
    },
    Title(){          
      const paths = this.schema_core_fields.title || [];
      if (Array.isArray(paths) && paths.length > 0){
        for (let path of paths) {
          if (path && typeof path === 'string') {
            const dotPath = path.startsWith('/') ? path.substring(1).replace(/\//g, '.') : path;
            const value = _.get(this.ProjectMetadata, dotPath);
            if (value !== null && value !== undefined && value !== '') {
              return value;
            }
          }
        }
      }
      return (this.$store.state.project_info && this.$store.state.project_info.title) || this.$te && this.$te('untitled') ? this.$t('untitled') : 'Untitled';

    },
    StudyIDNO(){          
      const paths = this.schema_core_fields.idno || [];
      if (Array.isArray(paths) && paths.length > 0){
        for (let path of paths) {
          if (path && typeof path === 'string') {
            const dotPath = path.startsWith('/') ? path.substring(1).replace(/\//g, '.') : path;
            const value = _.get(this.ProjectMetadata, dotPath);
            if (value !== null && value !== undefined && value !== '') {
              return value;
            }
          }
        }
      }
      return (this.$store.state.project_info && this.$store.state.project_info.idno) || '';
    },
    ProjectMetadata(){
      return this.$store.state.formData;
    },
    ExternalResources()
    {
      return this.$store.state.external_resources;
    },
    DataFiles(){
      return this.$store.state.data_files;
    },
    IndicatorDataFile(){
      // Get the single datafile for indicator project (file_id: INDICATOR_DATA)
      const dataFiles = this.$store.state.data_files;
      if (!dataFiles || dataFiles.length === 0) {
        return null;
      }
      // Try to find by fixed file_id first
      const file = dataFiles.find(f => f.file_id === 'INDICATOR_DATA');
      if (file) {
        return file;
      }
      // Fallback: return first file (for migration)
      return dataFiles.length > 0 ? dataFiles[0] : null;
    },
    MetadataTypes(){
      return this.$store.state.metadata_types;
    },
    MetadataTypesTreeNodes(){
      
      let metadata_types=this.MetadataTypes;
      if (metadata_types.length==0){
        return [];
      }

      let metadata_types_nodes=[];

      var i=0;
      for (let metadata_type of metadata_types) {
        if (!metadata_type.is_active){
          continue;
        }
        metadata_types_nodes.push(
          {
            title: metadata_type.name,
            type:'metadata-type',
            index:metadata_type.id,
            file: 'file',
            key:'metadata-types/'+metadata_type.id,
            metadata_type:  metadata_type
          }
        );
        i++;
      }
      return metadata_types_nodes;
    },
    DataFilesTreeNodes(){
      if (this.DataFiles.length==0){
        return [];
      }

      let datafiles_nodes=[];

      var i=0;
      for (let file of this.DataFiles) {
        datafiles_nodes.push(
          {
            title: file.file_name,
            type:'datafile',
            index:i,
            key:'datafile/'+file.file_id,
            file: 'datafile',
            datafile:  file,
            items:[{
                title:this.$t('variables'),
                type: 'variables',
                file: 'variable',
                datafile: file,
                key:'variables/'+file.file_id
            },
            {
                title:this.$t('data'),
                type: 'variable_data',
                file: 'table',
                datafile: file,
                key:'d'+i
            }]
          }
        );
        i++;
      }
      console.log("data file nodes:",datafiles_nodes);
      return datafiles_nodes;
    },
    VariableGroupsTreeNodes(){
      return [];          
    },
    ExternalResourcesTreeNodes(){
      let resources=this.$store.state.external_resources;
      if (resources.length==0){
        return [];
      }

      let resources_nodes=[];

      var i=0;
      for (let resource of resources) {
        resources_nodes.push(
          {
            title: resource.title,
            type:'resource',
            index:resource.id,
            file: 'file',
            key:'resource-'+resource.id,
            resource:  resource
          }
        );
        i++;
      }
      console.log("resources nodes:",resources_nodes);
      return resources_nodes;
    },
    TreeItems:
    {
        get(){
            return this.$store.state.treeItems;
        },
        set(val){
          return this.$store.state.treeItems=val;
        }
    },
    Items:function(){
      
      if (!this.tree_search || this.tree_search.length<1){
        return this.items; 
      }
        
      //keyword search
      let search_keywords=this.tree_search.toLowerCase().split(" ");
      let recursive_keyword_search=function(items){
        let filtered_items=[];
        for (let item of items){
            // Always include the home node in search results
            if (item.type === 'home') {
              filtered_items.push(item);
              continue;
            }
            
            if (item.items){
              let children=recursive_keyword_search(item.items);
              if (children.length>0){
                item.items=children;
                filtered_items.push(item);
              }
            }else{
              
              let item_title=item.title.toLowerCase();
              let item_key=item.key.toLowerCase();
              let item_help_text='';

              if (item.help_text){
                item_help_text=item.help_text.toLowerCase();
              }
              
              let found=false;
              for (let keyword of search_keywords){
                if (item_title.includes(keyword) 
                    || item_key.includes(keyword) 
                    || item_help_text.includes(keyword) 
                  ){
                  found=true;                        
                }else{
                  found=false;
                  break;
                }
              }

              if (found){
                filtered_items.push(item);
              }

            }
        }
        return filtered_items;
      }

      return recursive_keyword_search(JSON.parse(JSON.stringify(this.items)));
    },
    GeospatialFeatures(){
      if (this.dataset_type!='geospatial'){
        return [];
      }

      let features = this.$store.state.geospatial_features;
      let feature_list=[];

      // Create features array for the features parent node
      let features_array = [];
      if (features && features.length > 0){
        for (let feature of features){
          features_array.push({
            title: feature.name || feature.file_name || 'Unnamed Feature',
            type:'geospatial-feature',
            key:'feature-catalogue/features/'+feature.id,
            file:'datafile',
            feature:feature,
            items:[{
                  title:this.$t('characteristics'),
                  type: 'geospatial-feature-characteristics',
                  file: 'variable',                    
                  key:'feature-catalogue/features/'+feature.id+'/characteristics',
                  feature:feature,
              }]
          });
        }
      }

      feature_list.push({
        title: this.$t('features'),
        type:'geospatial-features-list',
        key:'feature-catalogue/features',
        file:'database',
        items: features_array
      });

      return feature_list;
    }
  },      
  watch: {
    '$store.state.formTemplate': function() {
        this.init_tree_data();
    },
    '$store.state.data_files': function() {
        this.update_tree();
    },
    '$store.state.external_resources': function() {
        this.update_tree();
    },
    '$store.state.geospatial_features': function() {
        this.update_tree();
    },
    '$store.state.metadata_types': function(newVal, oldVal) {
        this.init_tree_data();
    },
    $route(to, from) {
      this.setTreeActiveNode(to.path);
    },
    ProjectMetadata: 
    {
        deep:true,
        handler(val, oldVal){
          

          if (JSON.stringify(oldVal) == '{}') {
            this.is_dirty=false;
            return;
          }
          
            this.is_dirty=true;
        }
    }
  },
  methods:{
    loadSchemaCoreMappings: function(){
      if (!this.dataset_type){
        this.schema_core_fields = { idno:[], title:[] };
        this.schema_icon = null;
        return;
      }
      const url = CI.site_url.replace(/\/?$/, '/') + 'api/schemas/detail/' + encodeURIComponent(this.dataset_type);
      axios.get(url)
        .then((resp)=>{
          const schema = resp.data && resp.data.schema ? resp.data.schema : null;
          const options = schema && schema.metadata_options ? schema.metadata_options : {};
          const core = options.core_fields || {};
          // Support both string and array formats - normalize to arrays
          const normalizeField = (field) => {
            if (!field) return [];
            if (Array.isArray(field)) {
              // Filter out empty strings and return array
              return field.filter(p => p && p.trim() !== '');
            }
            // Convert string to array
            if (typeof field === 'string' && field.trim() !== '') {
              return [field];
            }
            return [];
          };
          this.schema_core_fields = {
            idno: normalizeField(core.idno || ''),
            title: normalizeField(core.title || '')
          };
          this.schema_icon = (schema && (schema.icon_full_url || schema.icon_url)) ? (schema.icon_full_url || schema.icon_url) : null;
        })
        .catch(()=>{
          this.schema_core_fields = { idno:[], title:[] };
          this.schema_icon = null;
        });
    },
    templateApplyDefaults: function(){
        this.apply_defaults_dialog_key+=1;
        this.apply_defaults_dialog=true;
    },
    onLinkClick: function(link){
        window.open(link, '_blank');
    },
    onRouterLinkClick: function(link){
        router.push(link);
    },
    onWindowUnload: function(event){

      if (this.UserHasEditAccess==false){
        return null;
      }

      if (!this.is_dirty){
        return null;
      }

      let message=this.$t('unsaved_changes');

      event.returnValue = message;
      return message;
    },
    getNodeKeyFromPath: function(path)
    {
      path=path.substr(0,1)=="/" ? path.substr(1,path.length) : path;
      let path_arr=path.split("/");

      if (path_arr.length>1 && path_arr[0]=='study'){
        return path_arr[1];
      }else{
        return '';
      }          
    },
    getTreeNestedPath: function(arr,name)
    {
        let vm=this;
        for(let item of arr){
            if(item.key===name) return `/${name}`;
            if(item.items) {
                const child = vm.getTreeNestedPath(item.items, name);
                if(child) return `/${item.key}${child}`
            }
        }
    },
    setTreeActiveNode: function(path)
    {
      console.log("setTreeActiveNode called with path:", path);
      this.tree_active_items=[];
      this.tree_active_items.push(path);
      let path_arr=path.split("/");

      //expand datafile
      if(path.startsWith("/datafile/")){
        this.initiallyOpen.push("datafiles");
        this.initiallyOpen.push("datafile/"+path_arr[2]);
      }
      else if(path.startsWith("/variables/")){
        this.initiallyOpen.push("datafiles");
        this.initiallyOpen.push("datafile/"+path_arr[2]);
      }
      else if(path.startsWith("/data-explorer/")){
        this.initiallyOpen.push("datafiles");
        this.initiallyOpen.push("datafile/"+path_arr[2]);
      }
      
      // Handle geospatial features
      if (path.startsWith("/geospatial-features")) {
        console.log("Handling geospatial features route:", path);
        
        // Always expand the feature-catalogue parent node
        if (!this.initiallyOpen.includes("feature-catalogue")) {
          this.initiallyOpen.push("feature-catalogue");
        }
        
        // Handle description route
        if (path.includes("/description")) {
          console.log("Setting active node to: feature-catalogue/description");
          this.tree_active_items = ["feature-catalogue/description"];
        }
        // Handle different geospatial feature routes
        else if (path.includes("/edit/") || path.includes("/characteristics") || path.includes("/data")) {
          // Extract feature ID from path
          const pathParts = path.split("/");
          let featureId = pathParts[pathParts.length - 1];
          
          // For characteristics route, the ID is in the path before /characteristics
          if (path.includes("/characteristics")) {
            featureId = pathParts[pathParts.length - 2];
          }
          
          const featureNodeKey = "feature-catalogue/features/" + featureId;
          
          console.log("Setting active node to:", featureNodeKey);
          
          // Expand the features parent node
          if (!this.initiallyOpen.includes("feature-catalogue/features")) {
            this.initiallyOpen.push("feature-catalogue/features");
          }
          
          // Expand the specific feature node to show its children
          if (!this.initiallyOpen.includes(featureNodeKey)) {
            this.initiallyOpen.push(featureNodeKey);
          }
          
          // For characteristics route, set active to the characteristics node
          if (path.includes("/characteristics")) {
            this.tree_active_items = [featureNodeKey + "/characteristics"];
          } else {
            // Set active node to the specific feature
            this.tree_active_items = [featureNodeKey];
          }
        } else {
          console.log("Setting active node to: feature-catalogue");
          // Just the main feature catalogue page
          this.tree_active_items = ["feature-catalogue"];
        }
        console.log("Final tree_active_items:", this.tree_active_items);
        console.log("Final initiallyOpen:", this.initiallyOpen);
        return;
      }

      if (path==""){
        this.tree_active_items.push("home");
      }else{
        this.initiallyOpen.push(path);
      }          
    },
    filter_tree_items: function(items)
    {
      if (items.items){
        items=this.filter_tree_items(items);
      }

      return items.filter(item => item.is_custom!==true);
    },
    filter_empty_items: function(items)
    {
      if (items.items){
        items=this.filter_empty_items(items);
      }

      return items.filter(item => item.type=='section' || item.key=='doc_description');
    },
    filterRecursiveSearch: function(items,filter_type='')
    {
      let vm=this;
      let filtered_items=[];
      for (let item of items){

        if (item.items){              
            let filtered_children=vm.filterRecursiveSearch(item.items,filter_type);

            if (item.is_custom){
              continue;              
            }

            if (filtered_children.length>0){
              item.items=filtered_children;
              filtered_items.push(item);
            }
        }else{
            if(!item.is_custom){
                //show mandatory fields only
                if (filter_type=='mandatory' && this.show_fields_mandatory==true && item.is_required){
                  filtered_items.push(item);
                }

                //show recommended fields only [recommended + mandatory]
                else if (filter_type=='recommended' && this.show_fields_recommended==true && (item.is_recommended || item.is_required)){
                  filtered_items.push(item);
                }

                //show empty fields only
                else if (filter_type=='empty' && this.show_fields_empty==true){
                  let field_value=this.getFieldValueByPath(item.key);
                  if (_.isEmpty(field_value)){
                    filtered_items.push(item);
                  }
                }
                else if (filter_type=='nonempty' && this.show_fields_nonempty==true){
                  let field_value=this.getFieldValueByPath(item.key);
                  if (field_value){
                    filtered_items.push(item);
                  }
                }

                else if (filter_type==''){
                  filtered_items.push(item);
                }
            }
        }
      }

      return filtered_items;
    },
    getFieldValueByPath: function(path)
    {
      return _.get(this.ProjectMetadata,path);
    },
    toggleTree: function()
    {
      this.toggleTreeExpand=!this.toggleTreeExpand;
      if (!this.toggleTreeExpand){
        this.initiallyOpen=[];
      }else{
        for(let item of this.items){
          this.initiallyOpen.push(item.key);
        }
      }
    },        
    toggleFields: function(field_type)
    {
      if (field_type=='mandatory'){
        this.show_fields_mandatory=!this.show_fields_mandatory;
      }
      if (field_type=='recommended'){
        this.show_fields_recommended=!this.show_fields_recommended;
      }
      if (field_type=='empty'){
        this.show_fields_empty=!this.show_fields_empty;
        this.show_fields_nonempty=false;
      }
      if (field_type=='nonempty'){
        this.show_fields_nonempty=!this.show_fields_nonempty;
        this.show_fields_empty=false;
      }
      this.init_tree_data();
      router.push('/');
    },
    cloneObject: function(obj)
    {
      return JSON.parse(JSON.stringify(obj));
    },
    //function to move item to the end of the array
    move_item_to_end: function(arr, item_key) {          
      let _index=_.findIndex(arr, {key: item_key});

      if (_index>=0){
        let _item=arr[_index];
        arr.splice(_index,1);
        arr.push(_item);
      }
    },
    init_tree_data: function() {
      this.items=[];
      let tree_data=this.filterRecursiveSearch(this.cloneObject(this.form_template.template.items),'');

      if (this.show_fields_recommended){
        tree_data=this.filterRecursiveSearch(tree_data,'recommended');
      }
      if (this.show_fields_mandatory && this.show_fields_recommended==false){
        tree_data=this.filterRecursiveSearch(tree_data,'mandatory');
      }
      
      if (this.show_fields_empty){
        tree_data=this.filterRecursiveSearch(tree_data,'empty');
      }
      if (this.show_fields_nonempty){
        tree_data=this.filterRecursiveSearch(tree_data,'nonempty');
      }

      tree_data.unshift({
          title: this.$t('home'),
          type:'home',
          file: 'database',
          key: 'home',
          "items":[
            {
            title: 'Preview',
            type:'preview',
            file: 'txt',
            key: 'page-preview'
            }
          ]
        });

      if (this.dataset_type=='survey' || this.dataset_type=='microdata'){
        tree_data.push({
          title: this.$t('data-files'),
          type:'datafiles',
          file: 'database',
          key: 'datafiles',
          items:this.DataFilesTreeNodes
        });

        tree_data.push({
          title: this.$t('variable-groups'),
          type:'variable-groups',
          file: 'database',
          key: 'variable-groups',
          items:this.VariableGroupsTreeNodes
        });
      }

      if (this.dataset_type=='geospatial'){
        tree_data.push({
          title: this.$t('feature_catalogue'),
          type: 'geospatial-features',
          file: 'database',
          key:'feature-catalogue',
          items:this.GeospatialFeatures
        });

        tree_data.push({
          title: this.$t('image_gallery'),
          type: 'geospatial-gallery',
          file: 'database',
          key:'geospatial-gallery'
        });

      }

      if (this.dataset_type=='indicator' || this.dataset_type=='timeseries'){
        tree_data.push({
          title: this.$t('data_structure_definition'),
          type: 'indicator-dsd-container',
          file: 'database',
          key:'indicator-dsd-container',
          items:(() => {
            const items = [
              {
                title: this.$t('data_structure_definition'),
                type: 'indicator-dsd',
                file: 'database',
                key:'indicator-dsd'
              }
            ];
            if (typeof dsd_temporary_features_enabled !== 'undefined' && dsd_temporary_features_enabled) {
              items.push({
                title: this.$t('data_preview'),
                type: 'data-preview',
                file: 'txt',
                key:'data-preview',
                datafile: this.IndicatorDataFile
              });
              items.push({
                title: this.$t('chart_visualization'),
                type: 'indicator-dsd-chart',
                file: 'chart',
                key:'indicator-dsd-chart'
              });
            }
            return items;
          })()
        });
      }
      
      tree_data.push({
          title: this.$t('external-resources'),
          type: 'resources',
          file: 'resource',
          key:'external-resources',
          items:this.ExternalResourcesTreeNodes
      });

      //move tags after datafiles
      this.move_item_to_end(tree_data, 'tags_container');

      //move dataCite at the end
      this.move_item_to_end(tree_data, 'datacite_container');

      //move provenance at the end
      this.move_item_to_end(tree_data, 'provenance_container');

      if (this.MetadataTypesTreeNodes.length>0){
        //metadata types
        tree_data.push({
            title: this.$t('Administrative metadata'),
            type: 'metadata-types',
            file: 'database',
            key:'metadata-types',
            items:this.MetadataTypesTreeNodes
        });
    }          

      this.items=tree_data;
      if (this.$route.path.startsWith("/datafile/")){
        this.setTreeActiveNode(this.$route.path);
      }
      else if (this.$route.path.startsWith("/variables/")){
        this.setTreeActiveNode(this.$route.path);
      }
      else if (this.$route.path.startsWith("/data-explorer/")){
        // For indicators, set active node to data-preview
        if (this.dataset_type=='indicator' || this.dataset_type=='timeseries'){
          this.initiallyOpen.push("indicator-dsd-container");
          this.setTreeActiveNode("data-preview");
        } else {
          this.setTreeActiveNode(this.$route.path);
        }
      }
      else if (this.$route.path.startsWith("/external-resources")){
        this.initiallyOpen=["external-resources"];
        this.setTreeActiveNode("external-resources");
      }
      else if (this.$route.path.startsWith("/geospatial-features")){
        // Handle geospatial features initialization on page load
        this.setTreeActiveNode(this.$route.path);
      }
      else if (this.$route.path.startsWith("/indicator-dsd")){
        if (this.$route.path.startsWith("/indicator-dsd-chart")){
          this.setTreeActiveNode("indicator-dsd-chart");
        } else {
          this.setTreeActiveNode("indicator-dsd");
        }
      }
      else{
        let active_node_name=this.$route.path;
        active_node_name=active_node_name.slice(active_node_name.lastIndexOf("/")+1);

        if (active_node_name){
          let node_paths= this.getTreeNestedPath(this.items,active_node_name);
          
          if (node_paths){
            this.initiallyOpen=node_paths.split("/");
            this.setTreeActiveNode(active_node_name);
          }
        }
      }
      
    },
    update_tree: function()
    {
      if (this.items.length<1){
        return;
      }

      let metadataTypesNodeFound = false;

      var k=0;
      for(k=0;k<=this.items.length;k++){            
        
        if (!this.items[k]){
          continue;
        }

        if (this.items[k]["key"]=="datafiles"){
          this.items[k]["items"]=this.DataFilesTreeNodes
        }

        if (this.items[k]["key"]=="external-resources"){
          this.items[k]["items"]=this.ExternalResourcesTreeNodes;
        }

        if (this.items[k]["key"]=="feature-catalogue"){
          this.items[k]["items"]=this.GeospatialFeatures;
        }

        if (this.items[k]["key"]=="metadata-types"){
          metadataTypesNodeFound = true;
          this.items[k]["items"]=this.MetadataTypesTreeNodes;
        }

        if (this.items[k]["key"]==="indicator-dsd-container" && this.items[k]["items"]) {
          const sub = this.items[k]["items"];
          for (let j = 0; j < sub.length; j++) {
            if (sub[j] && sub[j].type === 'data-preview') {
              sub[j].datafile = this.IndicatorDataFile;
              break;
            }
          }
        }
        
      }
      // add admin metadata to tree
      if (!metadataTypesNodeFound && this.MetadataTypesTreeNodes.length > 0) {
        this.items.push({
          title: this.$t('Administrative metadata'),
          type: 'metadata-types',
          file: 'database',
          key:'metadata-types',
          items:this.MetadataTypesTreeNodes
        });
      }
    },        
    templateToTree: function (){
      window.template=this.form_template;
    },
    treeOnUpdate: function(node_key)
    {
    },
    treeClick: function (node){
      store.commit('tree_active_node_data',node);

      //expand tree node          
      this.initiallyOpen.push(node.key);

      if (node.type=='home'){
        router.push('/');
        return;
      }

      if (node.type=='datafile'){
        router.push('/datafile/'+node.datafile.file_id);
        return;
      }

      if (node.type=='datafiles'){
        router.push('/datafiles');
        return;
      }

      if (node.type=='variables'){
        router.push('/variables/'+ node.datafile.file_id);
        return;
      }

      if (node.type=='variable-groups'){
        router.push('/variable-groups');
        return;
      }

      if (node.type=='variable_data'){
        router.push('/data-explorer/'+ node.datafile.file_id);
        return;
      }
      

      if (node.type=='resources'){
        router.push('/external-resources');
        return;
      }

      if (node.type=='metadata-types'){
        router.push('/metadata-types');
        return;
      }

      if (node.type=='metadata-type'){
        router.push('/metadata-types/'+node.metadata_type.uid);
        return;
      }

      if (node.type=='files'){
        router.push('/files');
        return;
      }

      if (node.type=='geospatial-features'){
        // Feature catalogue node - show description preview
        router.push('/geospatial-features/description');
        return;
      }

      if (node.type=='geospatial-feature-description'){
        router.push('/geospatial-features/description');
        return;
      }

      if (node.type=='geospatial-features-list'){
        // Features parent node - show list of features
        router.push('/geospatial-features');
        return;
      }

      if (node.type=='geospatial-gallery'){
        router.push('/geospatial-gallery');
        return;
      }

      if (node.type=='indicator-dsd'){
        router.push('/indicator-dsd');
        return;
      }

      if (node.type=='indicator-dsd-chart'){
        router.push('/indicator-dsd-chart');
        return;
      }

      if (node.type=='data-preview'){            
        const fileId = (node.datafile && node.datafile.file_id) ? node.datafile.file_id : 'INDICATOR_DATA';
        router.push('/data-explorer/' + fileId);
        return;
      }

      if (node.type=='geospatial-feature'){
        router.push('/geospatial-features/'+node.feature.id);
        return;
      }

      if (node.type=='geospatial-feature-characteristics'){
        router.push('/geospatial-features/'+node.feature.id+'/characteristics');
        return;
      }

      if (node.type=='geospatial-feature-data'){
        router.push('/geospatial-features/'+node.feature.id+'/data');
        return;
      }

      if (node.type=='resource'){
        router.push('/external-resources/'+node.index);
        return;
      }

      if (node.type=='feature-attribute'){
        router.push('/geospatial-feature/'+node.feature.typeName);
        return;
      }

      if (node.type=='preview'){
        router.push('/page-preview/');
        return;
      }

      if (node.type=='geospatial-gallery'){
        router.push('/geospatial-gallery');
        return;
      }

      router.push('/study/'+node.key);
    },
    cancelProject: function(){
      if (this.is_dirty){
        if (!confirm(this.$t('Do you want to discard changes?'))){
          return;
        }
      }          
      this.$store.dispatch('initData',{dataset_id:this.dataset_id}).then(()=>{
        this.is_dirty=false;
      });          
    },
    saveProjectDebounce: _.debounce(function(data) {
        this.saveProject(data);
    }, 500),
    saveProject: function(){          
      var vm=this;
      let url=CI.base_url + '/api/editor/update/'+vm.dataset_type+'/' + vm.dataset_id;
      
      var form_data=JSON.parse(JSON.stringify(vm.ProjectMetadata));
      this.$refs.form.validateWithInfo().then(({ isValid, errors, $refs })=> {
          console.log("validation errors",errors);
          vm.form_errors=Object.values(errors).flat();
      });
              
      vm.removeEmpty(form_data);

      axios.post(url, 
          form_data
      )
      .then(function (response) {
          vm.schema_errors=[];
          vm.is_dirty=false;
      })
      .catch(function (error) {
          console.log("data-errors",error);
          vm.schema_errors=error.response.data.errors;

          let error_message='';
          if (error.response.data.message){
            error_message=error.response.data.message;
          }

          alert("Error saving project: " + error_message);
      });
  },
  removeEmpty: function (obj) {
      var vm=this;
      try {
        if (typeof(obj) == "string") { return; }

      $.each(obj, function(key, value){
          if (value === "" || value === null || ($.isArray(value) && value.length === 0) ){
              delete obj[key];
          } else if (JSON.stringify(value) == '[{}]' || JSON.stringify(value) == '[[]]'){
              delete obj[key];
          } else if (Object.prototype.toString.call(value) === '[object Object]') {
              vm.removeEmpty(value);
          } else if ($.isArray(value)) {
              $.each(value, function (k,v) { vm.removeEmpty(v); });
          }
      });
      }catch (error) {
        console.error(error);
      }
  }
}
});

Vue.component('VueJsonPretty', VueJsonPretty.default);
