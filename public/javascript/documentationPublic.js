/**
 * toggle effect on each sub-division in documentation page
 */
$(".header2").on('click',function(){
    if ($(this).find("i").hasClass('fa-chevron-down')){
        $(this).find("i").removeClass('fa-chevron-down');
        $(this).find("i").addClass('fa-chevron-up');
    }else{
        $(this).find("i").addClass('fa-chevron-down');
        $(this).find("i").removeClass('fa-chevron-up');
    }

    $(this).find(".content2").toggle();
})
