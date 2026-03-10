<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Static Template</title>
  </head>
  <body>
  <?php echo $this->load->view('user_menu/user-menu',null,true);?>
    <div id="app">
      <h1>{{msg}}</h1>

      <div><input type="text" v-model="email"/>
      </div>
      <div><input type="password" v-model="password"/></div>
      <button type="button" @click="login">Login</button>

    </div>

    <script src="<?php echo base_url(); ?>vue-app/assets/vue.compat.global.prod.js"></script>
    <script src="<?php echo base_url(); ?>javascript/axios.min.js"></script>
    <script>
        var CI = {
      'base_url': '<?php echo site_url(); ?>'
    };
        var vueApp = Vue.createApp({
        data() { return {
            msg: "Vuejs Example with CDN",
            email:'',
            password:''
        },
        methods:{
            login: function() {
                vm = this;
                let url = CI.base_url + '/auth/login?isajax=1';

                formData =new FormData();
                formData.append('email',this.email);
                formData.append('password',this.password);

                axios.post(url,
                    formData, {
                        /*headers: {
                            'Content-Type': 'multipart/form-data'
                        }*/
                    }
                    ).then(function(response) {
                        console.log("response",response);
                        alert("Your changes have been saved!");
                    })
                    .catch(function(response) {
                        vm.errors = response;
                        alert("Failed to save", response);
                    });
            },
        }
        });
        vueApp.mount('#app');
    </script>
  </body>
</html>
