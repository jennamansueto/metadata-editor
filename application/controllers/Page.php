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

			$requested=$this->input->get("destination");
			if ($requested){
				// Only allow same-origin, relative redirects. Reject anything
				// that could be interpreted as an absolute URL or
				// protocol-relative URL (//evil.com), and require that the
				// leading path segment belong to a known section of the app.
				$valid_redirects=array('admin','editor','collections', 'projects', 'home', 'about', 'auth');

				$is_safe=is_string($requested)
					&& $requested !== ''
					&& strpos($requested, "\n") === false
					&& strpos($requested, "\r") === false
					&& strpos($requested, '\\') === false
					&& strpos($requested, '://') === false
					&& strpos($requested, '//') !== 0;

				if ($is_safe) {
					$normalized=ltrim($requested, '/');
					$destination_parts=explode('/', $normalized);
					if (in_array($destination_parts[0], $valid_redirects, true)) {
						$destination='/' . $normalized;
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