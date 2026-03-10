<!DOCTYPE html >
<html>
<head>
  <link rel="icon" href="<?php echo base_url();?>favicon.ico">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
  <link href="<?php echo base_url();?>vue-app/assets/mdi.min.css" rel="stylesheet">
  <link href="<?php echo base_url();?>vue-app/assets/vuetify.min.css" rel="stylesheet">
  <link href="<?php echo base_url();?>vue-app/assets/bootstrap.min.css" rel="stylesheet" >
  <script src="<?php echo base_url();?>vue-app/assets/jquery.min.js"></script>
  <script src="<?php echo base_url();?>vue-app/assets/popper.min.js"></script>
  <script src="<?php echo base_url();?>vue-app/assets/bootstrap.bundle.min.js"></script>
  
  <link href="<?php echo base_url();?>vue-app/assets/splitpanes.css" rel="stylesheet">
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="<?php echo base_url();?>vue-app/assets/leaflet.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui">
  <style>[v-cloak]{display:none !important;}</style>
</head>

<?php
  //break template into smaller templates by spliting template ['items']
  $template_parts=array();
  
  //update template_parts
  //get_template_part($metadata_template_arr['items'],$template_parts);

  function get_template_part($items,&$output)
  {
    foreach($items as $item){
      if (isset($item['items'])){
        get_template_part($item['items'],$output);
      }
      if (isset($item['key'])){
        $output[$item['key']]=$item;
      }
    }
  } 
  
  
  get_template_keys($metadata_template_arr['items'],$template_keys);
  function get_template_keys($items,&$output)
  {
    foreach($items as $item){
      if (isset($item['items'])){
        get_template_keys($item['items'],$output);
      }
      if (!isset($item['type'])){
        $item['type']='string';
      }
      if (isset($item['key']) && $item['type']!='section' ){
        $output[]=$item['key'];
      }
    }        
  }
  
?>

<body class="hold-transition sidebar-mini layout-fixed">


  <?php
      $user=$this->session->userdata('username');

      $user_info=[
        'username'=> $user,
        'is_logged_in'=> !empty($user),
        'is_admin'=> $this->ion_auth->is_admin(),
      ];
      
    ?>

    <script>
        var CI = {
          'site_url': '<?php echo site_url();?>',
          'base_url': '<?php echo site_url();?>',
          'base_asset_url': '<?php echo base_url();?>',
          'user_info': <?php echo json_encode($user_info); ?>
        }; 
        let sid='<?php echo $sid;?>';
        let form_template=<?php echo $metadata_template;?>;
        let form_template_parts= <?php echo json_encode($template_parts,JSON_PRETTY_PRINT); ?>;
    </script>

  <div id="app" data-app>
    <?php echo $this->load->view("metadata_editor/layout.php",null,true); ?>
  </div>

  <script src="<?php echo base_url();?>vue-app/assets/vue.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/vue-router.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/vuex.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/axios.min.js"></script>
  <script src="<?php echo base_url();?>vue-app/assets/vuetify.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/session_channel.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/global-session-handler.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/global-login-plugin.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/lodash.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/vue-deepset.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/ajv.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/deepdash.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/moment-with-locales.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/vue-i18n.js"></script>
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/css/all.min.css" crossorigin="anonymous" />   
    
  <script src="<?php echo base_url(); ?>vue-app/assets/vue-scrollto.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/vee-validate.full.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/splitpanes.umd.min.js"></script>
    
  <script src="<?php echo base_url(); ?>vue-app/assets/sortable.min.js"></script>
  <script src="<?php echo base_url(); ?>vue-app/assets/vuedraggable.umd.min.js"></script>

  <script src="<?php echo base_url(); ?>vue-app/assets/vue-json-pretty.min.js"></script>
  <link rel="stylesheet" href="<?php echo base_url(); ?>vue-app/assets/vue-json-pretty.min.css">
  <!-- Leaflet JS -->
  <script src="<?php echo base_url();?>vue-app/assets/leaflet.js"></script>
  <!-- Chart.js for data visualization -->
  <script src="<?php echo base_url();?>vue-app/assets/chart.min.js"></script>
  <link href="<?php echo base_url();?>vue-app/assets/styles.css" rel="stylesheet">



  <?php echo $this->load->view("metadata_editor/index_vuetify_main_app",null,true);?>

  <script>
    
    const translation_messages = {
      default: <?php echo json_encode($translations,JSON_HEX_APOS);?>
    }

    const i18n = new VueI18n({
      locale: 'default',
      messages: translation_messages,
      //show warnings in console
      silentTranslationWarn: false
    })

  </script>

  <script src="<?php echo base_url();?>vue-app/assets/dist/metadata-editor.js"></script>

  <script>
    function resize_variable_list(){
        $(".variable-list-component").height($(".pane-main-content").height()-45)
      }

    $(document).ready(function(){
      jQuery(window).resize(function() {
        resize_variable_list();
      });

      resize_variable_list();
    });
  </script>

  <?php $this->load->view('common/analytics'); ?>
</body>
</html>
