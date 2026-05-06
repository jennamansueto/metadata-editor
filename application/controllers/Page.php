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
	 * Resolve a user-supplied destination to a safe internal URL.
	 *
	 * Rejects absolute and protocol-relative URLs (e.g. "https://evil",
	 * "//evil") so that an attacker cannot use this controller as an open
	 * redirect, then verifies the first path component is in a static
	 * allow-list of known internal sections before passing it through
	 * site_url().
	 *
	 * @param string|null $destination
	 * @return string Absolute URL safe to redirect to.
	 */
	private function _safe_destination($destination)
	{
		if (!is_string($destination) || $destination === '') {
			return site_home();
		}

		// Block absolute URLs ("scheme://...") and protocol-relative URLs ("//host/...").
		if (preg_match('#^([a-z][a-z0-9+\-.]*:)?//#i', $destination)) {
			return site_home();
		}

		$valid_redirects = array('admin','editor','collections','projects','home','about','auth');
		$first_segment   = strtok(ltrim($destination, '/'), '/');

		if ($first_segment === false || !in_array($first_segment, $valid_redirects, true)) {
			return site_home();
		}

		return site_url(ltrim($destination, '/'));
	}
}
/* End of file page.php */
/* Location: ./controllers/page.php */