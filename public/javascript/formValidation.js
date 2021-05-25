/**
 * frontend validation
 * @param whichPerformance
 * @returns {boolean}
 */
function formValidation($this, whichPerformance){
    if (whichPerformance === 'update'){
        if ($("#algorithm option:selected").val() === 'none'){
            $("#modal-message").text('You have to select a brand personality algorithm.');
            $("#alert").modal('show');
            return false;
        }

        if ($("#user-search").find('input').val() === ''
            || $("#user-search").find('input').val() === undefined){

            $("#modal-message").text('You have to provide screen name of the user.');
            $("#alert").modal('show');
            return false;
        }

        if ($("#brand-search").find('input').val() === ''
            || $("#brand-search").find('input').val() === undefined){

            $("#modal-message").text('You have to provide screen name of the brand.');
            $("#alert").modal('show');

            return false;
        }
    }
    else if (whichPerformance === 'batch'){
        if ($("#email").length &&
            ($("#email").val() === "" || $("#email").val() === undefined || $("#email").val().indexOf("@") == -1)){
            $("#modal-message").text('You have to provide valid email address ' +
                'so that we can inform you when computation is finished.');
            $("#alert").modal('show');

            return false;
        }
    }
    else if (whichPerformance === 'history'){
        var count = 0 ;
        var screenNames = [];
        $('.history-input-bulk-comparison').each(function(){
            if(screenNames.indexOf($(this).val()) === -1 && $(this).val() !== ''){
                count++;
                screenNames.push($(this).val());
            }
        });

        if (screenNames.length < 2){
            $("#modal-message").text('You have to provide at least 2 different screen names to compare!');
            $("#alert").modal('show');

            return false;
        }
    }
    else if (whichPerformance === 'bluemix-auth'){
        if ($("#bluemix-personality-apikey").val() === ''){
            $("#modal-message").text('You have to provide a valid IBM personality insight key!');
            $("#alert").modal('show');

            return false;
        }
    }
    else if (whichPerformance === 'twitter-auth'){
        if ($("#twitter-pin").val() === ''){
            $("#modal-message").text('You have to copy-paste the twitter pin!');
            $("#alert").modal('show');

            return false;
        }
    }
    else if (whichPerformance === 'botometer'){
        if (($this) === ''){
            $("#modal-message").text('You must tell Botometer which twitter user you want to check!');
            $("#alert").modal('show');

            return false;
        }
    }

    return true;
}
