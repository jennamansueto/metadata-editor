<!DOCTYPE html>
<html>

<head>
  <link rel="icon" href="<?php echo base_url();?>favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui">
  <meta charset="UTF-8" />
  <title>Schemas - Metadata Editor</title>

  <?php
    // Load React build assets
    $react_assets_path = FCPATH . 'vue-app/react-assets/';
    $react_assets_url = base_url() . 'vue-app/react-assets/';

    // Find CSS and JS files from Vite build manifest or directory listing
    $css_files = glob($react_assets_path . 'assets/*.css');
    $js_files = glob($react_assets_path . 'assets/*.js');

    if ($css_files) {
      foreach ($css_files as $css_file) {
        $filename = basename($css_file);
        echo '<link rel="stylesheet" href="' . $react_assets_url . 'assets/' . $filename . '">' . "\n";
      }
    }
  ?>
</head>

<body class="layout-top-nav">

<?php
  $user = $this->session->userdata('username');
  $this->load->library('Editor_acl');

  $has_schema_permission = false;
  try {
    $has_schema_permission = $this->editor_acl->has_access('schema', 'view');
  } catch (Exception $e) {
    $has_schema_permission = false;
  }

  $user_info = [
    'username' => $user,
    'is_logged_in' => !empty($user),
    'is_admin' => $this->ion_auth->is_admin(),
    'has_schema_permission' => $has_schema_permission,
  ];
?>

  <script>
    var CI = {
      'site_url': '<?php echo site_url(); ?>',
      'base_url': '<?php echo base_url(); ?>',
      'user_info': <?php echo json_encode($user_info); ?>
    };

    var NADA_TRANSLATIONS_BASE64 = '<?php echo base64_encode(json_encode(isset($translations) ? $translations : array(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); ?>';
  </script>

  <div id="root"></div>

  <?php
    if ($js_files) {
      foreach ($js_files as $js_file) {
        $filename = basename($js_file);
        echo '<script type="module" src="' . $react_assets_url . 'assets/' . $filename . '"></script>' . "\n";
      }
    }
  ?>

</body>
</html>
