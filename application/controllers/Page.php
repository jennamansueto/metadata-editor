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
	 * Resolve a redirect destination safely.
	 *
	 * Only same-origin relative paths whose first path segment is on an
	 * explicit allow-list are accepted. Anything else (absolute URLs,
	 * protocol-relative URLs starting with "//", backslash variants, or
	 * paths whose first segment is not allow-listed) falls back to the
	 * site home so the redirect can never be coerced to an external host.
	 *
	 * @param mixed $raw_destination
	 * @return string
	 */
	private function _safe_destination($raw_destination)
	{
		$home = site_home();

		if (!is_string($raw_destination) || $raw_destination === '') {
			return $home;
		}

		// Reject absolute or protocol-relative URLs outright. After
		// normalising backslashes we also catch "\\evil.com/x" style
		// payloads that some browsers treat as protocol-relative.
		$normalised = str_replace('\\', '/', $raw_destination);
		if (strpos($normalised, '://') !== false || strpos($normalised, '//') === 0) {
			return $home;
		}

		// Strip any leading slashes so the allow-list check operates on
		// the first real path segment.
		$relative = ltrim($normalised, '/');
		if ($relative === '') {
			return $home;
		}

		$valid_redirects = array('admin', 'editor', 'collections', 'projects', 'home', 'about', 'auth');
		$destination_parts = explode('/', $relative);

		if (!in_array($destination_parts[0], $valid_redirects, true)) {
			return $home;
		}

		return $relative;
	}
}
/* End of file page.php */
/* Location: ./controllers/page.php */
