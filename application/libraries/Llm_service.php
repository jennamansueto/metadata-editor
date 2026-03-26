<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * LLM Service Library
 *
 * Wraps an OpenAI-compatible chat completions API for keyword suggestion.
 * Falls back to mock keyword generation when no API key is configured.
 */
class Llm_service {

	private $CI;
	private $api_url;
	private $api_key;
	private $model;
	private $default_temperature;

	public function __construct()
	{
		$this->CI =& get_instance();
		$this->CI->load->model('Configurations_model');

		$configs = $this->CI->Configurations_model->get_config_array();

		$this->api_url             = isset($configs['llm_api_url'])             ? trim($configs['llm_api_url'])             : '';
		$this->api_key             = isset($configs['llm_api_key'])             ? trim($configs['llm_api_key'])             : '';
		$this->model               = isset($configs['llm_model'])               ? trim($configs['llm_model'])               : 'gpt-4o-mini';
		$this->default_temperature = isset($configs['llm_default_temperature']) ? (float) $configs['llm_default_temperature'] : 0.7;
	}

	/**
	 * Check whether a real LLM API is configured.
	 */
	public function is_configured()
	{
		return !empty($this->api_key) && !empty($this->api_url);
	}

	/**
	 * Return safe configuration info (never exposes the key).
	 */
	public function get_config_info()
	{
		return array(
			'is_configured'      => $this->is_configured(),
			'model'              => $this->model,
			'default_temperature'=> $this->default_temperature,
		);
	}

	/**
	 * Suggest keywords for an indicator based on its metadata.
	 *
	 * @param array  $metadata    Indicator metadata array
	 * @param float  $temperature Sampling temperature (0.0 - 1.0)
	 * @return array              ['keywords' => [...], 'mock' => bool]
	 */
	public function suggest_keywords($metadata, $temperature = null)
	{
		if ($temperature === null) {
			$temperature = $this->default_temperature;
		}

		$temperature = max(0.0, min(1.0, (float) $temperature));

		$name       = $this->extract_field($metadata, 'name');
		$definition = $this->extract_field($metadata, 'definition');
		$relevance  = $this->extract_field($metadata, 'development_relevance');

		if (!$this->is_configured()) {
			return $this->mock_keywords($name, $definition);
		}

		return $this->call_llm_api($name, $definition, $relevance, $temperature);
	}

	/**
	 * Extract a metadata field, searching nested indicator structures.
	 */
	private function extract_field($metadata, $field)
	{
		// Direct top-level field
		if (isset($metadata[$field]) && is_string($metadata[$field])) {
			return $metadata[$field];
		}

		// Nested under common indicator paths
		$paths = array(
			array('definition_and_characteristics', $field),
			array('indicator', $field),
			array('series_description', $field),
		);

		foreach ($paths as $path) {
			$value = $metadata;
			foreach ($path as $key) {
				if (is_array($value) && isset($value[$key])) {
					$value = $value[$key];
				} else {
					$value = null;
					break;
				}
			}
			if (is_string($value) && !empty($value)) {
				return $value;
			}
		}

		return '';
	}

	/**
	 * Call the OpenAI-compatible chat completions API.
	 */
	private function call_llm_api($name, $definition, $relevance, $temperature)
	{
		$prompt  = "Based on the following indicator metadata, suggest 8-12 relevant keywords.\n\n";
		$prompt .= "Indicator name: {$name}\n";

		if (!empty($definition)) {
			$prompt .= "Definition: {$definition}\n";
		}
		if (!empty($relevance)) {
			$prompt .= "Development relevance: {$relevance}\n";
		}

		$prompt .= "\nReturn ONLY a JSON array of keyword strings, e.g. [\"keyword1\", \"keyword2\"]. ";
		$prompt .= "Do not include any other text or explanation.";

		$payload = json_encode(array(
			'model'       => $this->model,
			'temperature' => $temperature,
			'messages'    => array(
				array(
					'role'    => 'system',
					'content' => 'You are a metadata specialist. You suggest concise, relevant keywords for statistical indicators and datasets.',
				),
				array(
					'role'    => 'user',
					'content' => $prompt,
				),
			),
		));

		$url = rtrim($this->api_url, '/');
		if (strpos($url, '/chat/completions') === false) {
			$url .= '/chat/completions';
		}

		$ch = curl_init($url);
		curl_setopt_array($ch, array(
			CURLOPT_POST           => true,
			CURLOPT_POSTFIELDS     => $payload,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_TIMEOUT        => 30,
			CURLOPT_HTTPHEADER     => array(
				'Content-Type: application/json',
				'Authorization: Bearer ' . $this->api_key,
			),
		));

		$response = curl_exec($ch);
		$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$curl_error = curl_error($ch);
		curl_close($ch);

		if ($response === false || !empty($curl_error)) {
			log_message('error', 'LLM API curl error: ' . $curl_error);
			return array('keywords' => array(), 'mock' => false, 'error' => 'Connection error: ' . $curl_error);
		}

		if ($http_code < 200 || $http_code >= 300) {
			log_message('error', 'LLM API HTTP ' . $http_code . ': ' . $response);
			return array('keywords' => array(), 'mock' => false, 'error' => 'API returned HTTP ' . $http_code);
		}

		$data = json_decode($response, true);

		if (!$data || !isset($data['choices'][0]['message']['content'])) {
			return array('keywords' => array(), 'mock' => false, 'error' => 'Unexpected API response format');
		}

		$content = trim($data['choices'][0]['message']['content']);

		// Strip markdown code fences if present
		$content = preg_replace('/^```(?:json)?\s*/i', '', $content);
		$content = preg_replace('/\s*```$/', '', $content);

		$keywords = json_decode($content, true);

		if (!is_array($keywords)) {
			// Try to extract keywords from non-JSON response
			$keywords = array_filter(array_map('trim', explode("\n", $content)));
			$keywords = array_values($keywords);
		}

		// Ensure all items are strings
		$keywords = array_values(array_filter($keywords, 'is_string'));

		return array('keywords' => $keywords, 'mock' => false);
	}

	/**
	 * Generate mock keywords from indicator name and definition.
	 */
	private function mock_keywords($name, $definition)
	{
		$text = $name . ' ' . $definition;
		$text = strtolower($text);
		$text = preg_replace('/[^a-z0-9\s]/', ' ', $text);

		$stop_words = array(
			'the','a','an','and','or','but','in','on','at','to','for','of','is','it','by',
			'as','be','was','are','were','been','being','have','has','had','do','does','did',
			'will','would','could','should','may','might','shall','can','this','that','these',
			'those','with','from','into','through','during','before','after','above','below',
			'between','not','no','nor','also','such','than','too','very','just','about','each',
			'per','its','their','our','which','what','where','when','how','who','whom',
		);

		$words = array_filter(explode(' ', $text), function($w) use ($stop_words) {
			return strlen($w) > 2 && !in_array($w, $stop_words);
		});

		$words = array_unique(array_values($words));

		// Add some domain-relevant mock keywords
		$domain_keywords = array('statistics', 'indicator', 'development', 'measurement', 'data');

		$keywords = array_slice($words, 0, 7);
		foreach ($domain_keywords as $dk) {
			if (count($keywords) >= 10) break;
			if (!in_array($dk, $keywords)) {
				$keywords[] = $dk;
			}
		}

		return array('keywords' => array_values($keywords), 'mock' => true);
	}
}
