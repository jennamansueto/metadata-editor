<?php

defined('BASEPATH') OR exit('No direct script access allowed');

require(APPPATH . '/libraries/MY_REST_Controller.php');

/**
 * LLM API Controller
 *
 * Provides endpoints for AI/LLM keyword suggestion.
 */
class Llm extends MY_REST_Controller {

	private $api_user;

	public function __construct()
	{
		parent::__construct();
		$this->load->model('Editor_model');
		$this->load->library('Editor_acl');
		$this->is_authenticated_or_die();
		$this->api_user = $this->api_user();
	}

	/**
	 * Override authentication to support both session authentication + API keys.
	 */
	public function _auth_override_check()
	{
		if ($this->session->userdata('user_id')) {
			return true;
		}
		return parent::_auth_override_check();
	}

	/**
	 * GET /api/llm/config
	 *
	 * Return LLM configuration status (never exposes the API key).
	 */
	public function config_get()
	{
		$this->load->library('Llm_service');
		$config = $this->llm_service->get_config_info();

		$this->response(array(
			'status' => 'success',
			'data'   => $config,
		), REST_Controller::HTTP_OK);
	}

	/**
	 * POST /api/llm/suggest_keywords/{project_id}
	 *
	 * Suggest keywords for an indicator project based on its metadata.
	 */
	public function suggest_keywords_post($project_id = null)
	{
		if (empty($project_id) || !is_numeric($project_id)) {
			$this->response(array(
				'status'  => 'failed',
				'message' => 'A valid project ID is required.',
			), REST_Controller::HTTP_BAD_REQUEST);
			return;
		}

		// Check project-level access
		try {
			$this->editor_acl->user_has_project_access($project_id, 'view');
		} catch (Exception $e) {
			$this->response(array(
				'status'  => 'failed',
				'message' => 'Access denied to this project.',
			), REST_Controller::HTTP_FORBIDDEN);
			return;
		}

		// Get the project row
		$project = $this->Editor_model->get_row($project_id);

		if (!$project) {
			$this->response(array(
				'status'  => 'failed',
				'message' => 'Project not found.',
			), REST_Controller::HTTP_NOT_FOUND);
			return;
		}

		// Extract metadata (already decoded by get_row)
		$metadata = isset($project['metadata']) ? $project['metadata'] : array();

		if (is_string($metadata) && !empty($metadata)) {
			$decoded = json_decode($metadata, true);
			if (is_array($decoded)) {
				$metadata = $decoded;
			}
		}

		if (!is_array($metadata)) {
			$metadata = array();
		}

		// Read optional temperature from POST body
		$input = $this->raw_json_input();
		$temperature = null;
		if (is_array($input) && isset($input['temperature'])) {
			$temperature = (float) $input['temperature'];
		}

		// Call the LLM service
		$this->load->library('Llm_service');
		$result = $this->llm_service->suggest_keywords($metadata, $temperature);

		$this->response(array(
			'status' => 'success',
			'data'   => $result,
		), REST_Controller::HTTP_OK);
	}
}
