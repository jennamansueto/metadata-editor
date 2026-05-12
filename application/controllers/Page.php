<?php
class Page extends MY_Controller {
 
    public function __construct()
    {
        parent::__construct($skip_auth=TRUE);
		$this->lang->load('general');		
		$this->lang->load('users');
		//$this->output->enable_profiler(TRUE);
    }
    
	function index()
	{	
		show_404();
	}

	function home()
	{
		if (!$this->ion_auth->logged_in()) {
			redirect("auth/login/", 'refresh');
    	}

		$content=$this->load->view('homepage', null,true);
		$this->template->write('title', "Metadata editor",true);
		$this->template->write('content', $content,true);
	  	$this->template->render();
	}

	function about()
	{
		return $this->home();
	}
	
	function switch_language($lang=NULL)
	{
		if ($lang==NULL){
			show_404();
		}

		$valid_languages=$this->config->item("supported_languages");

		if (in_array($lang,$valid_languages))
		{
			//set language in the user session cooke
			$this->session->set_userdata('language',strtolower($lang));

			$destination=site_home();

			$requested = $this->input->get("destination");
			if ($requested !== FALSE && $requested !== NULL && $requested !== ''){
				$safe = $this->_sanitize_redirect_destination($requested);
				if ($safe !== NULL) {
					$destination = site_url($safe);
				}
			}

			redirect($destination);
		}
		else{
			show_error("Invalid Language selected!");
		}
	}

	/**
	 * Validate a user-supplied `destination` query parameter for the
	 * language switcher and return a safe relative path on success.
	 *
	 * To avoid open-redirect vulnerabilities (phpsecurity:S5146) the
	 * destination must:
	 *   - be a string
	 *   - not contain a scheme/authority (no "://", no leading "//" or
	 *     "\\", no embedded "@", no backslashes, no NUL bytes)
	 *   - resolve to a relative path whose first segment is in the
	 *     application's internal allow-list
	 *
	 * Returns the cleaned relative path (without leading slash) on
	 * success, or NULL when the destination must be rejected.
	 */
	private function _sanitize_redirect_destination($destination)
	{
		if (!is_string($destination)) {
			return NULL;
		}

		// Reject control characters / NUL bytes outright.
		if (preg_match('/[\x00-\x1F\x7F]/', $destination)) {
			return NULL;
		}

		// Reject anything that looks like an absolute or protocol-relative
		// URL. The wikipedia open-redirect guidance highlights that simple
		// prefix checks miss back-slash and "//" forms, so we forbid both.
		if (strpos($destination, '://') !== false
			|| strpos($destination, '\\') !== false
			|| strpos($destination, "\t") !== false
			|| substr($destination, 0, 2) === '//'
			|| substr($destination, 0, 1) === '@') {
			return NULL;
		}

		// Normalise a single leading slash so the value is treated as a
		// site-relative path.
		$path = ltrim($destination, '/');
		if ($path === '') {
			return NULL;
		}

		// First path segment must be one of the known internal controllers.
		$valid_redirects = array('admin', 'editor', 'collections', 'projects', 'home', 'about', 'auth');
		$first_segment = strtolower(explode('/', $path, 2)[0]);

		// Strip any querystring/fragment from the first segment before
		// comparing so values like "auth?next=http://evil" are rejected.
		$first_segment = preg_replace('/[?#].*$/', '', $first_segment);

		if (!in_array($first_segment, $valid_redirects, true)) {
			return NULL;
		}

		return $path;
	}
}
/* End of file page.php */
/* Location: ./controllers/page.php */