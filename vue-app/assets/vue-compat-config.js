// Configure Vue 3 compat mode - enable all Vue 2 compat features
if (typeof Vue !== 'undefined' && Vue.configureCompat) {
    Vue.configureCompat({
        MODE: 2 // Enable full Vue 2 compatibility mode
    });
}

// ---------------------------------------------------------------------------
// Vuetify 2.7 kebab-case component alias registration
// ---------------------------------------------------------------------------
// Problem: Vuetify 2.7 registers components as PascalCase only (VApp, VBtn,
// VContainer, etc.) via Vue.component(). Vue 3 compat's in-DOM template
// compiler does NOT auto-resolve kebab-case tag names (v-app, v-btn) to their
// PascalCase counterparts. Since all existing templates use <v-app>, <v-btn>,
// etc., we must register kebab-case aliases.
//
// This runs AFTER vuetify.min.js loads. We hook into Vue.mixin (which Vuetify
// calls during install) to detect when Vuetify finishes installing, then
// register all kebab-case aliases.
// ---------------------------------------------------------------------------
(function() {
    if (typeof Vue === 'undefined') return;

    // Convert PascalCase to kebab-case: "VAppBar" -> "v-app-bar"
    function toKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                   .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
                   .toLowerCase();
    }

    // Register kebab-case aliases for all Vuetify components.
    // Called after Vuetify.install() has registered PascalCase components.
    function registerKebabAliases() {
        if (typeof Vuetify === 'undefined') return;
        var vuetifyComponentNames = [
            'VApp','VAppBar','VAppBarNavIcon','VAppBarTitle','VAlert',
            'VAutocomplete','VAvatar','VBadge','VBanner','VBottomNavigation',
            'VBottomSheet','VBreadcrumbs','VBreadcrumbsItem','VBreadcrumbsDivider',
            'VBtn','VBtnToggle','VCalendar','VCalendarCategory','VCalendarDaily',
            'VCalendarWeekly','VCalendarMonthly','VCard','VCardActions',
            'VCardSubtitle','VCardText','VCardTitle','VCarousel','VCarouselItem',
            'VCheckbox','VSimpleCheckbox','VChip','VChipGroup','VColorPicker',
            'VColorPickerSwatches','VColorPickerCanvas','VContent','VCombobox',
            'VCounter','VData','VDataIterator','VDataFooter','VDataTable',
            'VEditDialog','VTableOverflow','VDataTableHeader','VSimpleTable',
            'VVirtualTable','VDatePicker','VDatePickerTitle','VDatePickerHeader',
            'VDatePickerDateTable','VDatePickerMonthTable','VDatePickerYears',
            'VDialog','VDivider','VExpansionPanels','VExpansionPanel',
            'VExpansionPanelHeader','VExpansionPanelContent','VFileInput',
            'VFooter','VForm','VContainer','VCol','VRow','VSpacer','VLayout',
            'VFlex','VHover','VIcon','VImg','VInput','VItem','VItemGroup',
            'VLabel','VLazy','VListItemActionText','VListItemContent',
            'VListItemTitle','VListItemSubtitle','VList','VListGroup',
            'VListItem','VListItemAction','VListItemAvatar','VListItemIcon',
            'VListItemGroup','VMain','VMenu','VMessages','VNavigationDrawer',
            'VOtpInput','VOverflowBtn','VOverlay','VPagination','VSheet',
            'VParallax','VPicker','VProgressCircular','VProgressLinear',
            'VRadioGroup','VRadio','VRangeSlider','VRating','VResponsive',
            'VSelect','VSkeletonLoader','VSlider','VSlideGroup','VSlideItem',
            'VSnackbar','VSparkline','VSpeedDial','VStepper','VStepperContent',
            'VStepperStep','VStepperHeader','VStepperItems','VSubheader',
            'VSwitch','VSystemBar','VTabs','VTab','VTabItem','VTabsItems',
            'VTabsSlider','VTextarea','VTextField','VThemeProvider',
            'VTimeline','VTimelineItem','VTimePicker','VTimePickerClock',
            'VTimePickerTitle','VToolbar','VToolbarItems','VToolbarTitle',
            'VTooltip','VTreeview','VTreeviewNode','VVirtualScroll',
            'VWindow','VWindowItem',
            'VCarouselTransition','VCarouselReverseTransition',
            'VTabTransition','VTabReverseTransition','VMenuTransition',
            'VFabTransition','VDialogTransition','VDialogBottomTransition',
            'VDialogTopTransition','VFadeTransition','VScaleTransition',
            'VScrollXTransition','VScrollXReverseTransition',
            'VScrollYTransition','VScrollYReverseTransition',
            'VSlideXTransition','VSlideXReverseTransition',
            'VSlideYTransition','VSlideYReverseTransition',
            'VExpandTransition','VExpandXTransition'
        ];

        for (var i = 0; i < vuetifyComponentNames.length; i++) {
            var pascal = vuetifyComponentNames[i];
            var comp = Vue.component(pascal);
            if (comp) {
                var kebab = toKebab(pascal);
                if (kebab !== pascal.toLowerCase()) {
                    Vue.component(kebab, comp);
                }
            }
        }
    }

    // We need to register kebab aliases AFTER Vuetify.install() runs
    // (which happens when vuetify.min.js loads) but BEFORE new Vue() mounts.
    var _aliasesRegistered = false;
    function ensureKebabAliases() {
        if (_aliasesRegistered) return;
        _aliasesRegistered = true;
        registerKebabAliases();
    }

    // Strategy 1: Hook into Vue.mixin to detect when Vuetify installs.
    // Vuetify.install() calls Vue.mixin() with a beforeCreate hook.
    // We detect this by checking if Vuetify is defined and VApp is registered.
    var _origMixin = Vue.mixin;
    Vue.mixin = function(mixin) {
        var result = _origMixin.apply(this, arguments);
        if (!_aliasesRegistered && typeof Vuetify !== 'undefined' &&
            Vue.component && Vue.component('VApp')) {
            ensureKebabAliases();
        }
        return result;
    };

    // Strategy 2: Also add a global mixin beforeCreate hook that runs once
    // on first component creation, as a safety net.
    Vue.mixin({
        beforeCreate: function() {
            if (!_aliasesRegistered && typeof Vuetify !== 'undefined') {
                ensureKebabAliases();
            }
        }
    });

    // Also expose for manual calling if needed
    window._registerVuetifyKebabAliases = ensureKebabAliases;
})();
