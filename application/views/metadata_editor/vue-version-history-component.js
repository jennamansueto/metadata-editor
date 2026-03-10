/// Project version history component
Vue.component('version-history', {
    props: [],
    data() {
        return {
            is_loading: false,
            versions: [],
            error_message: ''
        }
    },
    mounted: function(){      
        this.loadVersions();
    },
    methods: {
        loadVersions: async function()
        {
            let vm = this;            
            vm.is_loading = true;
            vm.error_message = '';
            let url = CI.base_url + '/api/editor/versions/' + this.ProjectID;
            
            try {
                let resp = await axios.get(url);
                if (resp.data && resp.data.result && resp.data.result.versions) {
                    vm.versions = resp.data.result.versions;
                } else if (resp.data && resp.data.versions) {
                    vm.versions = resp.data.versions;
                }
            } catch(error) {
                console.log("Error loading versions", error);
                vm.error_message = 'Failed to load version history';
            }
            
            vm.is_loading = false;
        },
        momentDate(date) {
            if (!date) return '';
            // version_created may be ISO string or unix timestamp
            let m = moment(date);
            if (!m.isValid()) {
                m = moment.unix(date);
            }
            return m.isValid() ? m.format("YYYY-MM-DD HH:mm:ss") : '';
        },
        openVersion(version) {
            // Open the locked version in a new tab
            let url = CI.base_url + '/editor/' + version.id;
            window.open(url, '_blank');
        }
    },
    computed: {    
        ProjectID(){
            return this.$store.state.project_id;
        }
    },
    template: `
        <div class="vue-version-history-component m-3 mt-5">

            <div v-if="is_loading" class="text-center">
                <v-progress-circular
                    indeterminate
                    color="primary"
                ></v-progress-circular>
            </div>

            <div v-else>
                <div class="bg-light p-3 d-flex align-center">
                    <v-icon left>mdi-history</v-icon>
                    <strong>{{$t('version_history')}}</strong>
                </div>
            </div>

            <v-alert v-if="error_message" type="error" dense outlined class="mt-3">
                {{error_message}}
            </v-alert>

            <v-simple-table v-if="versions && versions.length > 0" class="mt-3">
                <template v-slot:default>
                    <thead>
                        <tr>
                            <th class="text-left" style="width:120px">{{$t('version_number')}}</th>
                            <th class="text-left" style="width:180px">{{$t('created_on')}}</th>
                            <th class="text-left" style="width:150px">{{$t('created_by')}}</th>
                            <th class="text-left">{{$t('version_notes')}}</th>
                            <th class="text-left" style="width:100px">{{$t('status')}}</th>
                            <th class="text-left" style="width:100px">{{$t('actions')}}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="version in versions" :key="version.id">
                            <td>
                                <v-chip small color="primary" text-color="white">
                                    v{{version.version_number}}
                                </v-chip>
                            </td>
                            <td>{{momentDate(version.version_created)}}</td>
                            <td>{{version.version_created_by_name || version.version_created_by_username || 'Unknown'}}</td>
                            <td>{{version.version_notes || '-'}}</td>
                            <td>
                                <v-chip small :color="version.is_locked == 1 ? 'deep-orange' : 'green'" text-color="white">
                                    <v-icon left small>{{version.is_locked == 1 ? 'mdi-lock' : 'mdi-lock-open'}}</v-icon>
                                    {{version.is_locked == 1 ? $t('locked') : $t('unlocked')}}
                                </v-chip>
                            </td>
                            <td>
                                <v-btn small text color="primary" @click="openVersion(version)" :title="$t('view_version')">
                                    <v-icon small>mdi-eye</v-icon>
                                    {{$t('view')}}
                                </v-btn>
                            </td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>

            <v-alert v-else-if="!is_loading" outlined color="grey" class="mt-3">
                <v-icon left>mdi-information-outline</v-icon>
                {{$t('no_versions_found')}}
            </v-alert>

        </div>
    `
});
