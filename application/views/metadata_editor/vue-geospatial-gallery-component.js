/// Geospatial gallery component
Vue.component('geospatial-gallery', {
    props:['value'],
    data: function () {    
        return {
            map: null,
            mapContainerId: 'geospatial-gallery-map-' + Math.random().toString(36).substr(2, 9),
            previewDialog: false,
            previewImage: null,
            previewIndex: 0,
            isComponentDestroyed: false,
            mapInitRetries: 0
        }
    },
    created: async function(){
    },
    mounted: function() {
        var vm = this;
        this.$nextTick(function() {
            setTimeout(function() {
                vm.initializeMap();
            }, 300);
        });
    },
    beforeDestroy: function() {
        this.isComponentDestroyed = true;
        this.destroyMap();
        document.removeEventListener('keydown', this.handleKeydown);
    },
    watch: {
        hasBoundingBox: function(newVal) {
            if (newVal) {
                this.mapInitRetries = 0;
                this.$nextTick(function() {
                    this.initializeMap();
                }.bind(this));
            }
        }
    },
    computed: {        
        ExternalResources()
        {
          return this.$store.state.external_resources;
        },
        ExternalResourcesImages()
        {
            var images=[];
            var base_url=CI.base_url;
            for (var i=0;i<this.ExternalResources.length;i++){
                var resource=this.ExternalResources[i];

                //if dctype contains [pic]
                if (resource.dctype && resource.dctype.indexOf("pic")>=0){
                    images.push({
                        id: resource.id,
                        sid: resource.sid,
                        src: base_url + '/api/resources/download/' + resource.sid + '/' + resource.id,
                        title: resource.title || '',
                        description: resource.description || '',
                        filename: resource.filename || '',
                        dctype: resource.dctype
                    });
                }
            }
            return images;
        },
        ProjectType(){
            return this.$store.state.project_type;
        },
        ProjectID(){
            return this.$store.state.project_id;
        },
        ProjectMetadata(){
            return this.$store.state.formData;
        },
        isProjectEditable(){
            return this.$store.getters.getUserHasEditAccess;
        },
        boundingBoxData(){
            if (!this.ProjectMetadata) return null;

            var geoElements = _.get(this.ProjectMetadata, 
                'description.identificationInfo.extent.geographicElement');
            
            if (!geoElements || !Array.isArray(geoElements) || geoElements.length === 0) {
                return null;
            }

            for (var idx = 0; idx < geoElements.length; idx++) {
                var element = geoElements[idx];
                var bbox = element.geographicBoundingBox;
                if (bbox && 
                    bbox.westBoundLongitude !== undefined && bbox.westBoundLongitude !== null && bbox.westBoundLongitude !== '' &&
                    bbox.eastBoundLongitude !== undefined && bbox.eastBoundLongitude !== null && bbox.eastBoundLongitude !== '' &&
                    bbox.southBoundLatitude !== undefined && bbox.southBoundLatitude !== null && bbox.southBoundLatitude !== '' &&
                    bbox.northBoundLatitude !== undefined && bbox.northBoundLatitude !== null && bbox.northBoundLatitude !== '') {
                    return {
                        west: parseFloat(bbox.westBoundLongitude),
                        east: parseFloat(bbox.eastBoundLongitude),
                        south: parseFloat(bbox.southBoundLatitude),
                        north: parseFloat(bbox.northBoundLatitude)
                    };
                }
            }
            return null;
        },
        hasBoundingBox(){
            var bbox = this.boundingBoxData;
            if (!bbox) return false;
            return !isNaN(bbox.west) && !isNaN(bbox.east) && !isNaN(bbox.south) && !isNaN(bbox.north);
        }
    },
    methods:{
        tl: function(key, fallback) {
            var translated = this.$t(key);
            return (translated && translated !== key) ? translated : fallback;
        },
        initializeMap: function() {
            if (this.isComponentDestroyed) return;
            if (!this.hasBoundingBox) return;

            var mapContainer = document.getElementById(this.mapContainerId);
            if (!mapContainer) {
                if (this.mapInitRetries < 10) {
                    this.mapInitRetries++;
                    var vm = this;
                    setTimeout(function() { vm.initializeMap(); }, 100);
                }
                return;
            }

            if (this.map) {
                this.map.invalidateSize();
                return;
            }

            if (typeof L === 'undefined') {
                if (this.mapInitRetries < 10) {
                    this.mapInitRetries++;
                    var vm = this;
                    setTimeout(function() { vm.initializeMap(); }, 200);
                }
                return;
            }

            if (mapContainer._leaflet_id) {
                this.destroyMap();
            }

            try {
                this.map = L.map(this.mapContainerId, {
                    center: [20, 0],
                    zoom: 2,
                    minZoom: 1,
                    maxZoom: 18
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 18
                }).addTo(this.map);

                var vm = this;
                this.map.whenReady(function() {
                    if (!vm.map) return;
                    vm.map.invalidateSize();
                    vm.updateMapBoundingBox();
                });
            } catch (error) {
                console.error('Error initializing gallery map:', error);
            }
        },
        updateMapBoundingBox: function() {
            if (!this.map || !this.hasBoundingBox) return;

            var bbox = this.boundingBoxData;
            var bounds = [
                [bbox.south, bbox.west],
                [bbox.north, bbox.east]
            ];

            var rectangle = L.rectangle(bounds, {
                color: '#ff7800',
                weight: 2,
                fillColor: '#ff7800',
                fillOpacity: 0.2
            }).addTo(this.map);

            var popupContent = '<div>' +
                '<strong>' + this.tl('geographic_bounding_box', 'Geographic Bounding Box') + '</strong><br>' +
                this.tl('north', 'North') + ': ' + bbox.north.toFixed(6) + '&deg;<br>' +
                this.tl('south', 'South') + ': ' + bbox.south.toFixed(6) + '&deg;<br>' +
                this.tl('east', 'East') + ': ' + bbox.east.toFixed(6) + '&deg;<br>' +
                this.tl('west', 'West') + ': ' + bbox.west.toFixed(6) + '&deg;' +
                '</div>';
            rectangle.bindPopup(popupContent);

            this.map.fitBounds(bounds, {
                padding: [30, 30],
                maxZoom: 12
            });
        },
        destroyMap: function() {
            if (this.map) {
                this.map.remove();
                this.map = null;
            }
            var mapContainer = document.getElementById(this.mapContainerId);
            if (mapContainer && mapContainer._leaflet_id) {
                delete mapContainer._leaflet_id;
            }
        },
        openPreview: function(image, index) {
            this.previewImage = image;
            this.previewIndex = index;
            this.previewDialog = true;
            document.addEventListener('keydown', this.handleKeydown);
        },
        closePreview: function() {
            this.previewDialog = false;
            this.previewImage = null;
            document.removeEventListener('keydown', this.handleKeydown);
        },
        handleKeydown: function(e) {
            if (!this.previewDialog) return;
            if (e.key === 'ArrowLeft') {
                this.prevImage();
            } else if (e.key === 'ArrowRight') {
                this.nextImage();
            } else if (e.key === 'Escape') {
                this.closePreview();
            }
        },
        prevImage: function() {
            if (this.previewIndex > 0) {
                this.previewIndex--;
                this.previewImage = this.ExternalResourcesImages[this.previewIndex];
            }
        },
        nextImage: function() {
            if (this.previewIndex < this.ExternalResourcesImages.length - 1) {
                this.previewIndex++;
                this.previewImage = this.ExternalResourcesImages[this.previewIndex];
            }
        },
        navigateToUpload: function() {
            router.push('/external-resources/create');
        },
        editImage: function(image) {
            router.push('/external-resources/' + image.id);
        },
        deleteImage: function(image) {
            if (!confirm(this.tl('confirm_delete', 'Are you sure you want to delete this item?'))) {
                return;
            }

            var vm = this;
            var url = CI.base_url + '/api/resources/delete/' + this.ProjectID + '/' + image.id;

            axios.post(url)
                .then(function(response) {
                    vm.closePreview();
                    vm.$store.dispatch('loadExternalResources', {dataset_id: vm.ProjectID});
                })
                .catch(function(error) {
                    alert(vm.tl('failed_operation', 'Operation failed') + ': ' + (error.response && error.response.data ? error.response.data.message : error.message));
                });
        }
    },
    template: `
            <div class="geospatial-gallery-component mt-5 p-5" style="height:100%;">

            <!-- Geographic Extent / Bounding Box Map -->
            <div v-if="ProjectType=='geospatial'" class="mb-6">
                <h2 class="mb-3">{{ tl('geographic_extent', 'Geographic Extent') }}</h2>

                <v-card v-if="hasBoundingBox" outlined>
                    <v-card-text class="pa-0">
                        <div :id="mapContainerId" style="height: 350px; width: 100%; z-index: 0;"></div>
                    </v-card-text>
                    <v-card-text>
                        <v-simple-table dense>
                            <template v-slot:default>
                                <thead>
                                    <tr>
                                        <th>{{ tl('direction', 'Direction') }}</th>
                                        <th>{{ tl('coordinate', 'Coordinate') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><v-icon small class="mr-1">mdi-arrow-up</v-icon>{{ tl('north', 'North') }}</td>
                                        <td>{{ boundingBoxData.north.toFixed(6) }}&deg;</td>
                                    </tr>
                                    <tr>
                                        <td><v-icon small class="mr-1">mdi-arrow-down</v-icon>{{ tl('south', 'South') }}</td>
                                        <td>{{ boundingBoxData.south.toFixed(6) }}&deg;</td>
                                    </tr>
                                    <tr>
                                        <td><v-icon small class="mr-1">mdi-arrow-right</v-icon>{{ tl('east', 'East') }}</td>
                                        <td>{{ boundingBoxData.east.toFixed(6) }}&deg;</td>
                                    </tr>
                                    <tr>
                                        <td><v-icon small class="mr-1">mdi-arrow-left</v-icon>{{ tl('west', 'West') }}</td>
                                        <td>{{ boundingBoxData.west.toFixed(6) }}&deg;</td>
                                    </tr>
                                </tbody>
                            </template>
                        </v-simple-table>
                    </v-card-text>
                </v-card>

                <v-card v-else outlined>
                    <v-card-text class="text-center pa-6">
                        <v-icon large color="grey lighten-1" class="mb-2">mdi-map-marker-off</v-icon>
                        <div class="text--secondary">{{ tl('no_bounding_box', 'No bounding box coordinates defined for this project.') }}</div>
                    </v-card-text>
                </v-card>
            </div>

            <!-- Image Gallery -->
            <div v-if="ProjectType=='geospatial'">
                <div class="d-flex align-center mb-3">
                    <h2 class="mr-2">{{ tl('image_gallery', 'Image Gallery') }}</h2>
                    <v-chip small color="primary" v-if="ExternalResourcesImages.length > 0">{{ ExternalResourcesImages.length }}</v-chip>
                    <v-spacer></v-spacer>
                    <v-btn v-if="isProjectEditable" color="primary" outlined small @click="navigateToUpload">
                        <v-icon small left>mdi-upload</v-icon> {{ tl('upload_image', 'Upload Image') }}
                    </v-btn>
                </div>

                <!-- Gallery grid -->
                <v-row v-if="ExternalResourcesImages.length > 0">
                    <v-col v-for="(image, index) in ExternalResourcesImages" :key="image.id" cols="12" sm="6" md="4" lg="3">
                        <v-card class="gallery-image-card" outlined hover @click="openPreview(image, index)" style="cursor:pointer;">
                            <v-img :src="image.src" height="180" class="grey lighten-3" contain>
                                <template v-slot:placeholder>
                                    <v-row class="fill-height ma-0" align="center" justify="center">
                                        <v-progress-circular indeterminate color="grey lighten-2"></v-progress-circular>
                                    </v-row>
                                </template>
                            </v-img>
                            <v-card-text v-if="image.title || image.description" class="pa-2">
                                <div v-if="image.title" class="subtitle-2 text-truncate">{{ image.title }}</div>
                                <div v-if="image.description" class="caption text--secondary text-truncate">{{ image.description }}</div>
                            </v-card-text>
                            <v-card-actions v-if="isProjectEditable" class="pa-1">
                                <v-spacer></v-spacer>
                                <v-btn icon x-small @click.stop="editImage(image)" :title="tl('edit', 'Edit')">
                                    <v-icon small>mdi-pencil</v-icon>
                                </v-btn>
                                <v-btn icon x-small color="error" @click.stop="deleteImage(image)" :title="tl('delete', 'Delete')">
                                    <v-icon small>mdi-delete</v-icon>
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Empty gallery state -->
                <v-card v-else outlined>
                    <v-card-text class="text-center pa-6">
                        <v-icon large color="grey lighten-1" class="mb-2">mdi-image-off</v-icon>
                        <div class="text--secondary mb-3">{{ tl('no_images', 'No images available for this project.') }}</div>
                        <v-btn v-if="isProjectEditable" color="primary" outlined small @click="navigateToUpload">
                            <v-icon small left>mdi-upload</v-icon> {{ tl('upload_image', 'Upload Image') }}
                        </v-btn>
                    </v-card-text>
                </v-card>

                <!-- Lightbox preview dialog -->
                <v-dialog v-model="previewDialog" max-width="900" @click:outside="closePreview">
                    <v-card v-if="previewImage" dark>
                        <v-toolbar dense flat color="transparent">
                            <v-toolbar-title class="subtitle-1">{{ previewImage.title || previewImage.filename }}</v-toolbar-title>
                            <v-spacer></v-spacer>
                            <span class="caption mr-2">{{ previewIndex + 1 }} / {{ ExternalResourcesImages.length }}</span>
                            <v-btn icon small @click="closePreview">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </v-toolbar>
                        <v-card-text class="pa-0 text-center" style="min-height:400px; display:flex; align-items:center; justify-content:center; position:relative;">
                            <v-btn v-if="previewIndex > 0" icon large style="position:absolute; left:8px; z-index:1;" @click="prevImage">
                                <v-icon large>mdi-chevron-left</v-icon>
                            </v-btn>
                            <v-img :src="previewImage.src" max-height="500" contain class="mx-auto">
                                <template v-slot:placeholder>
                                    <v-row class="fill-height ma-0" align="center" justify="center">
                                        <v-progress-circular indeterminate color="white"></v-progress-circular>
                                    </v-row>
                                </template>
                            </v-img>
                            <v-btn v-if="previewIndex < ExternalResourcesImages.length - 1" icon large style="position:absolute; right:8px; z-index:1;" @click="nextImage">
                                <v-icon large>mdi-chevron-right</v-icon>
                            </v-btn>
                        </v-card-text>
                        <v-card-text v-if="previewImage.description" class="caption text-center">
                            {{ previewImage.description }}
                        </v-card-text>
                    </v-card>
                </v-dialog>
            </div>

            </div>
            `    
});

