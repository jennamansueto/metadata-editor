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
    computed: {
        ProjectID(){
            return this.$store.state.project_id;
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
                vm.error_message = vm.$t('version_history_load_error');
            }
            
            vm.is_loading = false;
        },
        momentDate(date) {
            if (!date) return '';
            // version_created is stored as unix timestamp in seconds
            let numDate = typeof date === 'string' ? parseInt(date, 10) : date;
            if (!isNaN(numDate) && String(numDate) === String(date).trim()) {
                let m = moment.unix(numDate);
                return m.isValid() ? m.format("YYYY-MM-DD HH:mm:ss") : '';
            }
            // fallback for ISO date strings
            let m = moment(date);
            return m.isValid() ? m.format("YYYY-MM-DD HH:mm:ss") : '';
        },
        viewVersion(version_id) {
            window.location.href = CI.base_url + '/projects/edit/' + version_id;
        }
    },
    template: `
        <div class="version-history-component mt-3 container-fluid">
            <v-card>
                <v-card-title>
                    <v-icon left>mdi-history</v-icon>
                    {{$t('version_history')}}
                </v-card-title>
                <v-card-text>

                    <v-progress-linear v-if="is_loading" indeterminate color="primary"></v-progress-linear>
                    
                    <v-alert v-if="error_message" type="error" dense>{{error_message}}</v-alert>

                    <v-alert v-if="!is_loading && versions.length === 0" type="info" dense>
                        {{$t('no_versions_found')}}
                    </v-alert>

                    <v-simple-table v-if="versions.length > 0">
                        <template v-slot:default>
                            <thead>
                                <tr>
                                    <th>{{$t('version_number')}}</th>
                                    <th>{{$t('Created')}}</th>
                                    <th>{{$t('Created by')}}</th>
                                    <th>{{$t('version_notes')}}</th>
                                    <th>{{$t('Status')}}</th>
                                    <th>{{$t('Actions')}}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="version in versions" :key="version.id">
                                    <td><strong>{{version.version_number}}</strong></td>
                                    <td>{{momentDate(version.version_created)}}</td>
                                    <td>{{version.version_created_by_name || '-'}}</td>
                                    <td>{{version.version_notes || '-'}}</td>
                                    <td>
                                        <v-chip v-if="version.is_locked == 1" color="red" text-color="white" x-small>
                                            <v-icon left x-small>mdi-lock</v-icon>
                                            {{$t('locked')}}
                                        </v-chip>
                                    </td>
                                    <td>
                                        <v-btn x-small color="primary" outlined @click="viewVersion(version.id)">
                                            <v-icon left x-small>mdi-eye</v-icon>
                                            {{$t('View')}}
                                        </v-btn>
                                    </td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>

                </v-card-text>
            </v-card>
        </div>
    `
});
