/**
 * scroll down and focus on login
 */
$(document).ready(function(){
    checkLoginStatus();
    $('html, body').animate({ scrollTop: ($('.login').first().offset().top - 10)}, 3000);
});

/******************************* START ANALYSIS ********************************/
/**
 * analyze button (Main function)
 */
$("#analyze-btn").on('click', function(){
    if (formValidation(null, 'update')) {
        var userScreenName = $("#user-search").find('input').val();
        var brandScreenName = $("#brand-search").find('input').val();
        var algorithm = $("#algorithm option:selected").val();

        if (algorithm === "IBM-Watson") {
            // loading bar
            $(".loading").show();
            $("#analyze-btn").hide();

            $.ajax({
                url: "update",
                type: "post",
                data: {
                    "userScreenName": userScreenName,
                    "brandScreenName": brandScreenName,
                    "algorithm": algorithm
                },
                success: function (data) {
                    // place results but do not show
                    $("#display").hide();
                    IBMPreviewRender(userScreenName, data.user, 'user');
                    IBMPreviewRender(brandScreenName, data.brand, 'brand');
                    resetSimScore(algorithm);

                    // loading bar
                    $(".loading").hide();
                    $("#analyze-btn").show();

                    //focus on display containers
                    $("#display").show();
                    $('html, body').animate({
                        scrollTop: ($('#display').first().offset().top - 10)
                    }, 1000);
                },
                error: function (jqXHR, exception) {
                    // loading bar
                    $(".loading").hide();
                    $("#analyze-btn").show();

                    $("#error").val(jqXHR.responseText);
                    $("#warning").modal('show');
                }
            });
        }
        else if (algorithm === "Pamuksuz-Personality") {
            $("#batch").modal('show');
        }
    }
});

/**
 * batch modal button submit on click
 */
$("#batch").find("button").on('click', function(){
    if (formValidation(null, 'batch')) {
        var userScreenName = $("#user-search").find('input').val();
        var brandScreenName = $("#brand-search").find('input').val();
        var algorithm = $("#algorithm option:selected").val();
        var email = $("#email").val();
        if (email === undefined) email="NA";

        // disable submit button when still loading
        $("#batch").find(".form-group").hide();
        $("#batch").find(".batch-notification").show();
        $("#batch").find("button").attr('disabled', true);

        $.ajax({
            url: "update",
            type: "post",
            data: {
                "userScreenName": userScreenName,
                "brandScreenName": brandScreenName,
                "algorithm": algorithm,
                "email": email,
                "sessionURL": sessionURL
            },
            success: function (data) {
                $("#batch").find(".form-group").show();
                $("#batch").find(".batch-notification").hide();
                $("#batch").find("button").removeAttr('disabled');

                // place results but do not show
                $("#batch").modal('hide');
                $("#display").hide();

                if ('sophistication' in data.user
                    && 'excitement' in data.user
                    && 'sincerity' in data.user
                    && 'competence' in data.user
                    && 'ruggedness' in data.user
                    && 'sophistication' in data.brand
                    && 'excitement' in data.brand
                    && 'sincerity' in data.brand
                    && 'competence' in data.brand
                    && 'ruggedness' in data.brand
                ){
                    $("#batch").modal('hide');
                    PamuksuzPreviewRender(userScreenName, data.user, 'user');
                    PamuksuzPreviewRender(brandScreenName, data.brand, 'brand');

                    resetSimScore(algorithm);

                    //focus on display containers
                    $("#display").show();
                    $('html, body').animate({
                        scrollTop: ($('#display').first().offset().top - 10)
                    }, 1000);
                }
                else if (('jobId' in data.user
                    && 'jobName' in data.user) ||
                    ('jobId' in data.brand
                    && 'jobName' in data.brand))
                {
                    $("#batch-confirmation").modal('show');
                }
                else{
                    $("#error").val("Unrecognized return results: "+ JSON.stringify(data));
                    $("#warning").modal('show');
                }
            },
            error: function (jqXHR, exception) {
                $("#batch").find(".form-group").show();
                $("#batch").find(".batch-notification").hide();
                $("#batch").find("button").removeAttr('disabled');

                $("#error").val(jqXHR.responseText);
                $("#warning").modal('show');
            }
        })
    }
});

$("#run-another").on('click', function(){
    $('html, body').animate({
        scrollTop: ($('.login').first().offset().top - 10)
    }, 1000);
    $("#user-search input").val("");
    $("#brand-search input").val("");

    resetAll();
});

function resetAll(){
    $("#user-container").empty();
    $("#brand-container").empty();

    resetSimScore('IBM-Watson');
    $("#history-links").empty();
    $("#history-form").empty();
    $("#history-chart").empty();

    $("#user-account h4").text("");
    $("#brand-account h4").text("");
    $("#user-account p").text("");
    $("#brand-account p").text("");
    $("#user-account a").attr("href", "");
    $("#brand-account a").attr("href", "");

    $("#display").hide();
}

/******************************* SIMILARITY SCORE ********************************/
/**
 * similarity drop down (calcuate single sim score)
 */
$("#similarity-metrics").on('change', function(){
    var option = $(this).find('option').filter(":selected").val();
    var algorithm = $("#selected-accounts").find("#user-account").find('.personality-description').attr('value');

    if (option === 'none'){
        resetSimScore();
    }else{
        $.ajax({
            url: "score",
            type: "GET",
            data: {
                "userScreenName": $("#selected-accounts").find("#user-account").find('h4').text(),
                "brandScreenName":$("#selected-accounts").find("#brand-account").find('h4').text(),
                "algorithm": algorithm,
                "option": option
            },
            success: function (data) {
                $(".loading").hide();
                updateSimScore(data.sim_score);
            },
            error: function (jqXHR, exception) {
                $("#error").val(jqXHR.responseText);
                $("#warning").modal('show');
            }
        });
    }
});

/**
 * update the similarity score
 * related to $("#similarity-metrics").on('change', function()
 * @param score
 */
function updateSimScore(score){
    var options = {
        useEasing: true,
        useGrouping: true,
        decimal: '.',
    };
    var sim = new CountUp('similarity-score', 0, score, 4, 4, options);
    if (!sim.error) {
        sim.start();
    } else {
        console.error(sim.error);
    }
};

/**
 * reset similarity score to empty whenever refresh or analyze new users
 */
function resetSimScore(algorithm) {
    if (algorithm === 'IBM-Watson'){
        $("#similarity-metrics").children('option[value="personality_sim_score"]').show();
        $("#similarity-metrics").children('option[value="needs_sim_score"]').show();
        $("#similarity-metrics").children('option[value="values_sim_score"]').show();
        $("#similarity-metrics").children('option[value="consumption_sim_score"]').show();
    }
    else{
        $("#similarity-metrics").children('option[value="personality_sim_score"]').show();
        $("#similarity-metrics").children('option[value="needs_sim_score"]').hide();
        $("#similarity-metrics").children('option[value="values_sim_score"]').hide();
        $("#similarity-metrics").children('option[value="consumption_sim_score"]').hide();
    }


    $('#similarity-metrics option:first').prop('selected', true);
    $('#similarity-score').text('0.0000');
};

google.charts.setOnLoadCallback(renderBotScore);

