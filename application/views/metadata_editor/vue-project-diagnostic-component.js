/// Project diagnostic component - metadata quality checks
Vue.component('project-diagnostic', {
    data() {
        return {
            loading: false,
            error: null,
            diagnostic: null,
            expanded_categories: []
        }
    },
    created: function() {
        this.runDiagnostic();
    },
    computed: {
        ProjectID() {
            return this.$store.state.project_id;
        },
        overallScore() {
            if (!this.diagnostic) return 0;
            return this.diagnostic.overall_score;
        },
        scoreColor() {
            let score = this.overallScore;
            if (score >= 80) return '#4CAF50';
            if (score >= 60) return '#FF9800';
            return '#F44336';
        },
        categories() {
            if (!this.diagnostic) return [];
            return this.diagnostic.categories;
        },
        summary() {
            if (!this.diagnostic) return { total_checks: 0, passed: 0, warnings: 0, errors: 0 };
            return this.diagnostic.summary;
        }
    },
    methods: {
        runDiagnostic: function() {
            let vm = this;
            vm.loading = true;
            vm.error = null;

            let url = CI.base_url + '/api/validation/' + this.ProjectID + '/diagnostic';

            axios.get(url)
            .then(function(response) {
                if (response.data && response.data.status === 'success') {
                    vm.diagnostic = response.data.diagnostic;
                } else {
                    vm.error = 'Failed to load diagnostic data';
                }
            })
            .catch(function(error) {
                console.log("diagnostic_failed", error);
                vm.error = 'Failed to load diagnostic: ' + (error.response && error.response.data ? error.response.data.message : error.message);
            })
            .finally(function() {
                vm.loading = false;
            });
        },
        getCategoryColor: function(score) {
            if (score >= 80) return 'success';
            if (score >= 60) return 'warning';
            return 'error';
        },
        getSeverityIcon: function(severity) {
            if (severity === 'error') return 'mdi-alert-circle';
            return 'mdi-alert';
        },
        getSeverityColor: function(severity) {
            if (severity === 'error') return 'error';
            return 'warning';
        },
        toggleCategory: function(catId) {
            let idx = this.expanded_categories.indexOf(catId);
            if (idx > -1) {
                this.expanded_categories.splice(idx, 1);
            } else {
                this.expanded_categories.push(catId);
            }
        },
        isCategoryExpanded: function(catId) {
            return this.expanded_categories.indexOf(catId) > -1;
        }
    },
    template: `
        <div class="project-diagnostic-component mt-3 container-fluid">

            <div class="row mb-3">
                <div class="col-12">
                    <div class="d-flex justify-space-between align-center">
                        <h5 class="mb-0">
                            <v-icon class="mr-1">mdi-stethoscope</v-icon>
                            {{$t('Project Diagnostic')}}
                        </h5>
                        <v-btn
                            small
                            outlined
                            color="primary"
                            @click="runDiagnostic"
                            :loading="loading"
                        >
                            <v-icon left small>mdi-refresh</v-icon>
                            {{$t('Refresh')}}
                        </v-btn>
                    </div>
                </div>
            </div>

            <v-alert v-if="error" type="error" dense dismissible class="mb-3">
                {{error}}
            </v-alert>

            <div v-if="loading && !diagnostic" class="text-center py-5">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <div class="mt-2 text-muted">Running diagnostic checks...</div>
            </div>

            <template v-if="diagnostic">
                <!-- Overall Score and Summary -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <v-card class="text-center pa-4" outlined>
                            <v-progress-circular
                                :rotate="-90"
                                :size="120"
                                :width="12"
                                :value="overallScore"
                                :color="scoreColor"
                            >
                                <span style="font-size:24px;font-weight:bold;">{{overallScore}}%</span>
                            </v-progress-circular>
                            <div class="mt-2 text-subtitle-1 font-weight-medium">Overall Score</div>
                        </v-card>
                    </div>
                    <div class="col-md-8">
                        <v-card outlined class="pa-4">
                            <div class="text-subtitle-1 font-weight-medium mb-3">Summary</div>
                            <div class="row">
                                <div class="col-3 text-center">
                                    <div style="font-size:28px;font-weight:bold;color:#1976D2;">{{summary.total_checks}}</div>
                                    <div class="text-caption text-muted">Total Checks</div>
                                </div>
                                <div class="col-3 text-center">
                                    <div style="font-size:28px;font-weight:bold;color:#4CAF50;">{{summary.passed}}</div>
                                    <div class="text-caption text-muted">Passed</div>
                                </div>
                                <div class="col-3 text-center">
                                    <div style="font-size:28px;font-weight:bold;color:#FF9800;">{{summary.warnings}}</div>
                                    <div class="text-caption text-muted">Warnings</div>
                                </div>
                                <div class="col-3 text-center">
                                    <div style="font-size:28px;font-weight:bold;color:#F44336;">{{summary.errors}}</div>
                                    <div class="text-caption text-muted">Errors</div>
                                </div>
                            </div>
                        </v-card>
                    </div>
                </div>

                <!-- Category Cards -->
                <div class="row">
                    <div class="col-12" v-for="category in categories" :key="category.id">
                        <v-card outlined class="mb-3">
                            <v-card-title
                                class="py-3"
                                style="cursor:pointer;"
                                @click="toggleCategory(category.id)"
                            >
                                <v-icon class="mr-2" :color="getCategoryColor(category.score)">{{category.icon}}</v-icon>
                                <span class="text-subtitle-1 font-weight-medium">{{category.title}}</span>
                                <v-spacer></v-spacer>

                                <v-chip
                                    small
                                    :color="getCategoryColor(category.score)"
                                    :dark="category.score < 80"
                                    :outlined="category.score >= 80"
                                    class="mr-2"
                                >
                                    {{category.score}}%
                                </v-chip>

                                <span class="text-caption text-muted mr-2">
                                    {{category.passed}}/{{category.total_checks}} passed
                                </span>

                                <v-icon>
                                    {{ isCategoryExpanded(category.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                                </v-icon>
                            </v-card-title>

                            <template v-if="!isCategoryExpanded(category.id)">
                                <v-card-text class="pt-0 pb-2">
                                    <v-progress-linear
                                        :value="category.score"
                                        :color="getCategoryColor(category.score)"
                                        height="6"
                                        rounded
                                    ></v-progress-linear>
                                </v-card-text>
                            </template>

                            <template v-if="isCategoryExpanded(category.id)">
                                <v-card-text>
                                    <div class="text-body-2 text-muted mb-3">{{category.description}}</div>

                                    <v-progress-linear
                                        :value="category.score"
                                        :color="getCategoryColor(category.score)"
                                        height="6"
                                        rounded
                                        class="mb-3"
                                    ></v-progress-linear>

                                    <div v-if="category.issues && category.issues.length > 0">
                                        <v-list dense class="pa-0">
                                            <v-list-item
                                                v-for="(issue, idx) in category.issues"
                                                :key="idx"
                                                class="px-0"
                                            >
                                                <v-list-item-icon class="mr-2 my-auto">
                                                    <v-icon
                                                        small
                                                        :color="getSeverityColor(issue.severity)"
                                                    >{{getSeverityIcon(issue.severity)}}</v-icon>
                                                </v-list-item-icon>
                                                <v-list-item-content>
                                                    <v-list-item-title class="text-body-2">
                                                        {{issue.message}}
                                                    </v-list-item-title>
                                                    <v-list-item-subtitle class="text-caption">
                                                        <v-icon x-small class="mr-1">mdi-lightbulb-outline</v-icon>
                                                        {{issue.recommendation}}
                                                    </v-list-item-subtitle>
                                                </v-list-item-content>
                                                <v-list-item-action v-if="issue.field">
                                                    <v-chip x-small outlined>
                                                        {{issue.field}}
                                                    </v-chip>
                                                </v-list-item-action>
                                            </v-list-item>
                                        </v-list>
                                    </div>
                                    <div v-else class="text-center py-3 text-muted">
                                        <v-icon color="success" class="mr-1">mdi-check-circle</v-icon>
                                        All checks passed!
                                    </div>
                                </v-card-text>
                            </template>
                        </v-card>
                    </div>
                </div>
            </template>

        </div>
    `
});
