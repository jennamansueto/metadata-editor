/**
 * Keyword Suggestion Component
 * 
 * Provides a "Suggest Keywords" button that uses an LLM API to generate
 * keyword suggestions for indicator/timeseries projects. Shows a dialog
 * with accept/reject UI for each suggestion.
 */
Vue.component('keyword-suggest', {
    props: {
        value: {
            type: Array,
            default: function() { return []; }
        },
        field: {
            type: Object,
            default: function() { return {}; }
        }
    },
    data: function() {
        return {
            dialog: false,
            loading: false,
            error_message: '',
            temperature: 0.7,
            suggestions: [],
            is_mock: false,
            llm_configured: null
        };
    },
    computed: {
        projectId: function() {
            return this.$store.getters.getProjectID;
        },
        projectType: function() {
            return this.$store.getters.getProjectType;
        },
        isFieldReadOnly: function() {
            if (!this.$store.getters.getUserHasEditAccess) {
                return true;
            }
            return this.field && this.field.is_readonly;
        },
        selectedCount: function() {
            return this.suggestions.filter(function(s) { return s.selected; }).length;
        },
        hasAnySuggestions: function() {
            return this.suggestions.length > 0;
        }
    },
    methods: {
        openDialog: function() {
            this.dialog = true;
            this.error_message = '';
            this.suggestions = [];

            // Check LLM config status
            var vm = this;
            axios.get(CI.base_url + '/api/llm/config')
                .then(function(response) {
                    if (response.data && response.data.status === 'success') {
                        vm.llm_configured = response.data.is_configured;
                        if (response.data.default_temperature !== undefined) {
                            vm.temperature = response.data.default_temperature;
                        }
                    }
                })
                .catch(function() {
                    vm.llm_configured = false;
                });
        },
        fetchSuggestions: function() {
            var vm = this;
            vm.loading = true;
            vm.error_message = '';
            vm.suggestions = [];

            var url = CI.base_url + '/api/llm/suggest_keywords/' + this.projectId;
            var payload = {
                temperature: this.temperature
            };

            axios.post(url, payload)
                .then(function(response) {
                    if (response.data && response.data.status === 'success') {
                        vm.is_mock = response.data.is_mock || false;

                        // Build suggestion objects with selected state
                        var existing = vm.getExistingKeywordNames();
                        vm.suggestions = (response.data.keywords || []).map(function(kw) {
                            var isDuplicate = existing.indexOf(kw.toLowerCase()) !== -1;
                            return {
                                name: kw,
                                selected: !isDuplicate,
                                duplicate: isDuplicate
                            };
                        });
                    } else {
                        vm.error_message = (response.data && response.data.message) || 'Unknown error';
                    }
                })
                .catch(function(error) {
                    var msg = 'Failed to fetch suggestions';
                    if (error.response && error.response.data && error.response.data.message) {
                        msg = error.response.data.message;
                    }
                    vm.error_message = msg;
                })
                .finally(function() {
                    vm.loading = false;
                });
        },
        getExistingKeywordNames: function() {
            var current = this.value || [];
            return current.map(function(item) {
                if (typeof item === 'string') return item.toLowerCase();
                if (item && item.name) return item.name.toLowerCase();
                return '';
            }).filter(function(n) { return n !== ''; });
        },
        toggleAll: function(selected) {
            this.suggestions.forEach(function(s) {
                if (!s.duplicate) {
                    s.selected = selected;
                }
            });
        },
        addSelected: function() {
            var selected = this.suggestions.filter(function(s) {
                return s.selected && !s.duplicate;
            });

            if (selected.length === 0) return;

            // Build new keyword entries matching the field props structure
            var currentValue = this.value ? JSON.parse(JSON.stringify(this.value)) : [];

            // Remove empty placeholder rows
            currentValue = currentValue.filter(function(row) {
                if (typeof row === 'object' && row !== null) {
                    var keys = Object.keys(row);
                    return keys.some(function(k) { return row[k] && row[k].toString().trim() !== ''; });
                }
                return row !== '' && row !== null && row !== undefined;
            });

            selected.forEach(function(s) {
                currentValue.push({
                    name: s.name,
                    vocabulary: '',
                    uri: ''
                });
            });

            this.$emit('input', currentValue);
            this.dialog = false;

            // Show toast
            if (window.bus) {
                window.bus.$emit('onSuccess', selected.length + ' keyword(s) added');
            }
        }
    },
    template: `
        <div class="keyword-suggest-wrapper d-inline-block">
            <v-btn
                small
                color="primary"
                outlined
                class="ml-2 mb-1"
                @click="openDialog"
                :disabled="isFieldReadOnly"
                title="Use AI to suggest keywords based on indicator metadata"
            >
                <v-icon small class="mr-1">mdi-lightbulb-outline</v-icon>
                Suggest Keywords
            </v-btn>

            <v-dialog v-model="dialog" max-width="650" scrollable>
                <v-card>
                    <v-card-title class="headline pb-2">
                        <v-icon class="mr-2" color="primary">mdi-lightbulb-outline</v-icon>
                        AI Keyword Suggestions
                    </v-card-title>

                    <v-card-text class="pt-2">
                        <!-- Mock mode notice -->
                        <v-alert v-if="llm_configured === false" type="info" dense outlined class="mb-3">
                            No LLM API is configured. Mock keywords will be generated for demonstration.
                            To use a real LLM, configure the API settings in Admin &gt; Site Configurations.
                        </v-alert>

                        <!-- Temperature control -->
                        <div class="mb-4">
                            <label class="d-block mb-1 font-weight-medium">Temperature: {{ temperature.toFixed(1) }}</label>
                            <v-slider
                                v-model="temperature"
                                :min="0"
                                :max="1"
                                :step="0.1"
                                thumb-label
                                hide-details
                                color="primary"
                            ></v-slider>
                            <small class="text-muted">
                                Lower values produce more focused/deterministic results, higher values more creative/diverse.
                            </small>
                        </div>

                        <!-- Generate button -->
                        <div class="text-center mb-3" v-if="!hasAnySuggestions && !loading">
                            <v-btn
                                color="primary"
                                @click="fetchSuggestions"
                                :loading="loading"
                            >
                                <v-icon left>mdi-creation</v-icon>
                                Generate Suggestions
                            </v-btn>
                        </div>

                        <!-- Loading state -->
                        <div v-if="loading" class="text-center py-4">
                            <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
                            <div class="mt-2 text-muted">Generating keyword suggestions...</div>
                        </div>

                        <!-- Error message -->
                        <v-alert v-if="error_message" type="error" dense outlined class="mb-3">
                            {{ error_message }}
                        </v-alert>

                        <!-- Suggestions list -->
                        <div v-if="hasAnySuggestions && !loading">
                            <div class="d-flex align-center mb-2">
                                <span class="font-weight-medium">Suggestions</span>
                                <v-chip v-if="is_mock" x-small color="orange" outlined class="ml-2">Mock</v-chip>
                                <v-spacer></v-spacer>
                                <v-btn x-small text @click="toggleAll(true)" class="mr-1">Select All</v-btn>
                                <v-btn x-small text @click="toggleAll(false)">Deselect All</v-btn>
                            </div>

                            <v-list dense class="keyword-suggestions-list">
                                <v-list-item
                                    v-for="(suggestion, idx) in suggestions"
                                    :key="idx"
                                    class="px-0"
                                    :class="{ 'grey lighten-4': suggestion.duplicate }"
                                >
                                    <v-list-item-action class="mr-2 my-0">
                                        <v-checkbox
                                            v-model="suggestion.selected"
                                            :disabled="suggestion.duplicate"
                                            hide-details
                                            dense
                                            class="mt-0 pt-0"
                                        ></v-checkbox>
                                    </v-list-item-action>
                                    <v-list-item-content class="py-1">
                                        <v-list-item-title>
                                            {{ suggestion.name }}
                                            <v-chip v-if="suggestion.duplicate" x-small color="grey" outlined class="ml-1">already exists</v-chip>
                                        </v-list-item-title>
                                    </v-list-item-content>
                                    <v-list-item-action class="my-0" v-if="!suggestion.duplicate">
                                        <v-btn icon x-small @click="suggestion.selected = !suggestion.selected">
                                            <v-icon small :color="suggestion.selected ? 'success' : 'grey'">
                                                {{ suggestion.selected ? 'mdi-check-circle' : 'mdi-close-circle-outline' }}
                                            </v-icon>
                                        </v-btn>
                                    </v-list-item-action>
                                </v-list-item>
                            </v-list>

                            <!-- Regenerate button -->
                            <div class="text-center mt-2">
                                <v-btn small text @click="fetchSuggestions" :loading="loading">
                                    <v-icon small left>mdi-refresh</v-icon>
                                    Regenerate
                                </v-btn>
                            </div>
                        </div>
                    </v-card-text>

                    <v-divider></v-divider>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text @click="dialog = false">Cancel</v-btn>
                        <v-btn
                            color="primary"
                            @click="addSelected"
                            :disabled="selectedCount === 0"
                            v-if="hasAnySuggestions"
                        >
                            <v-icon left small>mdi-plus</v-icon>
                            Add {{ selectedCount }} Keyword(s)
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </div>
    `
});
