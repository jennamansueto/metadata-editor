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

			$requested_destination=$this->input->get("destination");
			if ($requested_destination){
				$valid_destination=$this->validate_switch_language_destination($requested_destination);
				if ($valid_destination !== null){
					$destination=$valid_destination;
				}
			}

			redirect($destination);
		}
		else{
			show_error("Invalid Language selected!");
		}
	}

	/**
	 * Validate a user-supplied redirect target for switch_language().
	 *
	 * Only accepts relative paths whose first segment is on a fixed allow-list.
	 * Rejects absolute URLs, protocol-relative URLs (`//host`), and backslash
	 * tricks that would otherwise let an attacker redirect off-site
	 * (SonarQube rule php:S5146, CWE-601).
	 *
	 * @param string $destination Raw value from the `destination` query string
	 * @return string|null Sanitised relative path to pass to redirect(), or null
	 *                    if the input is not a valid in-site target.
	 */
	private function validate_switch_language_destination($destination)
	{
		if (!is_string($destination) || $destination === '') {
			return null;
		}

		if (strpbrk($destination, "\\\r\n\t") !== false) {
			return null;
		}

		$normalised = ltrim($destination, '/');
		if ($normalised === '' || $normalised[0] === '/') {
			return null;
		}

		if (strpos($normalised, '://') !== false) {
			return null;
		}

		$first_segment = explode('/', $normalised, 2)[0];
		$valid_redirects = array('admin', 'editor', 'collections', 'projects', 'home', 'about', 'auth');
		if (!in_array($first_segment, $valid_redirects, true)) {
			return null;
		}

		return $normalised;
	}
}
/* End of file page.php */
/* Location: ./controllers/page.php */
