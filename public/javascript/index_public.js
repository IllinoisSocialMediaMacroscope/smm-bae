$("#analyze-btn").on('click', function(){
    $.ajax({
        url:"update",
        type:"post",
        data:{},
        success:function(data){
            // if error then prompt user to rename
            $(".loading").hide();
            if ('ERROR' in data){
                $("#error").val(JSON.stringify(data));
                $("#warning").modal('show');
            }else{
                console.log(data);
            }
        },
        error: function(jqXHR, exception){
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });
})
