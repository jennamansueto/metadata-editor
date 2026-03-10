<?php

require(APPPATH.'/libraries/MY_REST_Controller.php');

/**
 * LLM API Controller
 * 
 * Provides API endpoints for LLM-powered features such as keyword suggestion.
 */
class Llm extends MY_REST_Controller
{
	public function __construct()
	{
		parent::__construct();
		$this->load->model('Editor_model');
		$this->load->model('Configurations_model');
		$this->load->library('Editor_acl');
		$this->is_authenticated_or_die();
	}

	/**
	 * Override authentication to support both session authentication + api keys
	 */
	function _auth_override_check()
	{
		if ($this->session->userdata('user_id'))
		{
			return true;
		}
		parent::_auth_override_check();
	}

	/**
	 * POST /api/llm/suggest_keywords/{project_id}
	 * 
	 * Suggest keywords for an indicator project using the configured LLM.
	 * 
	 * Request body (JSON):
	 *   - temperature (float, optional): LLM temperature 0.0-1.0
	 * 
	 * Response:
	 *   - status: "success" | "error"
	 *   - keywords: array of keyword strings
	 *   - is_mock: boolean indicating if mock mode was used
	 */
	public function suggest_keywords_post($project_id = null)
	{
		if (!$project_id) {
			$this->response(array(
				'status'  => 'error',
				'message' => 'Project ID is required'
			), REST_Controller::HTTP_BAD_REQUEST);
			return;
		}

		try {
			$project_id = $this->get_sid($project_id);
		} catch (Exception $e) {
			$this->response(array(
				'status'  => 'error',
				'message' => $e->getMessage()
			), REST_Controller::HTTP_NOT_FOUND);
			return;
		}

		// Check if user has permission to view this project
		$this->editor_acl->user_has_project_access($project_id, $permission='view');

		// Load project metadata
		$project = $this->Editor_model->get_row($project_id);

		if (!$project) {
			$this->response(array(
				'status'  => 'error',
				'message' => 'Project not found'
			), REST_Controller::HTTP_NOT_FOUND);
			return;
		}

		// Extract indicator metadata fields
		// Editor_model::get_row() returns metadata already decoded as an array
		$metadata = $project['metadata'];
		if (!is_array($metadata)) {
			$metadata = json_decode($metadata, true);
		}
		if (!$metadata) {
			$metadata = array();
		}

		$name       = $this->get_nested_value($metadata, 'series_description.name', '');
		$definition = $this->get_nested_value($metadata, 'series_description.definition_short', '');
		$relevance  = $this->get_nested_value($metadata, 'series_description.relevance', '');

		// Get temperature from request body
		$input = $this->raw_json_input();
		$temperature = null;
		if ($input && isset($input['temperature'])) {
			$temperature = (float)$input['temperature'];
		}

		// Call LLM service
		try {
			$this->load->library('Llm_service');
			$is_mock  = !$this->llm_service->is_configured();
			$keywords = $this->llm_service->suggest_keywords($name, $definition, $relevance, $temperature);

			$this->response(array(
				'status'   => 'success',
				'keywords' => $keywords,
				'is_mock'  => $is_mock
			), REST_Controller::HTTP_OK);

		} catch (Exception $e) {
			log_message('error', 'LLM suggest_keywords error: ' . $e->getMessage());
			$this->response(array(
				'status'  => 'error',
				'message' => 'Failed to generate keyword suggestions: ' . $e->getMessage()
			), REST_Controller::HTTP_INTERNAL_ERROR);
		}
	}

	/**
	 * GET /api/llm/config
	 * 
	 * Return LLM configuration status (not the actual key).
	 */
	public function config_get()
	{
		$this->load->library('Llm_service');

		$this->response(array(
			'status'       => 'success',
			'is_configured' => $this->llm_service->is_configured(),
			'default_temperature' => $this->llm_service->get_default_temperature()
		), REST_Controller::HTTP_OK);
	}

	/**
	 * Helper: get nested array value using dot notation
	 */
	private function get_nested_value($array, $key, $default = '')
	{
		$keys = explode('.', $key);
		$value = $array;

		foreach ($keys as $k) {
			if (is_array($value) && isset($value[$k])) {
				$value = $value[$k];
			} else {
				return $default;
			}
		}

		return is_string($value) ? $value : $default;
	}
}
