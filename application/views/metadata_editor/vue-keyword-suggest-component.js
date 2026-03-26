// Keyword suggestion component using LLM/AI
Vue.component('keyword-suggest', {
    props: ['value', 'field'],
    data: function () {
        return {
            dialog: false,
            loading: false,
            error_message: '',
            suggestions: [],
            temperature: 0.7,
            is_mock: false,
            llm_configured: null
        }
    },
    computed: {
        projectId() {
            return this.$store.state.project_id;
        },
        isFieldReadOnly() {
            if (!this.$store.getters.getUserHasEditAccess) {
                return true;
            }
            if (this.field && this.field.is_readonly) {
                return this.field.is_readonly;
            }
            return false;
        },
        selectedCount() {
            return this.suggestions.filter(function (s) { return s.selected; }).length;
        },
        allSelected() {
            return this.suggestions.length > 0 && this.suggestions.every(function (s) { return s.selected; });
        },
        existingKeywords() {
            var current = this.value;
            if (!Array.isArray(current)) {
                return [];
            }
            var keywords = [];
            for (var i = 0; i < current.length; i++) {
                var item = current[i];
                if (typeof item === 'string') {
                    keywords.push(item.toLowerCase().trim());
                } else if (typeof item === 'object' && item !== null) {
                    var keys = Object.keys(item);
                    for (var j = 0; j < keys.length; j++) {
                        var val = item[keys[j]];
                        if (typeof val === 'string' && val.trim() !== '') {
                            keywords.push(val.toLowerCase().trim());
                        }
                    }
                }
            }
            return keywords;
        }
    },
    methods: {
        openDialog: function () {
            this.dialog = true;
            this.suggestions = [];
            this.error_message = '';
            this.fetchConfig();
        },
        fetchConfig: function () {
            var vm = this;
            var base = CI.base_url;
            fetch(base + 'api/llm/config', {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' }
            })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.data) {
                    vm.llm_configured = data.data.is_configured;
                    if (data.data.default_temperature !== undefined) {
                        vm.temperature = parseFloat(data.data.default_temperature);
                    }
                }
            })
            .catch(function () {
                vm.llm_configured = false;
            });
        },
        suggestKeywords: function () {
            var vm = this;
            vm.loading = true;
            vm.error_message = '';
            vm.suggestions = [];

            var base = CI.base_url;
            var url = base + 'api/llm/suggest_keywords/' + vm.projectId;

            fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ temperature: vm.temperature })
            })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                vm.loading = false;
                if (data.status === 'success' && data.data && Array.isArray(data.data.keywords)) {
                    vm.is_mock = !!data.data.mock;
                    vm.suggestions = data.data.keywords.map(function (kw) {
                        var isDuplicate = vm.existingKeywords.indexOf(kw.toLowerCase().trim()) !== -1;
                        return {
                            keyword: kw,
                            selected: !isDuplicate,
                            duplicate: isDuplicate
                        };
                    });
                } else {
                    var msg = (data.data && data.data.error) ? data.data.error : (data.message || 'Failed to get suggestions');
                    vm.error_message = msg;
                }
            })
            .catch(function (err) {
                vm.loading = false;
                vm.error_message = 'Network error: ' + err.message;
            });
        },
        toggleAll: function () {
            var newVal = !this.allSelected;
            for (var i = 0; i < this.suggestions.length; i++) {
                this.suggestions[i].selected = newVal;
            }
        },
        addSelected: function () {
            var selected = this.suggestions
                .filter(function (s) { return s.selected; })
                .map(function (s) { return s.keyword; });

            if (selected.length === 0) {
                return;
            }

            var current = this.value;
            if (!Array.isArray(current)) {
                current = [];
            }

            // Clone current value
            var updated = JSON.parse(JSON.stringify(current));

            // Determine the column structure from the field props
            var columns = (this.field && this.field.props) ? this.field.props : [];
            var firstKey = columns.length > 0 ? columns[0].key : null;

            for (var i = 0; i < selected.length; i++) {
                if (firstKey) {
                    var row = {};
                    row[firstKey] = selected[i];
                    updated.push(row);
                } else {
                    updated.push(selected[i]);
                }
            }

            this.$emit('input', updated);
            this.dialog = false;
        }
    },
    template: `
        <span class="keyword-suggest-wrapper" style="display:inline-block;">
            <v-btn
                x-small
                text
                color="primary"
                @click="openDialog"
                :disabled="isFieldReadOnly"
                title="Suggest keywords using AI"
                class="ml-1"
            >
                <v-icon x-small class="mr-1">mdi-lightbulb-outline</v-icon>
                Suggest
            </v-btn>

            <v-dialog v-model="dialog" max-width="600" scrollable>
                <v-card>
                    <v-card-title class="headline">
                        <v-icon class="mr-2">mdi-lightbulb-outline</v-icon>
                        AI Keyword Suggestions
                        <v-spacer></v-spacer>
                        <v-chip v-if="is_mock" small color="orange" text-color="white" class="ml-2">Mock Mode</v-chip>
                    </v-card-title>

                    <v-card-text>
                        <div class="mb-3">
                            <label class="d-block mb-1 font-weight-medium">Temperature: {{ temperature.toFixed(1) }}</label>
                            <v-slider
                                v-model="temperature"
                                min="0"
                                max="1"
                                step="0.1"
                                thumb-label
                                hide-details
                                dense
                            ></v-slider>
                            <div class="d-flex justify-space-between text-caption text-muted">
                                <span>Deterministic</span>
                                <span>Creative</span>
                            </div>
                        </div>

                        <v-btn
                            color="primary"
                            :loading="loading"
                            :disabled="loading"
                            @click="suggestKeywords"
                            block
                            class="mb-3"
                        >
                            <v-icon left>mdi-auto-fix</v-icon>
                            Generate Suggestions
                        </v-btn>

                        <v-alert v-if="llm_configured === false && !loading && suggestions.length === 0" type="info" dense class="mb-3">
                            No LLM API key is configured. Suggestions will use mock mode.
                        </v-alert>

                        <v-alert v-if="error_message" type="error" dense dismissible class="mb-3">
                            {{ error_message }}
                        </v-alert>

                        <div v-if="suggestions.length > 0">
                            <div class="d-flex align-center mb-2">
                                <v-checkbox
                                    :input-value="allSelected"
                                    @change="toggleAll"
                                    hide-details
                                    dense
                                    class="mt-0 mr-2"
                                    label="Select all"
                                ></v-checkbox>
                                <v-spacer></v-spacer>
                                <span class="text-caption">{{ selectedCount }} of {{ suggestions.length }} selected</span>
                            </div>

                            <v-divider class="mb-2"></v-divider>

                            <div v-for="(item, idx) in suggestions" :key="idx" class="d-flex align-center py-1">
                                <v-checkbox
                                    v-model="item.selected"
                                    hide-details
                                    dense
                                    class="mt-0 mr-2"
                                ></v-checkbox>
                                <span :class="{ 'text-decoration-line-through text--disabled': item.duplicate }">
                                    {{ item.keyword }}
                                </span>
                                <v-chip v-if="item.duplicate" x-small color="grey lighten-1" class="ml-2">duplicate</v-chip>
                            </div>
                        </div>
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn text @click="dialog = false">Cancel</v-btn>
                        <v-btn
                            color="primary"
                            :disabled="selectedCount === 0"
                            @click="addSelected"
                        >
                            Add {{ selectedCount }} Keyword<span v-if="selectedCount !== 1">s</span>
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </span>
    `
});
