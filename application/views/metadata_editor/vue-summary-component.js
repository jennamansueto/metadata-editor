/// Project summary page
Vue.component('summary-component', {
    data () {
        return {
          validation_errors: "",
          dialog_template:false,
          template_idx:-1,
          template_updating:false,
          project_edit_stats:{},
          project_disk_usage:{},
          project_validation:[],
          dialog_admin_metadata:false,
          admin_metadata_templates:[],
          dialog_lock_version:false,
          lock_version_number:'',
          lock_version_notes:'',
          lock_is_submitting:false,
          lock_error_message:'',
        }
      },
    created: function(){      
        this.getProjectEditStats();
        this.getProjectDiskUsage();        
    },
    computed: {
        isProjectEditable(){
            return this.$store.getters.getUserHasEditAccess;
        },
        ProjectIsLocked(){
            return this.$store.state.project_is_locked;
        },
        ProjectID(){
            return this.$store.state.project_id;
        },
        ProjectIDNo(){
            return this.$store.state.idno;
        },
        ProjectTemplates()
        {
            return this.$store.state.templates;
        },
        ProjectTemplate()
        {
            return this.$store.state.formTemplate;
        },
        projectTemplateUID(){
            return this.$store.state.formTemplate.uid;
        },
        ProjectVersionInfo(){
            return this.$store.state.project_version_info;
        },
        projectTemplateSelectedIndex: {
            get: function () {
                if (this.template_idx>-1){
                    return this.template_idx;
                }

                let templates=this.ProjectTemplates;
                let idx=-1;
                for(let i=0;i<templates.length;i++){
                    if(templates[i].uid==this.projectTemplateUID){
                        idx=i;
                        break;
                    }
                }                
                return idx;
            },
            set: function (newValue) {
                this.template_idx = newValue;
            }
        },
        ProjectType(state){
            return this.$store.state.project_type;
        },
        ProjectMetadata(){
            return this.$store.state.formData;
        }        
    },
    methods:{        
        momentDate(date) {
            return moment.utc(date).local().format("YYYY-MM-DD HH:mm:ss");
          },
        getProjectEditStats: function() {
            let vm=this;
            let url=CI.base_url + '/api/editor/edit_stats/'+this.ProjectID;

            axios.get(url)
            .then(function (response) {
                if (response.data && response.data.info){
                    vm.project_edit_stats=response.data.info;
                }
            })
            .catch(function (error) {
                console.log("edit_stats_failed",error);
            });
        },
        getProjectDiskUsage: function() {
            let vm=this;
            let url=CI.base_url + '/api/files/size/'+this.ProjectID;

            axios.get(url)
            .then(function (response) {
                if (response.data && response.data.result){
                    vm.project_disk_usage=response.data.result;
                }
            })
            .catch(function (error) {
                console.log("disk_usage_stats_failed",error);
            });
        },
        UpdateTemplate: function(){ 
            this.template_updating=true;
            let vm=this;
            let form_data={
                "template_uid":this.ProjectTemplates[this.template_idx]["uid"]
            };

            store.dispatch('loadTemplateByUID',{template_uid:this.ProjectTemplates[this.template_idx]["uid"]}).then(function(){
                //store.dispatch('initTreeItems');
                let url=CI.base_url + '/api/editor/options/'+ vm.ProjectID;

                axios.post( url,
                    form_data,{}
                ).then(function(response){
                    console.log("template updated",response);
                    vm.dialog_template=false;
                    vm.template_updating=false;
                    return false;
                })
                .catch(function(response){
                    vm.errors=response;
                });

            });
        },
        openLockVersionDialog: function(){
            this.lock_version_number='';
            this.lock_version_notes='';
            this.lock_error_message='';
            this.dialog_lock_version=true;
        },
        submitLockVersion: async function(){
            let vm=this;
            if (!vm.lock_version_number || !vm.lock_version_number.trim()){
                vm.lock_error_message=vm.$t('version_number_required');
                return;
            }
            vm.lock_is_submitting=true;
            vm.lock_error_message='';
            let url=CI.base_url + '/api/editor/lock/' + vm.ProjectID;
            try {
                let resp = await axios.post(url, {
                    version_number: vm.lock_version_number.trim(),
                    version_notes: vm.lock_version_notes.trim()
                });
                if (resp.data && resp.data.status === 'success'){
                    vm.dialog_lock_version=false;
                    window.bus.$emit('onSuccess', vm.$t('version_created_successfully'));
                    // The draft project's version info stays unchanged;
                    // only the locked copy carries the version number.
                } else {
                    vm.lock_error_message=resp.data.message || vm.$t('version_creation_failed');
                }
            } catch(error) {
                if (error.response && error.response.data && error.response.data.message){
                    vm.lock_error_message=error.response.data.message;
                } else {
                    vm.lock_error_message=vm.$t('version_creation_failed');
                }
            }
            vm.lock_is_submitting=false;
        }
    },     
    template: `
            <div class="summary-component mt-3 container-fluid">

                <div class="row">
                    <div class="col-12">
                        <v-card>
                            <v-card-text>
                            <div class="row">
                            <div class="col-3" >
                                <div class="thumbnail-container">
                                    <project-thumbnail/>
                                </div>
                            </div>
                            <div class="col-9" >
                            
                            <!-- project info -->
                            <div class="project-info-container row">
                                <div class="col-6">

                                    <div class="mb-3">
                                        <strong>{{$t("Project owner")}}:</strong> 
                                        <div class="text-capitalize">{{project_edit_stats.username_cr}}</div>
                                    </div>

                                    <div class="mb-3">
                                        <strong>{{$t("Last changed by")}}:</strong>
                                        <div class="text-capitalize">{{project_edit_stats.username}}</div>
                                    </div>   
                                    
                                    <div class="mb-3">
                                        <strong>{{$t("Project IDNO")}}:</strong>
                                        <div class="text-capitalize">{{ProjectIDNo}}</div>
                                    </div>   
                                    

                                </div>
                                <div class="col-6">
                                
                                    <div class="mb-3">
                                        <strong>{{$t("Created on")}}:</strong>
                                        <div>{{momentDate(project_edit_stats.created)}}</div>
                                    </div>

                                    <div class="mb-3">
                                        <strong>{{$t("Changed on")}}:</strong>
                                        <div>{{momentDate(project_edit_stats.changed)}}</div>
                                    </div>

                                    <div class="mb-3">
                                        <strong>{{$t("version")}}:</strong>
                                        <div v-if="ProjectVersionInfo && ProjectVersionInfo.version_number">{{ProjectVersionInfo.version_number}}</div>
                                        <div v-else>{{$t('latest')}}</div>
                                    </div>
                                    
                                </div>

                            </div>

                            <!-- locked indicator -->
                            <div v-if="ProjectIsLocked" class="mb-3">
                                <v-chip color="red" text-color="white" small>
                                    <v-icon left small>mdi-lock</v-icon>
                                    {{$t('locked')}}
                                </v-chip>
                            </div>

                            <!-- lock & version button -->
                            <div v-if="isProjectEditable && !ProjectIsLocked" class="mb-3">
                                <v-btn
                                    color="primary"
                                    outlined
                                    small
                                    @click="openLockVersionDialog"
                                >
                                    <v-icon left small>mdi-lock-check</v-icon>
                                    {{$t('lock_and_version')}}
                                </v-btn>
                            </div>

                            <!-- end -->
                            

                            </div>
                            </div>
                                
                            </v-card-text>                     
                        </v-card>
                    </div>

                    <div class="col-6">
                        <div>                        
                            <summary-templates-component :key="Math.random()" ></summary-templates-component>
                        </div>

                        <div class="project-validation-container">                            
                            <template-validation-component></template-validation-component>                            
                        </div>
                    </div>

                    <div class="col-6" >

                        <div class="mb-5">
                            <!-- project sharing -->
                            <vue-summary-sharing-stats></vue-summary-sharing-stats>                            
                        </div>

                        <div class="mb-5">
                            <!-- project collections -->
                            <vue-summary-collections></vue-summary-collections>
                        </div>

                        <div class="mb-5">
                            <!-- project tags -->
                            <vue-project-tags></vue-project-tags>
                        </div>
                
                        <v-card>
                            <v-card-title class="d-flex justify-space-between">
                                <h6>{{$t("Data and Documentation")}}</h6>

                                <div v-if="project_disk_usage.size_formatted">
                                    <v-chip color="light" small style="font-size:small">{{$t("Disk usage")}}: {{project_disk_usage.size_formatted}}</v-chip>
                                </div>

                            </v-card-title>
                            <v-card-text>
                                <div class="files-container" v-if="ProjectType!=='timeseries-db'" style="max-height:400px;overflow:auto;">
                                <summary-files v-on:file-deleted="getProjectDiskUsage" ></summary-files>
                                </div>
                            </v-card-text>
                        </v-card>
                        
                    </div>

                </div>


                <div class="row" >
                    <div class="col-6" >
                        <!-- template dialog -->
                        <template class="project-template">
                            <div class="text-center">
                                <v-dialog
                                style="z-index:5000"
                                v-model="dialog_template"
                                max-width="700px"
                                scrollable
                                >
                                <v-card >
                                    <v-card-title class="text-h5 grey lighten-2">
                                    {{$t('Template')}}
                                    </v-card-title>

                                    <v-card-text style="max-height:400px;">
                                    <div>
                                    
                                            <!-- list -->
                                            <template>
                                               
                                                    <v-list two-line>
                                                    <v-list-item-group
                                                        v-model="projectTemplateSelectedIndex"
                                                        active-class="pink--text"                                                        
                                                    >
                                                        <template v-for="(item, index) in ProjectTemplates">
                                                        <v-list-item :key="item.uid">
                                                            <template v-slot:default="{ active }">
                                                            <v-list-item-content>
                                                                <v-list-item-title><strong>{{item.name}}</strong></v-list-item-title>
                                                                <v-list-item-subtitle>
                                                                    {{item.uid}}
                                                                    <span v-if="item.version">| Version: {{item.version}}</span>  
                                                                    <span v-if="item.lang">| Language: {{item.lang}}</span>
                                                                </v-list-item-subtitle>                                                                
                                                            </v-list-item-content>

                                                            <v-list-item-action>
                                                                <v-list-item-action-text v-text="item.action"></v-list-item-action-text>

                                                                <v-icon
                                                                v-if="!active"
                                                                color="grey lighten-1"
                                                                >
                                                                mdi-check-outline
                                                                </v-icon>

                                                                <v-icon
                                                                v-else
                                                                color="yellow darken-3"
                                                                >
                                                                mdi-check-bold
                                                                </v-icon>
                                                            </v-list-item-action>
                                                            </template>
                                                        </v-list-item>

                                                        <v-divider
                                                            v-if="index < ProjectTemplates.length - 1"
                                                            :key="index"
                                                        ></v-divider>
                                                        </template>
                                                    </v-list-item-group>
                                                    </v-list>
                                                
                                                </template>
                                            <!-- end list -->                                    
                                            
                                            
                                        </div>
                                    </v-card-text>

                                    <v-divider></v-divider>

                                    <v-card-actions>
                                    <v-spacer></v-spacer>
                                    <v-btn
                                        color="primary"
                                        text
                                        @click="dialog_template = false"
                                    >
                                        {{$t('close')}}
                                    </v-btn>
                                    <v-btn
                                        color="primary"
                                        text
                                        @click="UpdateTemplate"
                                        :disabled="template_idx==-1 || template_updating"
                                    >
                                        {{$t('apply')}}
                                    </v-btn>
                                    </v-card-actions>
                                </v-card>
                                </v-dialog>
                            </div>
                            </template>
                        <!-- end template dialog -->

                        <!-- lock & version dialog -->
                        <template>
                            <div class="text-center">
                                <v-dialog
                                style="z-index:5000"
                                v-model="dialog_lock_version"
                                max-width="550px"
                                >
                                <v-card>
                                    <v-card-title class="text-h5 grey lighten-2">
                                        <v-icon left>mdi-lock-check</v-icon>
                                        {{$t('lock_and_version')}}
                                    </v-card-title>
                                    <v-card-text class="pt-4">
                                        <p>{{$t('lock_version_description')}}</p>
                                        <v-alert v-if="lock_error_message" type="error" dense class="mb-3">{{lock_error_message}}</v-alert>
                                        <v-text-field
                                            v-model="lock_version_number"
                                            :label="$t('version_number')"
                                            placeholder="1.0.0"
                                            outlined
                                            dense
                                            required
                                        ></v-text-field>
                                        <v-textarea
                                            v-model="lock_version_notes"
                                            :label="$t('version_notes')"
                                            :placeholder="$t('version_notes_placeholder')"
                                            outlined
                                            dense
                                            rows="3"
                                        ></v-textarea>
                                    </v-card-text>
                                    <v-divider></v-divider>
                                    <v-card-actions>
                                        <v-spacer></v-spacer>
                                        <v-btn
                                            color="grey"
                                            text
                                            @click="dialog_lock_version = false"
                                            :disabled="lock_is_submitting"
                                        >
                                            {{$t('cancel')}}
                                        </v-btn>
                                        <v-btn
                                            color="primary"
                                            @click="submitLockVersion"
                                            :loading="lock_is_submitting"
                                            :disabled="!lock_version_number || lock_is_submitting"
                                        >
                                            <v-icon left>mdi-lock</v-icon>
                                            {{$t('lock_version_submit')}}
                                        </v-btn>
                                    </v-card-actions>
                                </v-card>
                                </v-dialog>
                            </div>
                        </template>
                        <!-- end lock & version dialog -->

                    </div>
                   
                </div>

            </div>          
            `    
});

