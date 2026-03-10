<?php
defined('BASEPATH') OR exit('No direct script access allowed');


require(APPPATH.'/libraries/MY_REST_Controller.php');

use JsonSchema\Validator;
use JsonSchema\Constraints\Constraint;

class Validation extends MY_REST_Controller
{
    private $api_user;

    function __construct()
    {
        parent::__construct();
        $this->load->model('Editor_model');
        $this->load->model('Metadata_schemas_model');
        $this->load->library('editor_acl');
        $this->is_authenticated_or_die();
        $this->api_user = $this->api_user();
    }
    
    function _auth_override_check()
    {
        if ($this->session->userdata('user_id')){
            return true;
        }
        return parent::_auth_override_check();
    }

    /**
     * Get schema validation report for a project
     * 
     * @param int $sid Project ID
     */
    function schema_get($sid=null)
    {
        try{
            $sid = $this->get_sid($sid);
            $project = $this->Editor_model->get_row($sid);

            if (!$project){
                throw new Exception("project not found");
            }

            $this->editor_acl->user_has_project_access($sid, $permission='view');

            $metadata = $project['metadata'];
            $type = $project['type'];
            
            // Resolve canonical type
            $canonical_type = $type;
            try {
                $schema_row = $this->Metadata_schemas_model->get_by_uid($type);
                if ($schema_row && isset($schema_row['uid']) && $schema_row['uid']) {
                    $canonical_type = $schema_row['uid'];
                }
            } catch(Exception $e) {
                // If schema registry lookup fails, use original type
            }

            $result = array(
                'schema_uid' => $canonical_type,
                'valid' => false,
                'type' => $type,
                'issues' => array()
            );

            // Get schema file path using schema registry (handles aliases and custom schemas)
            try {
                $schema_file = $this->Metadata_schemas_model->get_schema_file_path($type);
            } catch(Exception $e) {
                $result['error'] = "Schema file not found for type: $type - " . $e->getMessage();
                $response = array(
                    'status' => 'success',
                    'result' => $result
                );
                $this->set_response($response, REST_Controller::HTTP_OK);
                return;
            }

            // Use validation library
            $this->load->library('Project_validation');
            
            // Load compiled schema for PHP-specific checks
            $schema = $this->Metadata_schemas_model->get_by_uid($canonical_type);
            $compiled_schema = null;
            
            if ($schema) {
                $schema_dir = $this->Metadata_schemas_model->resolve_schema_path($schema);
                if (is_dir($schema_dir)) {
                    $this->load->library('Schema_registry');
                    $actual_filename = basename($schema_file);
                    $schema_for_loading = $schema;
                    $schema_for_loading['filename'] = $actual_filename;
                    $documents = $this->schema_registry->load_schema_documents($schema_for_loading, $schema_dir);
                    $compiled_schema = $this->schema_registry->inline_schema($actual_filename, $documents, $schema_dir);
                }
            }
            
            // Validate using library
            $validation_result = $this->project_validation->validate_schema($metadata, $type, $schema_file, $compiled_schema);
            
            $result = array_merge($result, $validation_result);

            $response = array(
                'status' => 'success',
                'validation' => $result
            );

            $this->set_response($response, REST_Controller::HTTP_OK);
        }
        catch(Exception $e){
            $error_output = array(
                'status' => 'failed',
                'message' => $e->getMessage()
            );
            $this->set_response($error_output, REST_Controller::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Get variables validation report for a project
     * 
     * @param int $sid Project ID
     */
    function variables_get($sid=null)
    {
        try{
            $sid = $this->get_sid($sid);
            $project = $this->Editor_model->get_row($sid);

            if (!$project){
                throw new Exception("project not found");
            }

            $this->editor_acl->user_has_project_access($sid, $permission='view');

            $type = $project['type'];
            
            // Only validate variables for microdata/survey projects
            if ($type !== 'microdata' && $type !== 'survey') {
                throw new Exception("Variables validation is only available for microdata projects");
            }

            // Get limit parameter (default to 50, max 1000)
            $limit = $this->get('limit');
            $limit = $limit ? min((int)$limit, 1000) : 50;

            $mode = $this->get('mode');
            if ($mode === 'light') {
                // Fast SQL-only check: empty variable labels (no schema validation, no metadata decode)
                $result = $this->_variables_validation_light($sid, $limit);
                $response = array(
                    'status' => 'success',
                    'validation' => $result
                );
                $this->set_response($response, REST_Controller::HTTP_OK);
                return;
            }

            $result = array(
                'valid' => true,
                'issues' => array()
            );

            // Load variable model
            $this->load->model('Editor_variable_model');
            
            // Validate all variables (full schema validation)
            $issues = array();
            $validated_count = 0;
            
            foreach($this->Editor_variable_model->chunk_reader_generator($sid) as $variable) {
                // Stop if we've reached the limit
                if (count($issues) >= $limit) {
                    break;
                }
                
                // Get variable metadata (needed in catch blocks)
                $var_metadata = isset($variable['metadata']) ? $variable['metadata'] : array();
                $variable_fid = isset($variable['fid']) ? $variable['fid'] : 'unknown';
                $variable_name = isset($var_metadata['name']) ? $var_metadata['name'] : 'unknown';
                
                try {
                    // Remove empty values for validation
                    $var_metadata_clean = array_remove_empty($var_metadata);
                    
                    // Validate against variable schema
                    $this->Editor_variable_model->validate_schema($var_metadata_clean);
                    $validated_count++;
                }
                catch(ValidationException $e) {
                    $validation_errors = $e->GetValidationErrors();
                    
                    // Format errors for frontend
                    foreach($validation_errors as $error) {
                        $property = isset($error['property']) ? $error['property'] : '';
                        $path = 'variables/' . $variable_fid . ($property ? '/' . $property : '');
                        
                        $issues[] = array(
                            'type' => 'variable_validation_error',
                            'property' => $property,
                            'path' => $path,
                            'message' => isset($error['message']) ? $error['message'] : 'Validation error',
                            'variable_fid' => $variable_fid,
                            'variable_name' => $variable_name,
                            'variable_uid' => isset($variable['uid']) ? $variable['uid'] : null
                        );
                        
                        // Stop if we've reached the limit
                        if (count($issues) >= $limit) {
                            break 2; // Break out of both loops
                        }
                    }
                }
                catch(Exception $e) {
                    // Handle other exceptions
                    $issues[] = array(
                        'type' => 'variable_validation_error',
                        'property' => '',
                        'path' => 'variables/' . $variable_fid,
                        'message' => $e->getMessage(),
                        'variable_fid' => $variable_fid,
                        'variable_name' => $variable_name,
                        'variable_uid' => isset($variable['uid']) ? $variable['uid'] : null
                    );
                    
                    // Stop if we've reached the limit
                    if (count($issues) >= $limit) {
                        break;
                    }
                }
            }

            $result['valid'] = empty($issues);
            $result['issues'] = $issues;
            $result['validated_count'] = $validated_count;
            $result['total_issues'] = count($issues);
            if (count($issues) >= $limit) {
                $result['limit_reached'] = true;
            }

            $response = array(
                'status' => 'success',
                'validation' => $result
            );

            $this->set_response($response, REST_Controller::HTTP_OK);
        }
        catch(Exception $e){
            $error_output = array(
                'status' => 'failed',
                'message' => $e->getMessage()
            );
            $this->set_response($error_output, REST_Controller::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Light variables validation: SQL-only check for empty labels (no schema, no metadata decode).
     * Used when mode=light on the variables validation endpoint.
     *
     * @param int $sid Project ID
     * @param int $limit Max number of issues to return
     * @return array Same shape as variables_get result: valid, issues, validated_count, total_issues, limit_reached?
     */
    private function _variables_validation_light($sid, $limit)
    {
        $sid = (int) $sid;
        $this->db->select('uid, sid, fid, vid, name, labl');
        $this->db->from('editor_variables');
        $this->db->where('sid', $sid);
        $this->db->where('(labl IS NULL OR TRIM(COALESCE(labl,\'\')) = \'\')', null, false);
        $this->db->limit($limit);
        $this->db->order_by('uid', 'asc');
        $rows = $this->db->get()->result_array();

        $issues = array();
        foreach ($rows as $row) {
            $variable_fid = isset($row['fid']) ? $row['fid'] : 'unknown';
            $variable_name = isset($row['name']) ? $row['name'] : 'unknown';
            $issues[] = array(
                'type' => 'variable_validation_error',
                'property' => 'labl',
                'path' => 'variables/' . $variable_fid,
                'message' => 'The property labl is required',
                'variable_fid' => $variable_fid,
                'variable_name' => $variable_name,
                'variable_uid' => isset($row['uid']) ? $row['uid'] : null
            );
        }

        $result = array(
            'valid' => empty($issues),
            'issues' => $issues,
            'validated_count' => count($issues),
            'total_issues' => count($issues)
        );
        if (count($issues) >= $limit) {
            $result['limit_reached'] = true;
        }
        return $result;
    }

    /**
     * Get template validation report for a project
     * 
     * @param int $sid Project ID
     */
    function template_get($sid=null)
    {
        try{
            $sid = $this->get_sid($sid);
            $project = $this->Editor_model->get_row($sid);

            if (!$project){
                throw new Exception("project not found");
            }

            $this->editor_acl->user_has_project_access($sid, $permission='view');

            $metadata = $project['metadata'];
            $template_uid = isset($project['template_uid']) ? $project['template_uid'] : null;

            $result = array(
                'template_uid' => $template_uid,
                'valid' => false,
                'issues' => array(),
                'validation_report' => array()
            );

            if (!$template_uid){
                $result['error'] = "Project does not have a template assigned";
            } else {
                $this->load->model('Editor_template_model');
                $template = $this->Editor_template_model->get_template_by_uid($template_uid);

                if (!$template){
                    $result['error'] = "Template not found: $template_uid";
                } else {
                    // Get template items structure
                    $template_items = isset($template['template']) && is_array($template['template']) ? $template['template'] : array();
                    
                    if (empty($template_items)) {
                        $result['error'] = "Template has no items defined";
                    } else {
                        // Use validation library
                        $this->load->library('Project_validation');
                        $template_data = isset($template['template']) ? $template['template'] : array();
                        $validation_result = $this->project_validation->validate_template($metadata, $template_data);
                        $result = array_merge($result, $validation_result);
                    }
                }
            }

            $response = array(
                'status' => 'success',
                'validation' => $result
            );

            $this->set_response($response, REST_Controller::HTTP_OK);
        }
        catch(Exception $e){
            $error_output = array(
                'status' => 'failed',
                'message' => $e->getMessage()
            );
            $this->set_response($error_output, REST_Controller::HTTP_BAD_REQUEST);
        }
    }

    // All validation logic has been moved to Project_validation library
    // The following private methods have been removed as they are now in the library:
    // - map_frontend_to_backend_rules
    // - validate_template_items
    // - collect_template_keys
    // - find_template_extra_fields
    // - has_template_children
    // - find_extra_fields
    // - check_php_specific_issues
    // - validate_field_types (deprecated)
    // - get_schema_type
    // - is_type_allowed
    // - get_allowed_types_string
    // - is_object_with_numeric_keys
    // - convert_object_to_array
    // - is_type_mismatch_fixable
    // - convert_value_to_type
    // - map_php_to_schema_type
    // - resolve_schema_ref
    // - get_value_preview
    // - get_php_type
    // - get_value_by_path
    // - create_additional_key
    // - get_field_definition_for_issue
    //
    // Use $this->project_validation->method_name() to access these methods

    /**
     * Get extra fields detection report for a project
     * Finds fields in metadata that are not defined in the schema
     * 
     * @param int $sid Project ID
     */
    function extra_fields_get($sid=null)
    {
        try{
            $sid = $this->get_sid($sid);
            $project = $this->Editor_model->get_row($sid);

            if (!$project){
                throw new Exception("project not found");
            }

            $this->editor_acl->user_has_project_access($sid, $permission='view');

            $metadata = $project['metadata'];
            $type = $project['type'];
            
            // Resolve canonical type
            $canonical_type = $type;
            try {
                $this->load->model('Metadata_schemas_model');
                $schema_row = $this->Metadata_schemas_model->get_by_uid($type);
                if ($schema_row && isset($schema_row['uid']) && $schema_row['uid']) {
                    $canonical_type = $schema_row['uid'];
                }
            } catch(Exception $e) {
                // If schema registry lookup fails, use original type
            }

            $result = array(
                'schema_uid' => $canonical_type,
                'extra_fields' => array()
            );

            // Load compiled schema
            $this->load->library('Schema_registry');
            $schema = $this->Metadata_schemas_model->get_by_uid($canonical_type);

            if (!$schema){
                $result['error'] = "Schema not found: $canonical_type";
            } else {
                // Get schema file path using schema registry (handles aliases and custom schemas)
                try {
                    $schema_file = $this->Metadata_schemas_model->get_schema_file_path($type);
                } catch(Exception $e) {
                    $result['error'] = "Schema file not found for type: $type - " . $e->getMessage();
                    $response = array(
                        'status' => 'success',
                        'result' => $result
                    );
                    $this->set_response($response, REST_Controller::HTTP_OK);
                    return;
                }
                
                $schema_dir = $this->Metadata_schemas_model->resolve_schema_path($schema);
                if (!is_dir($schema_dir)) {
                    $result['error'] = "Schema directory not found: $schema_dir";
                } else {
                    // Get the actual filename from the resolved schema file path
                    // This ensures we use the correct filename even if it differs from $schema['filename']
                    $actual_filename = basename($schema_file);
                    
                    // Create a schema object with the correct filename for load_schema_documents
                    $schema_for_loading = $schema;
                    $schema_for_loading['filename'] = $actual_filename;
                    
                    // Get compiled schema
                    $documents = $this->schema_registry->load_schema_documents($schema_for_loading, $schema_dir);
                    $compiled_schema = $this->schema_registry->inline_schema($actual_filename, $documents, $schema_dir);
                    
                    // Use validation library
                    $this->load->library('Project_validation');
                    $result['extra_fields'] = $this->project_validation->find_extra_fields($metadata, $compiled_schema);
                }
            }

            $response = array(
                'status' => 'success',
                'result' => $result
            );

            $this->set_response($response, REST_Controller::HTTP_OK);
        }
        catch(Exception $e){
            $error_output = array(
                'status' => 'failed',
                'message' => $e->getMessage()
            );
            $this->set_response($error_output, REST_Controller::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Get template extra fields detection report for a project
     * Finds fields in metadata that are not defined in the current template and not displayed
     * 
     * @param int $sid Project ID
     */
    function template_extra_fields_get($sid=null)
    {
        try{
            $sid = $this->get_sid($sid);
            $project = $this->Editor_model->get_row($sid);

            if (!$project){
                throw new Exception("project not found");
            }

            $this->editor_acl->user_has_project_access($sid, $permission='view');

            $metadata = $project['metadata'];
            $template_uid = isset($project['template_uid']) ? $project['template_uid'] : null;

            $result = array(
                'template_uid' => $template_uid,
                'extra_fields' => array()
            );

            if (!$template_uid){
                $result['error'] = "Project does not have a template assigned";
            } else {
                $this->load->model('Editor_template_model');
                $template = $this->Editor_template_model->get_template_by_uid($template_uid);

                if (!$template){
                    $result['error'] = "Template not found: $template_uid";
                } else {
                    // Get template items structure
                    $template_items = isset($template['template']) && is_array($template['template']) ? $template['template'] : array();
                    
                    if (empty($template_items)) {
                        $result['error'] = "Template has no items defined";
                    } else {
                        // Use validation library
                        $this->load->library('Project_validation');
                        $template_data = isset($template['template']) ? $template['template'] : array();
                        $result['extra_fields'] = $this->project_validation->find_template_extra_fields($metadata, $template_data);
                    }
                }
            }

            $response = array(
                'status' => 'success',
                'result' => $result
            );

            $this->set_response($response, REST_Controller::HTTP_OK);
        }
        catch(Exception $e){
            $error_output = array(
                'status' => 'failed',
                'message' => $e->getMessage()
            );
            $this->set_response($error_output, REST_Controller::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Move extra fields to additional section
     * 
     * @param int $sid Project ID
     */
    function move_to_additional_post($sid=null)
    {
        try{
            $sid = $this->get_sid($sid);
            $project = $this->Editor_model->get_row($sid);

            if (!$project){
                throw new Exception("project not found");
            }

            $this->editor_acl->user_has_project_access($sid, $permission='edit');

            $this->Editor_model->check_project_editable($sid);

            $paths = $this->post('paths');
            if (!is_array($paths) || empty($paths)){
                throw new Exception("paths parameter is required and must be an array");
            }

            $metadata = $project['metadata'];

            // Build JSON Patch operations
            $patches = array();
            $moved_fields = array();
            $errors = array();

            $this->load->library('Project_validation');
            
            // Move each field to additional
            foreach ($paths as $path) {
                try {
                    // Get value from path
                    $value = $this->project_validation->get_value_by_path($metadata, $path);
                    
                    if ($value !== null) {
                        // Create field key from path (use last segment)
                        $path_parts = explode('/', trim($path, '/'));
                        $field_key = end($path_parts);
                        
                        // Handle nested paths - preserve structure in additional
                        // Convert path to additional path format
                        $additional_key = $this->project_validation->create_additional_key($path);
                        
                        // Create additional path in JSON Pointer format
                        $additional_path = '/additional';
                        if (!empty($additional_key)) {
                            $additional_path_parts = explode('.', $additional_key);
                            foreach ($additional_path_parts as $part) {
                                $additional_path .= '/' . $part;
                            }
                        }
                        
                        // Important: Add to additional FIRST, then remove from original
                        // This ensures data is preserved even if remove fails
                        
                        // Add operation: add to additional (JsonPatch creates intermediate paths if needed)
                        $patches[] = array(
                            'op' => 'add',
                            'path' => $additional_path,
                            'value' => $value
                        );
                        
                        // Remove operation: remove from original location
                        $patches[] = array(
                            'op' => 'remove',
                            'path' => $path
                        );
                        
                        $moved_fields[] = array(
                            'path' => $path,
                            'key' => $field_key,
                            'additional_key' => $additional_key,
                            'additional_path' => $additional_path
                        );
                    }
                } catch(Exception $e) {
                    $errors[] = array(
                        'path' => $path,
                        'error' => $e->getMessage()
                    );
                }
            }

            // Apply patches if any using patch_project method
            if (!empty($patches)) {
                $type = $project['type'];
                $this->Editor_model->patch_project($type, $sid, array('patches' => $patches), $validate=false);
            }

            $response = array(
                'status' => 'success',
                'moved_fields' => $moved_fields,
                'errors' => $errors
            );

            $this->set_response($response, REST_Controller::HTTP_OK);
        }
        catch(Exception $e){
            $error_output = array(
                'status' => 'failed',
                'message' => $e->getMessage()
            );
            $this->set_response($error_output, REST_Controller::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Fix array-as-object issues by converting objects with numeric keys to arrays
     * 
     * @param int $sid Project ID
     */
    function fix_array_as_object_post($sid=null)
    {
        try{
            $sid = $this->get_sid($sid);
            $project = $this->Editor_model->get_row($sid);

            if (!$project){
                throw new Exception("project not found");
            }

            $this->editor_acl->user_has_project_access($sid, $permission='edit');
            $this->Editor_model->check_project_editable($sid);

            $paths = $this->post('paths');
            if (!is_array($paths) || empty($paths)){
                throw new Exception("paths parameter is required and must be an array");
            }

            $metadata = $project['metadata'];
            $type = $project['type'];
            
            // Resolve canonical type
            $canonical_type = $type;
            try {
                $schema_row = $this->Metadata_schemas_model->get_by_uid($type);
                if ($schema_row && isset($schema_row['uid']) && $schema_row['uid']) {
                    $canonical_type = $schema_row['uid'];
                }
            } catch(Exception $e) {
                // If schema registry lookup fails, use original type
            }

            // Load compiled schema
            $this->load->library('Schema_registry');
            $schema = $this->Metadata_schemas_model->get_by_uid($canonical_type);

            if (!$schema){
                throw new Exception("Schema not found: $canonical_type");
            }

            // Get schema file path using schema registry (handles aliases and custom schemas)
            try {
                $schema_file = $this->Metadata_schemas_model->get_schema_file_path($type);
            } catch(Exception $e) {
                throw new Exception("Schema file not found for type: $type - " . $e->getMessage());
            }

            $schema_dir = $this->Metadata_schemas_model->resolve_schema_path($schema);
            if (!is_dir($schema_dir)) {
                throw new Exception("Schema directory not found: $schema_dir");
            }

            // Get the actual filename from the resolved schema file path
            // This ensures we use the correct filename even if it differs from $schema['filename']
            $actual_filename = basename($schema_file);
            
            // Create a schema object with the correct filename for load_schema_documents
            $schema_for_loading = $schema;
            $schema_for_loading['filename'] = $actual_filename;

            // Get compiled schema
            $documents = $this->schema_registry->load_schema_documents($schema_for_loading, $schema_dir);
            $compiled_schema = $this->schema_registry->inline_schema($actual_filename, $documents, $schema_dir);

            // Build JSON Patch operations for fixing arrays
            $patches = array();
            $fixed_fields = array();
            $errors = array();

            $this->load->library('Project_validation');
            
            foreach ($paths as $path) {
                try {
                    // Get value from path
                    $value = $this->project_validation->get_value_by_path($metadata, $path);
                    
                    if ($value !== null) {
                        // Check if it's an object with numeric keys
                        if ($this->project_validation->is_object_with_numeric_keys($value)) {
                            // Convert to array
                            $converted_value = $this->project_validation->convert_object_to_array($value);
                            
                            // Add replace operation to patches
                            $patches[] = array(
                                'op' => 'replace',
                                'path' => $path,
                                'value' => $converted_value
                            );
                            
                            $fixed_fields[] = array(
                                'path' => $path,
                                'fixed' => true,
                                'before' => $this->project_validation->get_value_preview($value),
                                'after' => $this->project_validation->get_value_preview($converted_value)
                            );
                        } else {
                            $fixed_fields[] = array(
                                'path' => $path,
                                'fixed' => false,
                                'message' => 'Field is not an object with numeric keys'
                            );
                        }
                    } else {
                        $fixed_fields[] = array(
                            'path' => $path,
                            'fixed' => false,
                            'message' => 'Field not found'
                        );
                    }
                } catch(Exception $e) {
                    $errors[] = array(
                        'path' => $path,
                        'error' => $e->getMessage()
                    );
                }
            }

            // Apply patches if any using patch_project method
            if (!empty($patches)) {
                $this->Editor_model->patch_project($type, $sid, array('patches' => $patches), $validate=false);
            }

            $response = array(
                'status' => 'success',
                'fixed_fields' => $fixed_fields,
                'errors' => $errors
            );

            $this->set_response($response, REST_Controller::HTTP_OK);
        }
        catch(Exception $e){
            $error_output = array(
                'status' => 'failed',
                'message' => $e->getMessage()
            );
            $this->set_response($error_output, REST_Controller::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Get diagnostic report for a project
     * Provides detailed metadata quality analysis including completeness scores,
     * missing required/recommended fields, field quality checks, and type-specific checks.
     * 
     * @param int $sid Project ID
     */
    function diagnostic_get($sid=null)
    {
        try{
            $sid = $this->get_sid($sid);
            $project = $this->Editor_model->get_row($sid);

            if (!$project){
                throw new Exception("project not found");
            }

            $this->editor_acl->user_has_project_access($sid, $permission='view');

            $metadata = $project['metadata'];
            if (!is_array($metadata)) {
                $metadata = array();
            }
            $type = $project['type'];
            $template_uid = isset($project['template_uid']) && !empty($project['template_uid']) ? $project['template_uid'] : null;

            // Initialize diagnostic result
            $result = array(
                'project_id' => $sid,
                'type' => $type,
                'template_uid' => $template_uid,
                'overall_score' => 0,
                'categories' => array(),
                'summary' => array(
                    'total_checks' => 0,
                    'passed' => 0,
                    'warnings' => 0,
                    'errors' => 0
                )
            );

            $all_issues = array();

            // ---- Category 1: Core Metadata Completeness ----
            try {
                $core_checks = $this->_diagnostic_core_metadata($metadata, $type);
                $result['categories'][] = $core_checks;
                $all_issues = array_merge($all_issues, $core_checks['issues']);
            } catch (Exception $e) {
                // Skip category on error
            }

            // ---- Category 2: Template Required Fields ----
            if ($template_uid) {
                try {
                    $this->load->model('Editor_template_model');
                    $template = $this->Editor_template_model->get_template_by_uid($template_uid);
                    if ($template && isset($template['template'])) {
                        $template_checks = $this->_diagnostic_template_fields($metadata, $template['template']);
                        $result['categories'][] = $template_checks;
                        $all_issues = array_merge($all_issues, $template_checks['issues']);
                    }
                } catch (Exception $e) {
                    // Skip category on error
                }
            }

            // ---- Category 3: Documentation Quality ----
            try {
                $doc_checks = $this->_diagnostic_documentation_quality($metadata, $type);
                $result['categories'][] = $doc_checks;
                $all_issues = array_merge($all_issues, $doc_checks['issues']);
            } catch (Exception $e) {
                // Skip category on error
            }

            // ---- Category 4: Type-Specific Checks ----
            try {
                $type_checks = $this->_diagnostic_type_specific($sid, $metadata, $type);
                if ($type_checks) {
                    $result['categories'][] = $type_checks;
                    $all_issues = array_merge($all_issues, $type_checks['issues']);
                }
            } catch (Exception $e) {
                // Skip category on error
            }

            // ---- Category 5: Field Quality ----
            try {
                $quality_checks = $this->_diagnostic_field_quality($metadata, $type);
                $result['categories'][] = $quality_checks;
                $all_issues = array_merge($all_issues, $quality_checks['issues']);
            } catch (Exception $e) {
                // Skip category on error
            }

            // Calculate summary
            $total_checks = 0;
            $passed = 0;
            $warnings = 0;
            $errors = 0;
            foreach ($result['categories'] as $cat) {
                $total_checks += $cat['total_checks'];
                $passed += $cat['passed'];
                $warnings += $cat['warnings'];
                $errors += $cat['errors'];
            }

            $result['summary']['total_checks'] = $total_checks;
            $result['summary']['passed'] = $passed;
            $result['summary']['warnings'] = $warnings;
            $result['summary']['errors'] = $errors;

            // Calculate overall score (0-100)
            if ($total_checks > 0) {
                $result['overall_score'] = round(($passed / $total_checks) * 100);
            }

            $response = array(
                'status' => 'success',
                'diagnostic' => $result
            );

            $this->set_response($response, REST_Controller::HTTP_OK);
        }
        catch(Exception $e){
            $error_output = array(
                'status' => 'failed',
                'message' => $e->getMessage()
            );
            $this->set_response($error_output, REST_Controller::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Diagnostic: Check core metadata fields presence
     */
    private function _diagnostic_core_metadata($metadata, $type)
    {
        $issues = array();
        $checks = 0;
        $passed = 0;

        // Define core fields by type with paths and labels
        $core_fields = $this->_get_core_fields($type);

        foreach ($core_fields as $field) {
            $checks++;
            $value = $this->_get_nested_value($metadata, $field['path']);
            $has_value = $this->_has_meaningful_value($value);

            if ($has_value) {
                $passed++;
            } else {
                $issues[] = array(
                    'severity' => $field['severity'],
                    'field' => $field['path'],
                    'label' => $field['label'],
                    'message' => $field['label'] . ' is missing or empty',
                    'recommendation' => $field['recommendation']
                );
            }
        }

        $warnings = 0;
        $errors = 0;
        foreach ($issues as $issue) {
            if ($issue['severity'] === 'error') {
                $errors++;
            } else {
                $warnings++;
            }
        }

        return array(
            'id' => 'core_metadata',
            'title' => 'Core Metadata',
            'description' => 'Essential metadata fields that should be present in every project',
            'icon' => 'mdi-file-document-outline',
            'score' => $checks > 0 ? round(($passed / $checks) * 100) : 100,
            'total_checks' => $checks,
            'passed' => $passed,
            'warnings' => $warnings,
            'errors' => $errors,
            'issues' => $issues
        );
    }

    /**
     * Get core fields definition by project type
     */
    private function _get_core_fields($type)
    {
        // Common fields for all types
        $common = array(
            array(
                'path' => 'doc_desc.idno',
                'label' => 'Document ID (IDNO)',
                'severity' => 'error',
                'recommendation' => 'Provide a unique identifier for this project'
            ),
            array(
                'path' => 'doc_desc.producers',
                'label' => 'Document Producer',
                'severity' => 'warning',
                'recommendation' => 'Add information about who produced this metadata'
            )
        );

        // Type-specific core fields
        $type_fields = array();

        switch ($type) {
            case 'microdata':
            case 'survey':
                $type_fields = array(
                    array('path' => 'study_desc.title_statement.title', 'label' => 'Study Title', 'severity' => 'error', 'recommendation' => 'Provide a descriptive title for the study'),
                    array('path' => 'study_desc.title_statement.idno', 'label' => 'Study IDNO', 'severity' => 'error', 'recommendation' => 'Provide a unique identifier for the study'),
                    array('path' => 'study_desc.authoring_entity', 'label' => 'Authoring Entity', 'severity' => 'warning', 'recommendation' => 'Add the organization or person responsible for the study'),
                    array('path' => 'study_desc.study_info.abstract', 'label' => 'Abstract', 'severity' => 'warning', 'recommendation' => 'Write an abstract describing the study purpose and methodology'),
                    array('path' => 'study_desc.study_info.coll_dates', 'label' => 'Data Collection Dates', 'severity' => 'warning', 'recommendation' => 'Specify when data was collected'),
                    array('path' => 'study_desc.study_info.nation', 'label' => 'Country/Nation', 'severity' => 'warning', 'recommendation' => 'Specify the geographic coverage'),
                    array('path' => 'study_desc.study_info.keywords', 'label' => 'Keywords', 'severity' => 'warning', 'recommendation' => 'Add keywords to improve discoverability'),
                    array('path' => 'study_desc.study_info.topics', 'label' => 'Topics', 'severity' => 'warning', 'recommendation' => 'Classify the study by topic'),
                    array('path' => 'study_desc.method.data_collection.sampling_procedure', 'label' => 'Sampling Procedure', 'severity' => 'warning', 'recommendation' => 'Describe the sampling methodology'),
                );
                break;

            case 'geospatial':
                $type_fields = array(
                    array('path' => 'description.identification_info.title', 'label' => 'Title', 'severity' => 'error', 'recommendation' => 'Provide a descriptive title'),
                    array('path' => 'description.identification_info.abstract', 'label' => 'Abstract', 'severity' => 'warning', 'recommendation' => 'Write a description of this geospatial dataset'),
                    array('path' => 'description.identification_info.keywords', 'label' => 'Keywords', 'severity' => 'warning', 'recommendation' => 'Add keywords for discoverability'),
                    array('path' => 'description.identification_info.extent', 'label' => 'Geographic Extent', 'severity' => 'warning', 'recommendation' => 'Define the geographic extent'),
                    array('path' => 'description.distribution_info', 'label' => 'Distribution Info', 'severity' => 'warning', 'recommendation' => 'Add distribution and access information'),
                );
                break;

            case 'document':
                $type_fields = array(
                    array('path' => 'document_description.title_statement.title', 'label' => 'Title', 'severity' => 'error', 'recommendation' => 'Provide a title for the document'),
                    array('path' => 'document_description.type', 'label' => 'Document Type', 'severity' => 'warning', 'recommendation' => 'Specify the document type'),
                    array('path' => 'document_description.date_published', 'label' => 'Date Published', 'severity' => 'warning', 'recommendation' => 'Add the publication date'),
                    array('path' => 'document_description.authors', 'label' => 'Authors', 'severity' => 'warning', 'recommendation' => 'List the authors'),
                    array('path' => 'document_description.abstract', 'label' => 'Abstract', 'severity' => 'warning', 'recommendation' => 'Provide a summary of the document'),
                    array('path' => 'document_description.languages', 'label' => 'Languages', 'severity' => 'warning', 'recommendation' => 'Specify the document language(s)'),
                );
                break;

            case 'indicator':
            case 'timeseries':
            case 'timeseries-db':
                $type_fields = array(
                    array('path' => 'series_description.idno', 'label' => 'Series IDNO', 'severity' => 'error', 'recommendation' => 'Provide a unique identifier'),
                    array('path' => 'series_description.name', 'label' => 'Series Name', 'severity' => 'error', 'recommendation' => 'Provide the indicator/series name'),
                    array('path' => 'series_description.definition_short', 'label' => 'Short Definition', 'severity' => 'warning', 'recommendation' => 'Add a brief definition'),
                    array('path' => 'series_description.topics', 'label' => 'Topics', 'severity' => 'warning', 'recommendation' => 'Classify by topic'),
                    array('path' => 'series_description.methodology', 'label' => 'Methodology', 'severity' => 'warning', 'recommendation' => 'Describe the methodology'),
                );
                break;

            case 'table':
                $type_fields = array(
                    array('path' => 'table_description.title_statement.title', 'label' => 'Title', 'severity' => 'error', 'recommendation' => 'Provide a title for this table'),
                    array('path' => 'table_description.title_statement.idno', 'label' => 'IDNO', 'severity' => 'error', 'recommendation' => 'Provide a unique identifier'),
                    array('path' => 'table_description.description', 'label' => 'Description', 'severity' => 'warning', 'recommendation' => 'Add a description'),
                );
                break;

            case 'image':
                $type_fields = array(
                    array('path' => 'image_description.iptc.headline', 'label' => 'Headline', 'severity' => 'error', 'recommendation' => 'Provide a headline'),
                    array('path' => 'image_description.iptc.caption', 'label' => 'Caption', 'severity' => 'warning', 'recommendation' => 'Add a caption'),
                    array('path' => 'image_description.iptc.keywords', 'label' => 'Keywords', 'severity' => 'warning', 'recommendation' => 'Add keywords'),
                );
                break;

            case 'video':
                $type_fields = array(
                    array('path' => 'video_description.title_statement.title', 'label' => 'Title', 'severity' => 'error', 'recommendation' => 'Provide a title'),
                    array('path' => 'video_description.description', 'label' => 'Description', 'severity' => 'warning', 'recommendation' => 'Add a description'),
                );
                break;

            case 'script':
                $type_fields = array(
                    array('path' => 'script_description.title_statement.title', 'label' => 'Title', 'severity' => 'error', 'recommendation' => 'Provide a title'),
                    array('path' => 'script_description.description', 'label' => 'Description', 'severity' => 'warning', 'recommendation' => 'Add a description'),
                    array('path' => 'script_description.language', 'label' => 'Programming Language', 'severity' => 'warning', 'recommendation' => 'Specify the programming language'),
                );
                break;

            default:
                // For unknown types, check for common title patterns
                $type_fields = array(
                    array('path' => 'title_statement.title', 'label' => 'Title', 'severity' => 'error', 'recommendation' => 'Provide a title'),
                );
                break;
        }

        return array_merge($common, $type_fields);
    }

    /**
     * Diagnostic: Check template required and recommended fields
     */
    private function _diagnostic_template_fields($metadata, $template_data)
    {
        $issues = array();
        $checks = 0;
        $passed = 0;

        if (isset($template_data['items']) && is_array($template_data['items'])) {
            $this->_walk_template_for_diagnostic($template_data['items'], $metadata, $issues, $checks, $passed);
        }

        $warnings = 0;
        $errors = 0;
        foreach ($issues as $issue) {
            if ($issue['severity'] === 'error') {
                $errors++;
            } else {
                $warnings++;
            }
        }

        return array(
            'id' => 'template_fields',
            'title' => 'Template Required Fields',
            'description' => 'Fields marked as required or recommended in the active template',
            'icon' => 'mdi-format-list-checks',
            'score' => $checks > 0 ? round(($passed / $checks) * 100) : 100,
            'total_checks' => $checks,
            'passed' => $passed,
            'warnings' => $warnings,
            'errors' => $errors,
            'issues' => $issues
        );
    }

    /**
     * Walk template items to find required/recommended fields
     */
    private function _walk_template_for_diagnostic($items, $metadata, &$issues, &$checks, &$passed, $base_path = '')
    {
        if (!is_array($items)) {
            return;
        }

        foreach ($items as $item) {
            if (!isset($item['key'])) {
                // Recurse into containers/sections
                if (isset($item['items']) && is_array($item['items'])) {
                    $this->_walk_template_for_diagnostic($item['items'], $metadata, $issues, $checks, $passed, $base_path);
                }
                continue;
            }

            $field_key = $item['key'];
            $rules = isset($item['rules']) ? $item['rules'] : '';
            $is_required = false;
            $is_recommended = false;

            if (is_string($rules)) {
                $is_required = (bool) preg_match('/(?:^|\|)required(?:$|\|)/', $rules);
            } elseif (is_array($rules)) {
                $is_required = in_array('required', $rules);
            }

            // Check is_recommended flag
            if (isset($item['is_recommended']) && $item['is_recommended']) {
                $is_recommended = true;
            }

            if ($is_required || $is_recommended) {
                $checks++;
                $value = $this->_get_nested_value($metadata, $field_key);
                $has_value = $this->_has_meaningful_value($value);

                if ($has_value) {
                    $passed++;
                } else {
                    $label = isset($item['title']) ? $item['title'] : (isset($item['label']) ? $item['label'] : $field_key);
                    $severity = $is_required ? 'error' : 'warning';
                    $issues[] = array(
                        'severity' => $severity,
                        'field' => $field_key,
                        'label' => $label,
                        'message' => $label . ' is ' . ($is_required ? 'required' : 'recommended') . ' but missing or empty',
                        'recommendation' => 'Fill in the ' . $label . ' field'
                    );
                }
            }

            // Recurse into nested items
            if (isset($item['items']) && is_array($item['items'])) {
                $this->_walk_template_for_diagnostic($item['items'], $metadata, $issues, $checks, $passed, $field_key);
            }
        }
    }

    /**
     * Diagnostic: Documentation quality analysis
     */
    private function _diagnostic_documentation_quality($metadata, $type)
    {
        $issues = array();
        $checks = 0;
        $passed = 0;

        // Check abstract/description length
        $abstract = null;
        switch ($type) {
            case 'microdata':
            case 'survey':
                $abstract = $this->_get_nested_value($metadata, 'study_desc.study_info.abstract');
                break;
            case 'geospatial':
                $abstract = $this->_get_nested_value($metadata, 'description.identification_info.abstract');
                break;
            case 'document':
                $abstract = $this->_get_nested_value($metadata, 'document_description.abstract');
                break;
            case 'indicator':
            case 'timeseries':
            case 'timeseries-db':
                $abstract = $this->_get_nested_value($metadata, 'series_description.definition_short');
                break;
        }

        if ($abstract !== null) {
            $checks++;
            $abstract_text = is_string($abstract) ? $abstract : (is_array($abstract) ? implode(' ', array_filter(array_map(function($v) { return is_string($v) ? $v : (is_array($v) && isset($v['text']) ? $v['text'] : ''); }, $abstract))) : '');
            $abstract_len = strlen(trim($abstract_text));

            if ($abstract_len >= 100) {
                $passed++;
            } else {
                $issues[] = array(
                    'severity' => 'warning',
                    'field' => 'abstract',
                    'label' => 'Abstract/Description Length',
                    'message' => 'Abstract is too short (' . $abstract_len . ' characters). A good abstract should be at least 100 characters.',
                    'recommendation' => 'Expand the abstract to provide a comprehensive description of the dataset'
                );
            }
        }

        // Check for keywords (only for types that have keyword paths)
        $keywords = null;
        switch ($type) {
            case 'microdata':
            case 'survey':
                $keywords = $this->_get_nested_value($metadata, 'study_desc.study_info.keywords');
                break;
            case 'geospatial':
                $keywords = $this->_get_nested_value($metadata, 'description.identification_info.keywords');
                break;
        }

        if ($keywords !== null) {
            $checks++;
            if ($this->_has_meaningful_value($keywords) && is_array($keywords) && count($keywords) >= 3) {
                $passed++;
            } else {
                $keyword_count = is_array($keywords) ? count($keywords) : 0;
                $issues[] = array(
                    'severity' => 'warning',
                    'field' => 'keywords',
                    'label' => 'Keywords Coverage',
                    'message' => 'Project has ' . $keyword_count . ' keyword(s). At least 3 keywords are recommended for good discoverability.',
                    'recommendation' => 'Add more keywords to help users find this dataset'
                );
            }
        }

        $warnings = 0;
        $errors = 0;
        foreach ($issues as $issue) {
            if ($issue['severity'] === 'error') {
                $errors++;
            } else {
                $warnings++;
            }
        }

        return array(
            'id' => 'documentation_quality',
            'title' => 'Documentation Quality',
            'description' => 'Quality and depth of metadata documentation',
            'icon' => 'mdi-text-box-check-outline',
            'score' => $checks > 0 ? round(($passed / $checks) * 100) : 100,
            'total_checks' => $checks,
            'passed' => $passed,
            'warnings' => $warnings,
            'errors' => $errors,
            'issues' => $issues
        );
    }

    /**
     * Diagnostic: Type-specific checks
     */
    private function _diagnostic_type_specific($sid, $metadata, $type)
    {
        $issues = array();
        $checks = 0;
        $passed = 0;

        switch ($type) {
            case 'microdata':
            case 'survey':
                // Check data files using direct DB query
                $this->db->where('sid', $sid);
                $file_count = $this->db->count_all_results('editor_data_files');

                $checks++;
                if ($file_count > 0) {
                    $passed++;
                } else {
                    $issues[] = array(
                        'severity' => 'warning',
                        'field' => 'data_files',
                        'label' => 'Data Files',
                        'message' => 'No data files have been added to this project',
                        'recommendation' => 'Upload data files (CSV, Stata, SPSS) to document the variables'
                    );
                }

                // Check variables
                if ($file_count > 0) {
                    // Count total variables
                    $this->db->where('sid', $sid);
                    $total_vars = $this->db->count_all_results('editor_variables');

                    // Count variables without labels
                    $this->db->where('sid', $sid);
                    $this->db->where("(labl IS NULL OR TRIM(COALESCE(labl,'')) = '')", null, false);
                    $vars_without_labels = $this->db->count_all_results('editor_variables');

                    // Check that files have variables
                    $checks++;
                    if ($total_vars > 0) {
                        $passed++;
                    } else {
                        $issues[] = array(
                            'severity' => 'warning',
                            'field' => 'variables',
                            'label' => 'Variables',
                            'message' => 'Data files have no variables defined. Import or add variables to document the dataset structure.',
                            'recommendation' => 'Import variable metadata from data files or add variables manually'
                        );
                    }

                    // Check variable labels
                    if ($total_vars > 0) {
                        $checks++;
                        if ($vars_without_labels === 0) {
                            $passed++;
                        } else {
                            $pct = round(($vars_without_labels / $total_vars) * 100);
                            $issues[] = array(
                                'severity' => $pct > 50 ? 'error' : 'warning',
                                'field' => 'variable_labels',
                                'label' => 'Variable Labels',
                                'message' => $vars_without_labels . ' of ' . $total_vars . ' variables (' . $pct . '%) are missing labels',
                                'recommendation' => 'Add descriptive labels to all variables for better documentation'
                            );
                        }
                    }
                }
                break;

            case 'geospatial':
                // Check features using direct DB query
                $this->db->where('sid', $sid);
                $feature_count = $this->db->count_all_results('editor_geospatial_features');

                $checks++;
                if ($feature_count > 0) {
                    $passed++;
                } else {
                    $issues[] = array(
                        'severity' => 'warning',
                        'field' => 'geospatial_features',
                        'label' => 'Feature Catalog',
                        'message' => 'No geospatial features have been defined',
                        'recommendation' => 'Add feature catalog entries to document the geospatial layers'
                    );
                }
                break;

            case 'indicator':
            case 'timeseries':
            case 'timeseries-db':
                // Check DSD definitions
                $checks++;
                $dsd = $this->_get_nested_value($metadata, 'series_description.dimensions');
                if ($this->_has_meaningful_value($dsd)) {
                    $passed++;
                } else {
                    $issues[] = array(
                        'severity' => 'warning',
                        'field' => 'dimensions',
                        'label' => 'Dimensions/DSD',
                        'message' => 'No dimensions or data structure definition found',
                        'recommendation' => 'Define the dimensions for this indicator/time series'
                    );
                }
                break;
        }

        if ($checks === 0) {
            return null;
        }

        $warnings = 0;
        $errors = 0;
        foreach ($issues as $issue) {
            if ($issue['severity'] === 'error') {
                $errors++;
            } else {
                $warnings++;
            }
        }

        $type_labels = array(
            'microdata' => 'Microdata',
            'survey' => 'Survey',
            'geospatial' => 'Geospatial',
            'indicator' => 'Indicator',
            'timeseries' => 'Time Series',
            'timeseries-db' => 'Time Series Database',
            'document' => 'Document',
            'image' => 'Image',
            'video' => 'Video',
            'table' => 'Table',
            'script' => 'Script'
        );

        $type_label = isset($type_labels[$type]) ? $type_labels[$type] : ucfirst($type);

        return array(
            'id' => 'type_specific',
            'title' => $type_label . ' Checks',
            'description' => 'Checks specific to ' . strtolower($type_label) . ' projects',
            'icon' => 'mdi-database-check',
            'score' => $checks > 0 ? round(($passed / $checks) * 100) : 100,
            'total_checks' => $checks,
            'passed' => $passed,
            'warnings' => $warnings,
            'errors' => $errors,
            'issues' => $issues
        );
    }

    /**
     * Diagnostic: Field quality checks
     */
    private function _diagnostic_field_quality($metadata, $type)
    {
        $issues = array();
        $checks = 0;
        $passed = 0;

        // Check for placeholder/dummy values in common fields
        $placeholder_patterns = array(
            '/^test$/i',
            '/^xxx+$/i',
            '/^placeholder$/i',
            '/^todo$/i',
            '/^tbd$/i',
            '/^n\/?a$/i',
            '/^none$/i',
            '/^\.+$/',
            '/^-+$/',
        );

        $fields_to_check = $this->_get_text_fields_for_quality($metadata, $type);

        foreach ($fields_to_check as $field_info) {
            $checks++;
            $value = $field_info['value'];
            $is_placeholder = false;

            if (is_string($value)) {
                $trimmed = trim($value);
                foreach ($placeholder_patterns as $pattern) {
                    if (preg_match($pattern, $trimmed)) {
                        $is_placeholder = true;
                        break;
                    }
                }
            }

            if (!$is_placeholder) {
                $passed++;
            } else {
                $issues[] = array(
                    'severity' => 'warning',
                    'field' => $field_info['path'],
                    'label' => $field_info['label'],
                    'message' => $field_info['label'] . ' appears to contain a placeholder value: "' . substr(trim($value), 0, 50) . '"',
                    'recommendation' => 'Replace placeholder text with actual metadata content'
                );
            }
        }

        $warnings = 0;
        $errors = 0;
        foreach ($issues as $issue) {
            if ($issue['severity'] === 'error') {
                $errors++;
            } else {
                $warnings++;
            }
        }

        return array(
            'id' => 'field_quality',
            'title' => 'Field Quality',
            'description' => 'Checks for placeholder values, very short content, and data quality',
            'icon' => 'mdi-check-decagram',
            'score' => $checks > 0 ? round(($passed / $checks) * 100) : 100,
            'total_checks' => $checks,
            'passed' => $passed,
            'warnings' => $warnings,
            'errors' => $errors,
            'issues' => $issues
        );
    }

    /**
     * Get text fields from metadata for quality checking
     */
    private function _get_text_fields_for_quality($metadata, $type)
    {
        $fields = array();
        $paths_to_check = array();

        switch ($type) {
            case 'microdata':
            case 'survey':
                $paths_to_check = array(
                    array('path' => 'study_desc.title_statement.title', 'label' => 'Title'),
                    array('path' => 'study_desc.study_info.abstract', 'label' => 'Abstract'),
                    array('path' => 'study_desc.title_statement.idno', 'label' => 'IDNO'),
                );
                break;
            case 'geospatial':
                $paths_to_check = array(
                    array('path' => 'description.identification_info.title', 'label' => 'Title'),
                    array('path' => 'description.identification_info.abstract', 'label' => 'Abstract'),
                );
                break;
            case 'document':
                $paths_to_check = array(
                    array('path' => 'document_description.title_statement.title', 'label' => 'Title'),
                    array('path' => 'document_description.abstract', 'label' => 'Abstract'),
                );
                break;
            default:
                $paths_to_check = array();
                break;
        }

        foreach ($paths_to_check as $p) {
            $value = $this->_get_nested_value($metadata, $p['path']);
            if (is_string($value) && !empty(trim($value))) {
                $fields[] = array(
                    'path' => $p['path'],
                    'label' => $p['label'],
                    'value' => $value
                );
            }
        }

        return $fields;
    }

    /**
     * Get a nested value from metadata using dot notation
     */
    private function _get_nested_value($data, $path)
    {
        if (empty($path)) {
            return $data;
        }

        $parts = explode('.', $path);
        $current = $data;

        foreach ($parts as $part) {
            if (is_array($current) && isset($current[$part])) {
                $current = $current[$part];
            } elseif (is_object($current) && isset($current->$part)) {
                $current = $current->$part;
            } else {
                return null;
            }
        }

        return $current;
    }

    /**
     * Check if a value is meaningful (not empty, not null, not just whitespace)
     */
    private function _has_meaningful_value($value)
    {
        if ($value === null) {
            return false;
        }
        if (is_string($value)) {
            return trim($value) !== '';
        }
        if (is_array($value)) {
            return !empty($value);
        }
        if (is_object($value)) {
            return !empty((array)$value);
        }
        return true;
    }

    /**
     * Remove extra fields from metadata
     * 
     * @param int $sid Project ID
     */
    function remove_fields_post($sid=null)
    {
        try{
            $sid = $this->get_sid($sid);
            $project = $this->Editor_model->get_row($sid);

            if (!$project){
                throw new Exception("project not found");
            }

            $this->editor_acl->user_has_project_access($sid, $permission='edit');

            $this->Editor_model->check_project_editable($sid);

            $paths = $this->post('paths');
            if (!is_array($paths) || empty($paths)){
                throw new Exception("paths parameter is required and must be an array");
            }

            $metadata = $project['metadata'];

            // Build JSON Patch operations for removing fields
            $patches = array();
            $removed_fields = array();
            $errors = array();

            $this->load->library('Project_validation');

            foreach ($paths as $path) {
                try {
                    // Check if field exists
                    $value = $this->project_validation->get_value_by_path($metadata, $path);
                    
                    if ($value !== null) {
                        // Add remove operation to patches
                        $patches[] = array(
                            'op' => 'remove',
                            'path' => $path
                        );
                        
                        $removed_fields[] = array(
                            'path' => $path,
                            'removed' => true
                        );
                    } else {
                        $removed_fields[] = array(
                            'path' => $path,
                            'removed' => false,
                            'message' => 'Field not found'
                        );
                    }
                } catch(Exception $e) {
                    $errors[] = array(
                        'path' => $path,
                        'error' => $e->getMessage()
                    );
                }
            }

            // Apply patches if any using patch_project method
            if (!empty($patches)) {
                $type = $project['type'];
                $this->Editor_model->patch_project($type, $sid, array('patches' => $patches), $validate=false);
            }

            $response = array(
                'status' => 'success',
                'removed_fields' => $removed_fields,
                'errors' => $errors
            );

            $this->set_response($response, REST_Controller::HTTP_OK);
        }
        catch(Exception $e){
            $error_output = array(
                'status' => 'failed',
                'message' => $e->getMessage()
            );
            $this->set_response($error_output, REST_Controller::HTTP_BAD_REQUEST);
        }
    }
}
