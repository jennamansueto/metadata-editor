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

			$destination = $this->_safe_destination($this->input->get("destination"));

			redirect($destination);
		}
		else{
			show_error("Invalid Language selected!");
		}
	}

	/**
	 * Resolve the post-language-switch redirect target.
	 *
	 * Treats the caller-supplied destination as untrusted and returns
	 * site_home() unless it is a relative path whose first segment is
	 * one of the known internal sections. This prevents the open-redirect
	 * class of attack flagged by phpsecurity:S5146.
	 *
	 * @param string|null $destination Raw value from the query string.
	 * @return string A safe URL to redirect to.
	 */
	private function _safe_destination($destination)
	{
		$home = site_home();

		if (!is_string($destination) || $destination === '') {
			return $home;
		}

		// Reject anything that could push the browser to another origin:
		// absolute URLs ("https://evil"), scheme-relative URLs ("//evil"),
		// backslash tricks, control characters, or whitespace.
		if (preg_match('#^[a-z][a-z0-9+.\-]*:#i', $destination)) {
			return $home;
		}
		if (strpos($destination, '//') === 0 || strpos($destination, '\\\\') === 0) {
			return $home;
		}
		if (strpbrk($destination, "\\\r\n\t") !== false) {
			return $home;
		}

		$valid_redirects = array('admin', 'editor', 'collections', 'projects', 'home', 'about', 'auth');

		// Strip a single leading slash so allowlist matching works for both
		// "admin/..." and "/admin/..." inputs.
		$path = ltrim($destination, '/');
		$first_segment = strtok($path, '/?#');

		if ($first_segment === false || !in_array($first_segment, $valid_redirects, true)) {
			return $home;
		}

		return $path;
	}
}
/* End of file page.php */
/* Location: ./controllers/page.php */