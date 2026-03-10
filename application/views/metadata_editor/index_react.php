<!DOCTYPE html>
<html>
<head>
  <link rel="icon" href="<?php echo base_url();?>favicon.ico">
  <link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900" rel="stylesheet">
  <link href="<?php echo base_url();?>vue-app/assets/mdi.min.css" rel="stylesheet">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui">
  <title>Metadata Editor (React)</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Roboto', sans-serif; }
    #root { min-height: 100vh; }
  </style>
</head>

<?php
  // Same template processing as index_vuetify.php
  $template_parts = array();

  function get_template_part_react($items, &$output) {
    foreach ($items as $item) {
      if (isset($item['items'])) {
        get_template_part_react($item['items'], $output);
      }
      if (isset($item['key'])) {
        $output[$item['key']] = $item;
      }
    }
  }

  get_template_part_react($metadata_template_arr['items'], $template_parts);
?>

<body>

  <?php
    $user = $this->session->userdata('username');
    $user_info = [
      'username' => $user,
      'is_logged_in' => !empty($user),
      'is_admin' => $this->ion_auth->is_admin(),
    ];
  ?>

  <!-- Inject server-side data via script block (same pattern as index_vuetify.php lines 72-82) -->
  <script>
    var CI = {
      'site_url': '<?php echo site_url();?>',
      'base_url': '<?php echo site_url();?>',
      'base_asset_url': '<?php echo base_url();?>',
      'user_info': <?php echo json_encode($user_info); ?>
    };

    // Project data
    var sid = '<?php echo $sid;?>';
    var form_template = <?php echo $metadata_template;?>;
    var form_template_parts = <?php echo json_encode($template_parts, JSON_PRETTY_PRINT); ?>;

    // Project metadata and settings
    var project_metadata = {};
    var project_sid = <?php echo (int)$sid; ?>;
    var project_idno = <?php echo json_encode(isset($idno) ? $idno : ''); ?>;
    var project_type = <?php echo json_encode(isset($type) ? $type : ''); ?>;
    var user_has_edit_access = <?php echo (isset($user_has_edit_access) && $user_has_edit_access) ? 'true' : 'false'; ?>;

    // Translations
    var translation_messages = {
      default: <?php echo json_encode(isset($translations) ? $translations : new stdClass(), JSON_HEX_APOS); ?>
    };
  </script>

  <!-- React app mount point -->
  <div id="root"></div>

  <!-- Vite-built React app bundle -->
  <script type="module" src="<?php echo base_url(); ?>react-app/dist/app.js"></script>
  <link rel="stylesheet" href="<?php echo base_url(); ?>react-app/dist/app.css">

</body>
</html>
