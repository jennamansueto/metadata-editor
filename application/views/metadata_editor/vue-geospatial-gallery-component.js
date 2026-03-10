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
            _isDestroyed: false,
            _mapInitRetries: 0
        }
    },
    created: async function(){
    },
    mounted: function() {
        this.$nextTick(() => {
            if (this.hasBoundingBox) {
                setTimeout(() => {
                    this.initializeMap();
                }, 300);
            }
        });
    },
    beforeDestroy: function() {
        this._isDestroyed = true;
        this.destroyMap();
    },
    watch: {
        hasBoundingBox: function(newVal) {
            if (newVal) {
                this._mapInitRetries = 0;
                this.$nextTick(() => {
                    setTimeout(() => {
                        this.initializeMap();
                    }, 300);
                });
            } else {
                this.destroyMap();
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
            let images=[];
            let base_url=CI.base_url;
            for (let i=0;i<this.ExternalResources.length;i++){
                let resource=this.ExternalResources[i];

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

            // Navigate to the geographic extent in project metadata
            var geoElements = _.get(this.ProjectMetadata, 
                'description.identificationInfo.extent.geographicElement');
            
            if (!geoElements || !Array.isArray(geoElements) || geoElements.length === 0) {
                return null;
            }

            // Find the first element with a valid bounding box
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
        initializeMap: function() {
            if (this._isDestroyed) return;
            if (!this.hasBoundingBox) return;

            var mapContainer = document.getElementById(this.mapContainerId);
            if (!mapContainer) {
                if (this._mapInitRetries < 10) {
                    this._mapInitRetries++;
                    setTimeout(() => this.initializeMap(), 100);
                }
                return;
            }

            if (this.map) {
                this.map.invalidateSize();
                return;
            }

            if (typeof L === 'undefined') {
                if (this._mapInitRetries < 10) {
                    this._mapInitRetries++;
                    setTimeout(() => this.initializeMap(), 200);
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

            // Add bounding box rectangle
            var rectangle = L.rectangle(bounds, {
                color: '#ff7800',
                weight: 2,
                fillColor: '#ff7800',
                fillOpacity: 0.2
            }).addTo(this.map);

            // Add popup with bounding box info
            var popupContent = '<div>' +
                '<strong>' + (this.$t('geographic_bounding_box') || 'Geographic Bounding Box') + '</strong><br>' +
                (this.$t('north') || 'North') + ': ' + bbox.north.toFixed(6) + '&deg;<br>' +
                (this.$t('south') || 'South') + ': ' + bbox.south.toFixed(6) + '&deg;<br>' +
                (this.$t('east') || 'East') + ': ' + bbox.east.toFixed(6) + '&deg;<br>' +
                (this.$t('west') || 'West') + ': ' + bbox.west.toFixed(6) + '&deg;' +
                '</div>';
            rectangle.bindPopup(popupContent);

            // Fit map to bounding box with padding
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
        },
        closePreview: function() {
            this.previewDialog = false;
            this.previewImage = null;
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
            if (!confirm(this.$t('confirm_delete') || 'Are you sure you want to delete this item?')) {
                return;
            }

            var vm = this;
            var url = CI.base_url + '/api/resources/delete/' + this.ProjectID + '/' + image.id;

            axios.post(url)
                .then(function(response) {
                    vm.$store.dispatch('loadExternalResources', {dataset_id: vm.ProjectID});
                })
                .catch(function(error) {
                    console.error('Error deleting image:', error);
                    alert(vm.$t('failed_operation') || 'Operation failed');
                });
        }
    },
    template: `
        <div class="geospatial-gallery-component mt-5 p-5" style="height:100%;">

            <!-- Bounding Box Map Section -->
            <div v-if="ProjectType=='geospatial'" class="mb-6">
                <v-card v-if="hasBoundingBox" outlined class="mb-4">
                    <v-card-title>
                        <v-icon class="mr-2">mdi-map</v-icon>
                        {{$t('geographic_extent') || 'Geographic Extent'}}
                    </v-card-title>
                    <v-card-text>
                        <div 
                            :id="mapContainerId" 
                            style="height: 400px; width: 100%; border: 1px solid #ddd; border-radius: 4px; background-color: #f0f0f0; position: relative;"
                        >
                            <div v-if="!map" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #666;">
                                <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
                                <div class="mt-2">{{$t('loading_map') || 'Loading map...'}}</div>
                            </div>
                        </div>
                        
                        <!-- Bounding Box Coordinates Table -->
                        <div class="mt-4" v-if="boundingBoxData">
                            <v-simple-table dense>
                                <template v-slot:default>
                                    <thead>
                                        <tr>
                                            <th>{{$t('direction') || 'Direction'}}</th>
                                            <th>{{$t('coordinate') || 'Coordinate'}}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="font-weight-medium">
                                                <v-icon small class="mr-1">mdi-arrow-up</v-icon>
                                                {{$t('north_latitude') || 'North Latitude'}}
                                            </td>
                                            <td>{{boundingBoxData.north.toFixed(6)}}&deg;</td>
                                        </tr>
                                        <tr>
                                            <td class="font-weight-medium">
                                                <v-icon small class="mr-1">mdi-arrow-down</v-icon>
                                                {{$t('south_latitude') || 'South Latitude'}}
                                            </td>
                                            <td>{{boundingBoxData.south.toFixed(6)}}&deg;</td>
                                        </tr>
                                        <tr>
                                            <td class="font-weight-medium">
                                                <v-icon small class="mr-1">mdi-arrow-right</v-icon>
                                                {{$t('east_longitude') || 'East Longitude'}}
                                            </td>
                                            <td>{{boundingBoxData.east.toFixed(6)}}&deg;</td>
                                        </tr>
                                        <tr>
                                            <td class="font-weight-medium">
                                                <v-icon small class="mr-1">mdi-arrow-left</v-icon>
                                                {{$t('west_longitude') || 'West Longitude'}}
                                            </td>
                                            <td>{{boundingBoxData.west.toFixed(6)}}&deg;</td>
                                        </tr>
                                    </tbody>
                                </template>
                            </v-simple-table>
                        </div>
                    </v-card-text>
                </v-card>

                <v-card v-else outlined class="mb-4">
                    <v-card-text class="text-center py-6">
                        <v-icon size="48" color="grey lighten-1">mdi-map-marker-off</v-icon>
                        <div class="text-body-1 mt-2 grey--text">
                            {{$t('no_bounding_box') || 'No bounding box coordinates defined for this project.'}}
                        </div>
                        <div class="text-body-2 grey--text text--lighten-1 mt-1">
                            {{$t('bounding_box_hint') || 'Set bounding box coordinates in the Geographic Extent section of the metadata form.'}}
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <!-- Image Gallery Section -->
            <div v-if="ProjectType=='geospatial'">
                <v-card outlined>
                    <v-card-title class="d-flex justify-space-between align-center">
                        <div>
                            <v-icon class="mr-2">mdi-image-multiple</v-icon>
                            {{$t('image_gallery') || 'Image Gallery'}}
                            <v-chip small color="primary" class="ml-2" v-if="ExternalResourcesImages.length > 0">
                                {{ExternalResourcesImages.length}}
                            </v-chip>
                        </div>
                        <v-btn 
                            v-if="isProjectEditable"
                            color="primary" 
                            outlined 
                            small 
                            @click="navigateToUpload"
                        >
                            <v-icon left small>mdi-upload</v-icon>
                            {{$t('upload_image') || 'Upload Image'}}
                        </v-btn>
                    </v-card-title>

                    <v-card-text>
                        <!-- Image Grid -->
                        <div v-if="ExternalResourcesImages.length > 0">
                            <v-row>
                                <v-col 
                                    v-for="(image, index) in ExternalResourcesImages" 
                                    :key="image.id"
                                    cols="12" sm="6" md="4" lg="3"
                                >
                                    <v-card outlined hover class="gallery-image-card" style="height: 100%;">
                                        <div 
                                            class="gallery-image-wrapper"
                                            style="position: relative; padding-top: 75%; overflow: hidden; cursor: pointer; background-color: #f5f5f5;"
                                            @click="openPreview(image, index)"
                                        >
                                            <img 
                                                :src="image.src" 
                                                :alt="image.title || 'Gallery image'"
                                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                                                loading="lazy"
                                            />
                                            <div 
                                                class="gallery-image-overlay"
                                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0); transition: background 0.2s;"
                                            >
                                                <v-icon 
                                                    color="white" 
                                                    size="36"
                                                    style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0; transition: opacity 0.2s;"
                                                    class="gallery-zoom-icon"
                                                >mdi-magnify-plus</v-icon>
                                            </div>
                                        </div>
                                        <v-card-text class="pa-2">
                                            <div class="text-subtitle-2 text-truncate" :title="image.title">
                                                {{image.title || $t('untitled') || 'Untitled'}}
                                            </div>
                                            <div v-if="image.description" class="text-caption grey--text text-truncate" :title="image.description">
                                                {{image.description}}
                                            </div>
                                        </v-card-text>
                                        <v-card-actions v-if="isProjectEditable" class="pa-2 pt-0">
                                            <v-btn x-small text color="primary" @click.stop="editImage(image)">
                                                <v-icon x-small left>mdi-pencil</v-icon>
                                                {{$t('edit') || 'Edit'}}
                                            </v-btn>
                                            <v-spacer></v-spacer>
                                            <v-btn x-small text color="error" @click.stop="deleteImage(image)">
                                                <v-icon x-small left>mdi-delete</v-icon>
                                                {{$t('delete') || 'Delete'}}
                                            </v-btn>
                                        </v-card-actions>
                                    </v-card>
                                </v-col>
                            </v-row>
                        </div>

                        <!-- Empty State -->
                        <div v-else class="text-center py-8">
                            <v-icon size="64" color="grey lighten-1">mdi-image-off</v-icon>
                            <div class="text-h6 mt-4 grey--text">
                                {{$t('no_images') || 'No images in gallery'}}
                            </div>
                            <div class="text-body-2 grey--text text--lighten-1 mt-1">
                                {{$t('no_images_hint') || 'Upload images by creating external resources with type "Photo [pic]".'}}
                            </div>
                            <v-btn 
                                v-if="isProjectEditable"
                                color="primary" 
                                outlined 
                                class="mt-4"
                                @click="navigateToUpload"
                            >
                                <v-icon left>mdi-upload</v-icon>
                                {{$t('upload_first_image') || 'Upload First Image'}}
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </div>

            <!-- Image Preview Dialog (Lightbox) -->
            <v-dialog v-model="previewDialog" max-width="900px" @keydown.left="prevImage" @keydown.right="nextImage">
                <v-card v-if="previewImage" style="background-color: #1e1e1e;">
                    <v-card-title class="d-flex justify-space-between align-center white--text py-2">
                        <div class="text-truncate" style="max-width: 70%;">
                            {{previewImage.title || $t('image_preview') || 'Image Preview'}}
                        </div>
                        <div>
                            <v-btn icon dark small @click="prevImage" :disabled="previewIndex === 0" class="mr-1">
                                <v-icon>mdi-chevron-left</v-icon>
                            </v-btn>
                            <span class="white--text text-body-2">
                                {{previewIndex + 1}} / {{ExternalResourcesImages.length}}
                            </span>
                            <v-btn icon dark small @click="nextImage" :disabled="previewIndex >= ExternalResourcesImages.length - 1" class="ml-1">
                                <v-icon>mdi-chevron-right</v-icon>
                            </v-btn>
                            <v-btn icon dark small @click="closePreview" class="ml-2">
                                <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </div>
                    </v-card-title>
                    <v-card-text class="pa-0 text-center" style="background-color: #2d2d2d;">
                        <img 
                            :src="previewImage.src" 
                            :alt="previewImage.title"
                            style="max-width: 100%; max-height: 70vh; object-fit: contain;"
                        />
                    </v-card-text>
                    <v-card-text v-if="previewImage.description" class="white--text pt-2 pb-2">
                        <div class="text-body-2">{{previewImage.description}}</div>
                    </v-card-text>
                    <v-card-actions class="py-1" style="background-color: #1e1e1e;" v-if="isProjectEditable">
                        <v-spacer></v-spacer>
                        <v-btn small text dark @click="editImage(previewImage)">
                            <v-icon small left>mdi-pencil</v-icon>
                            {{$t('edit') || 'Edit'}}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <style>
                .gallery-image-card:hover .gallery-zoom-icon {
                    opacity: 1 !important;
                }
                .gallery-image-card:hover .gallery-image-overlay {
                    background: rgba(0,0,0,0.3) !important;
                }
            </style>

        </div>
    `    
});

