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
			
			if ($this->input->get("destination")){
				$raw_destination=$this->input->get("destination");

				// Reject absolute URLs, protocol-relative URLs, and data/javascript URIs
				if (preg_match('#^(https?://|//|[a-z]+:)#i', $raw_destination)) {
					$destination=site_home();
				} else {
					// Strip path traversal sequences and null bytes
					$sanitized=str_replace(array('..', "\0"), '', $raw_destination);
					$valid_redirects=array('admin','editor','collections', 'projects', 'home', 'about', 'auth');
					$destination_parts=explode("/",$sanitized);

					if (in_array($destination_parts[0],$valid_redirects)){
						// Reconstruct URL from validated parts only
						$clean_parts=array_filter($destination_parts, function($p) { return $p !== ''; });
						$destination=implode('/', $clean_parts);
					}
				}
			}
			
			redirect($destination);
		}
		else{
			show_error("Invalid Language selected!");
		}
	}
}
/* End of file page.php */
/* Location: ./controllers/page.php */