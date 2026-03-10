Vue.component('v-toast', {
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
        this._onSuccess = function(data) {
            vm.text=data;
            vm.snackbar=true;
            isSuccess=true;
        };
        this._onFail = function(data) {
            vm.text=data;
            vm.snackbar=true;
            isSuccess=false;
        };
        EventBus.on('onSuccess', this._onSuccess);
        EventBus.on('onFail', this._onFail);
    },
    beforeUnmount:function(){
        EventBus.off('onSuccess', this._onSuccess);
        EventBus.off('onFail', this._onFail);
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

                    <template v-slot:action="{ attrs }">
                        <v-btn                        
                        text
                        v-bind="attrs"
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

