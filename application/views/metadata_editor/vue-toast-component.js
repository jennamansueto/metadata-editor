window.AppComponents = window.AppComponents || {};
window.AppComponents['v-toast'] = {
    props: [],
    data() {
        return {
            snackbar: false,
            text: ``,
            isSuccess:true
        }
    },
    mounted:function(){        
        let vm=this;
        EventBus.on('onSuccess', function(data) {
            vm.text=data;
            vm.snackbar=true;
            isSuccess=true;
          });

          EventBus.on('onFail', function(data) {
            vm.text=data;
            vm.snackbar=true;
            isSuccess=false;
          });
    },
    methods: {       
                
    },
    computed: {        
    },
    template: `
        <div>
            <template>
                <div class="text-center ma-2">
                    
                    <v-snackbar right timeout="1000" 
                    v-model="snackbar"
                    >
                    {{ text }}

                    <template v-slot:actions>
                        <v-btn                        
                        variant="text"
                        @click="snackbar = false"
                        >
                        Close
                        </v-btn>
                    </template>
                    </v-snackbar>
                </div>
            </template>

        </div>
    `
});

