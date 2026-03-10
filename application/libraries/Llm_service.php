<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/**
 * LLM Service Library
 * 
 * Provides integration with LLM APIs (OpenAI-compatible) for AI-powered
 * features such as keyword suggestion. Supports configurable API endpoint,
 * model, and temperature. Falls back to mock responses when no API key
 * is configured, allowing UI testing without a real LLM provider.
 */
class Llm_service {

	private $ci;
	private $api_url;
	private $api_key;
	private $model;
	private $default_temperature;

	public function __construct()
	{
		$this->ci =& get_instance();
		$this->ci->load->model('Configurations_model');

		$config = $this->ci->Configurations_model->get_config_array();

		$this->api_url             = isset($config['llm_api_url']) ? trim($config['llm_api_url']) : '';
		$this->api_key             = isset($config['llm_api_key']) ? trim($config['llm_api_key']) : '';
		$this->model               = isset($config['llm_model'])   ? trim($config['llm_model'])   : 'gpt-4';
		$this->default_temperature = isset($config['llm_default_temperature']) ? (float)$config['llm_default_temperature'] : 0.7;
	}

	/**
	 * Check whether a real LLM API is configured
	 */
	public function is_configured()
	{
		return !empty($this->api_url) && !empty($this->api_key);
	}

	/**
	 * Get the default temperature
	 */
	public function get_default_temperature()
	{
		return $this->default_temperature;
	}

	/**
	 * Suggest keywords for an indicator based on its metadata.
	 *
	 * @param string $name              Indicator name
	 * @param string $definition        Short definition
	 * @param string $relevance         Development relevance text
	 * @param float|null $temperature   LLM temperature (0.0–1.0)
	 * @return array                    List of keyword strings
	 */
	public function suggest_keywords($name, $definition = '', $relevance = '', $temperature = null)
	{
		if ($temperature === null) {
			$temperature = $this->default_temperature;
		}

		$temperature = max(0.0, min(1.0, (float)$temperature));

		if (!$this->is_configured()) {
			return $this->mock_suggest_keywords($name, $definition, $relevance);
		}

		return $this->call_llm_for_keywords($name, $definition, $relevance, $temperature);
	}

	/**
	 * Call the configured LLM API to generate keyword suggestions
	 */
	private function call_llm_for_keywords($name, $definition, $relevance, $temperature)
	{
		$prompt = $this->build_keyword_prompt($name, $definition, $relevance);

		$url = rtrim($this->api_url, '/') . '/chat/completions';

		$payload = array(
			'model'       => $this->model,
			'temperature' => $temperature,
			'messages'    => array(
				array(
					'role'    => 'system',
					'content' => 'You are a metadata specialist. When asked, you suggest concise, relevant keywords for statistical indicators and datasets. Return ONLY a JSON array of keyword strings, nothing else.'
				),
				array(
					'role'    => 'user',
					'content' => $prompt
				)
			)
		);

		$ch = curl_init($url);
		curl_setopt_array($ch, array(
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_POST           => true,
			CURLOPT_POSTFIELDS     => json_encode($payload),
			CURLOPT_HTTPHEADER     => array(
				'Content-Type: application/json',
				'Authorization: Bearer ' . $this->api_key
			),
			CURLOPT_TIMEOUT        => 30,
			CURLOPT_SSL_VERIFYPEER => true
		));

		$response = curl_exec($ch);
		$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		$curl_error = curl_error($ch);
		curl_close($ch);

		if ($curl_error) {
			log_message('error', 'LLM API curl error: ' . $curl_error);
			throw new Exception('LLM API connection error: ' . $curl_error);
		}

		if ($http_code !== 200) {
			log_message('error', 'LLM API HTTP ' . $http_code . ': ' . $response);
			throw new Exception('LLM API returned HTTP ' . $http_code);
		}

		$data = json_decode($response, true);

		if (!$data || !isset($data['choices'][0]['message']['content'])) {
			log_message('error', 'LLM API unexpected response: ' . $response);
			throw new Exception('Unexpected LLM API response format');
		}

		$content = trim($data['choices'][0]['message']['content']);

		// Strip markdown code fences if present
		$content = preg_replace('/^```(?:json)?\s*/i', '', $content);
		$content = preg_replace('/\s*```$/', '', $content);

		$keywords = json_decode($content, true);

		if (!is_array($keywords)) {
			log_message('error', 'LLM returned non-JSON content: ' . $content);
			// Try to parse as newline-separated list
			$keywords = array_filter(array_map('trim', explode("\n", $content)));
			// Remove numbering like "1. keyword"
			$keywords = array_map(function($k) {
				return preg_replace('/^\d+[\.\)]\s*/', '', $k);
			}, $keywords);
			$keywords = array_values(array_filter($keywords));
		}

		// Ensure all items are strings
		$keywords = array_map('strval', $keywords);

		return array_values($keywords);
	}

	/**
	 * Build the prompt for keyword suggestion
	 */
	private function build_keyword_prompt($name, $definition, $relevance)
	{
		$parts = array();
		$parts[] = "Suggest 10-15 concise, relevant keywords for the following statistical indicator:\n";

		if (!empty($name)) {
			$parts[] = "Indicator name: " . $name;
		}
		if (!empty($definition)) {
			$parts[] = "Definition: " . $definition;
		}
		if (!empty($relevance)) {
			$parts[] = "Development relevance: " . $relevance;
		}

		$parts[] = "\nReturn ONLY a JSON array of keyword strings. Example: [\"economic growth\", \"GDP\", \"national accounts\"]";

		return implode("\n", $parts);
	}

	/**
	 * Return mock keyword suggestions for testing when no LLM API is configured.
	 * Keywords are derived from the indicator name and definition to provide
	 * a realistic demonstration of the feature.
	 */
	private function mock_suggest_keywords($name, $definition, $relevance)
	{
		$keywords = array();

		// Extract meaningful words from the indicator name and definition
		$text = strtolower($name . ' ' . $definition . ' ' . $relevance);

		// Remove common stop words
		$stop_words = array(
			'the','a','an','and','or','but','in','on','at','to','for','of','with',
			'by','from','as','is','was','are','were','been','be','have','has','had',
			'do','does','did','will','would','shall','should','may','might','can',
			'could','this','that','these','those','it','its','not','no','all','any',
			'each','every','both','few','more','most','other','some','such','than',
			'too','very','just','about','above','after','again','also','before',
			'between','during','into','through','under','until','up','which','who',
			'data','indicator','series','rate','value','level','number','total',
			'current','per','us','dollars','percentage'
		);

		// Tokenize
		$words = preg_split('/[\s\-\/\(\)\,\.\;\:]+/', $text);
		$words = array_filter($words, function($w) use ($stop_words) {
			return strlen($w) > 2 && !in_array($w, $stop_words);
		});
		$words = array_unique($words);

		// Build keyword suggestions from extracted words
		foreach (array_slice(array_values($words), 0, 5) as $word) {
			$keywords[] = ucfirst($word);
		}

		// Add generic statistical/development keywords
		$generic = array(
			'Development indicators',
			'Statistical measurement',
			'Economic analysis',
			'Policy research',
			'Sustainable development',
			'Monitoring and evaluation',
			'Cross-country comparison',
			'Trend analysis',
			'World Bank',
			'International development'
		);

		// Pick some generic keywords to pad to ~12
		$needed = max(0, 12 - count($keywords));
		$generic_sample = array_slice($generic, 0, $needed);
		$keywords = array_merge($keywords, $generic_sample);

		return array_values(array_unique($keywords));
	}
}
