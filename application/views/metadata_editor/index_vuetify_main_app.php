<script>
        <?php if (empty($metadata)):?>
            var project_metadata={};
        <?php else:?>
            var project_metadata={}<?php //echo json_encode($metadata);?>;
        <?php endif;?>

        <?php if (empty($sid)):?>
            var project_sid=null;
        <?php else:?>
            var project_sid=<?php echo $sid;?>;
        <?php endif;?>


        let project_idno='<?php echo isset($idno) ? $idno : '';?>';
        let project_type='<?php echo isset($type) ? $type : '';?>';
        let user_has_edit_access=<?php echo $user_has_edit_access ? 'true' : 'false';?>;

        // DSD features
        var dsd_temporary_features_enabled = false;

        const isUniqueIDNO = (value) => {
                let sid='<?php echo $sid;?>';
                let url='<?php echo site_url('/api/datasets/check_idno/');?>' + value + '/' + sid;
                
                return axios.get(url)
                .then(function (response) {                    
                    if (response.status==200 && response.data.id==sid){
                        return {
                            valid: true,
                            data:{
                                message: 'IDNO is valid'
                            }
                        }
                    }

                    return {
                        valid: response.status==404,
                        data:{
                            message: 'IDNO exists'
                        }
                    }
                })
                .catch(function (error) {                        
                    console.log(error);                      
                    return {
                        valid: error.response.status==404,//valid if statuscode==404
                        data:{
                            message: 'IDNO not found'
                        }
                    }
                });        
        };
</script>
