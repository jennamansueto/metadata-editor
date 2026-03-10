/// Project diagnostic component
Vue.component('project-diagnostic', {
    data: function () {
        return {
            loading: false,
            error: null,
            diagnostic: null,
            expanded_categories: [],
            project_id: project_sid
        }
    },
    computed: {
        ProjectID() {
            return this.$store.state.project_id || this.project_id;
        },
        ProjectType() {
            return this.$store.state.project_type;
        },
        overallScore() {
            return this.diagnostic ? this.diagnostic.overall_score : 0;
        },
        overallScoreColor() {
            if (this.overallScore >= 80) return 'success';
            if (this.overallScore >= 50) return 'warning';
            return 'error';
        },
        overallScoreLabel() {
            if (this.overallScore >= 80) return 'Good';
            if (this.overallScore >= 50) return 'Needs Improvement';
            return 'Poor';
        },
        categories() {
            return this.diagnostic ? this.diagnostic.categories : [];
        },
        summary() {
            return this.diagnostic ? this.diagnostic.summary : { total_checks: 0, passed: 0, warnings: 0, errors: 0 };
        }
    },
    mounted: function() {
        this.runDiagnostic();
    },
    methods: {
        runDiagnostic: function() {
            this.loading = true;
            this.error = null;
            var vm = this;
            var url = CI.base_url + '/api/validation/' + vm.ProjectID + '/diagnostic';

            axios.get(url)
                .then(function (response) {
                    if (response.data && response.data.status === 'success') {
                        vm.diagnostic = response.data.diagnostic;
                        // Expand categories that have issues by default
                        vm.expanded_categories = [];
                        if (vm.diagnostic && vm.diagnostic.categories) {
                            vm.diagnostic.categories.forEach(function(cat, index) {
                                if (cat.issues && cat.issues.length > 0) {
                                    vm.expanded_categories.push(index);
                                }
                            });
                        }
                    } else {
                        vm.error = 'Failed to load diagnostic report';
                    }
                })
                .catch(function (error) {
                    console.error('Diagnostic API error:', error);
                    vm.error = error.response && error.response.data && error.response.data.message
                        ? error.response.data.message
                        : 'Failed to load diagnostic report';
                })
                .then(function () {
                    vm.loading = false;
                });
        },
        getCategoryScoreColor: function(score) {
            if (score >= 80) return 'success';
            if (score >= 50) return 'warning';
            return 'error';
        },
        getSeverityColor: function(severity) {
            if (severity === 'error') return 'error';
            if (severity === 'warning') return 'orange';
            return 'info';
        },
        getSeverityIcon: function(severity) {
            if (severity === 'error') return 'mdi-alert-circle';
            if (severity === 'warning') return 'mdi-alert';
            return 'mdi-information';
        },
        navigateToField: function(field) {
            if (!field) return;

            // Convert dot-notation to route path
            var dotPath = field;

            // Check for variable-related fields
            if (dotPath === 'data_files' || dotPath === 'variables' || dotPath === 'variable_labels') {
                this.$router.push('/datafiles');
                return;
            }

            if (dotPath === 'geospatial_features') {
                this.$router.push('/geospatial-features');
                return;
            }

            if (dotPath === 'keywords' || dotPath === 'abstract' || dotPath === 'dimensions') {
                // These are generic labels, try to navigate to study root
                this.$router.push('/');
                return;
            }

            // Navigate to the study section
            this.$router.push('/study/' + dotPath);
        },
        navigateToValidationReport: function() {
            this.$router.push('/validation-report');
        }
    },
    template: `
        <div class="project-diagnostic-component mt-3 container-fluid">

            <!-- Header -->
            <div class="d-flex align-center justify-space-between mb-4">
                <div class="d-flex align-center">
                    <v-icon large color="primary" class="mr-3">mdi-stethoscope</v-icon>
                    <div>
                        <h5 class="mb-0">{{$t("Project Diagnostic")}}</h5>
                        <div class="text-caption grey--text">{{$t("Metadata quality analysis and recommendations")}}</div>
                    </div>
                </div>
                <div class="d-flex align-center">
                    <v-btn text small class="mr-2" @click="navigateToValidationReport">
                        <v-icon small left>mdi-clipboard-list</v-icon>
                        {{$t("Validation Report")}}
                    </v-btn>
                    <v-btn outlined color="primary" @click="runDiagnostic" :loading="loading">
                        <v-icon left>mdi-refresh</v-icon>
                        {{$t("Run Diagnostic")}}
                    </v-btn>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="loading && !diagnostic" class="text-center pa-10">
                <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
                <div class="mt-3 text-caption">{{$t("Running diagnostic checks...")}}</div>
            </div>

            <!-- Error -->
            <v-alert v-if="error" type="error" outlined class="mb-4">
                {{ error }}
            </v-alert>

            <!-- Results -->
            <div v-if="diagnostic">

                <!-- Overall Score Card -->
                <v-card class="mb-4" outlined>
                    <v-card-text>
                        <div class="row align-center">
                            <div class="col-md-3 text-center">
                                <v-progress-circular
                                    :value="overallScore"
                                    :size="120"
                                    :width="12"
                                    :color="overallScoreColor"
                                    :rotate="-90"
                                >
                                    <div>
                                        <div class="text-h4 font-weight-bold">{{overallScore}}</div>
                                        <div class="text-caption">/ 100</div>
                                    </div>
                                </v-progress-circular>
                                <div class="mt-2">
                                    <v-chip :color="overallScoreColor" dark small>
                                        {{overallScoreLabel}}
                                    </v-chip>
                                </div>
                            </div>
                            <div class="col-md-9">
                                <h6 class="mb-3">{{$t("Diagnostic Summary")}}</h6>
                                <div class="row">
                                    <div class="col-3 text-center">
                                        <div class="text-h5 font-weight-bold">{{summary.total_checks}}</div>
                                        <div class="text-caption grey--text">{{$t("Total Checks")}}</div>
                                    </div>
                                    <div class="col-3 text-center">
                                        <div class="text-h5 font-weight-bold success--text">{{summary.passed}}</div>
                                        <div class="text-caption grey--text">{{$t("Passed")}}</div>
                                    </div>
                                    <div class="col-3 text-center">
                                        <div class="text-h5 font-weight-bold orange--text">{{summary.warnings}}</div>
                                        <div class="text-caption grey--text">{{$t("Warnings")}}</div>
                                    </div>
                                    <div class="col-3 text-center">
                                        <div class="text-h5 font-weight-bold error--text">{{summary.errors}}</div>
                                        <div class="text-caption grey--text">{{$t("Errors")}}</div>
                                    </div>
                                </div>

                                <!-- Category score bars -->
                                <div class="mt-4">
                                    <div v-for="(cat, idx) in categories" :key="cat.id" class="mb-2">
                                        <div class="d-flex justify-space-between align-center mb-1">
                                            <div class="text-caption">
                                                <v-icon x-small class="mr-1">{{cat.icon}}</v-icon>
                                                {{cat.title}}
                                            </div>
                                            <div class="text-caption font-weight-bold">{{cat.score}}%</div>
                                        </div>
                                        <v-progress-linear
                                            :value="cat.score"
                                            :color="getCategoryScoreColor(cat.score)"
                                            height="6"
                                            rounded
                                        ></v-progress-linear>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Category Details -->
                <v-expansion-panels v-model="expanded_categories" multiple>
                    <v-expansion-panel v-for="(cat, catIdx) in categories" :key="cat.id">
                        <v-expansion-panel-header>
                            <div class="d-flex align-center" style="width:100%">
                                <v-icon class="mr-3" :color="getCategoryScoreColor(cat.score)">{{cat.icon}}</v-icon>
                                <div style="flex:1">
                                    <div class="font-weight-medium">{{cat.title}}</div>
                                    <div class="text-caption grey--text">{{cat.description}}</div>
                                </div>
                                <div class="d-flex align-center mr-4">
                                    <v-chip v-if="cat.errors > 0" color="error" dark x-small class="mr-1">
                                        {{cat.errors}} {{cat.errors === 1 ? 'error' : 'errors'}}
                                    </v-chip>
                                    <v-chip v-if="cat.warnings > 0" color="orange" dark x-small class="mr-1">
                                        {{cat.warnings}} {{cat.warnings === 1 ? 'warning' : 'warnings'}}
                                    </v-chip>
                                    <v-chip v-if="cat.errors === 0 && cat.warnings === 0" color="success" dark x-small>
                                        {{$t("All passed")}}
                                    </v-chip>
                                    <div class="ml-3 text-caption font-weight-bold" :class="getCategoryScoreColor(cat.score) + '--text'">
                                        {{cat.score}}%
                                    </div>
                                </div>
                            </div>
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                            <!-- Passed message -->
                            <v-alert v-if="cat.issues.length === 0" type="success" text dense class="mb-0">
                                {{$t("All checks passed for this category.")}} ({{cat.passed}}/{{cat.total_checks}})
                            </v-alert>

                            <!-- Issues list -->
                            <v-list v-else dense class="pa-0">
                                <template v-for="(issue, issueIdx) in cat.issues">
                                    <v-list-item
                                        :key="issueIdx"
                                        @click="navigateToField(issue.field)"
                                        class="diagnostic-issue-item"
                                    >
                                        <v-list-item-icon class="mr-3">
                                            <v-icon :color="getSeverityColor(issue.severity)">
                                                {{getSeverityIcon(issue.severity)}}
                                            </v-icon>
                                        </v-list-item-icon>
                                        <v-list-item-content>
                                            <v-list-item-title>
                                                <span :style="{ color: issue.severity === 'error' ? '#f44336' : '#ff9800' }">
                                                    {{issue.message}}
                                                </span>
                                            </v-list-item-title>
                                            <v-list-item-subtitle v-if="issue.recommendation">
                                                <v-icon x-small class="mr-1">mdi-lightbulb-outline</v-icon>
                                                {{issue.recommendation}}
                                            </v-list-item-subtitle>
                                        </v-list-item-content>
                                        <v-list-item-action>
                                            <v-icon small color="grey">mdi-chevron-right</v-icon>
                                        </v-list-item-action>
                                    </v-list-item>
                                    <v-divider v-if="issueIdx < cat.issues.length - 1" :key="'d-' + issueIdx"></v-divider>
                                </template>
                            </v-list>

                            <!-- Category summary -->
                            <div class="pa-3 grey lighten-4 mt-2" style="border-radius:4px;">
                                <span class="text-caption">
                                    <strong>{{cat.passed}}</strong> of <strong>{{cat.total_checks}}</strong> checks passed
                                </span>
                            </div>
                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

            </div>
        </div>
    `
});
