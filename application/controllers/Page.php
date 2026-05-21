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
				$destination=$this->input->get("destination");

				$valid_redirects=array('admin','editor','collections', 'projects', 'home', 'about', 'auth');

				$destination_parts=explode("/",$destination);

				if (!in_array($destination_parts[0],$valid_redirects)){
					$destination=site_home();
				}

				// Reject paths containing traversal sequences, protocol schemes, or double-slashes
				if (preg_match('#(\\.\\.\/|:\/\/|^\/\/)#', $destination)) {
					$destination=site_home();
				}

				// Strip leading slashes to prevent protocol-relative URLs
				$destination = ltrim($destination, '/');
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