/**
 * scroll down and focus on login
 */
$(document).ready(function(){
    $("#login").fadeIn(2000);
    $('html, body').animate({ scrollTop: ($('#login').first().offset().top - 10)}, 3000);
    checkLoginStatus();
});

/**
 * select personality algorithm and show citations
 */
$("#personality-algorithm").find('select').on('change', function(){
    var option = $(this).find('option').filter(":selected").val();
    if (option === 'IBM-Watson'){
        $("citation")
            .attr('data-original-title', "<p><b>Please cite it in your work using the citation below:</b><br><br>\
            Yun, J. T., Vance, N., Wang, C., Troy, J., Marini, L., Booth, R., Nelson, T., Hetrick, A., Hodgekins, H. (2018). \
            The Social Media Macroscope. In Gateways 2018. \
            <a href='https://doi.org/10.6084/m9.figshare.6855269.v2' target='_blank'>https://doi.org/10.6084/m9.figshare.6855269.v2</a><br><br></p>\
            Arnoux, Pierre-Hadrien, Anbang Xu, Neil Boyette, Jalal Mahmud, Rama Akkiraju, \
            and Vibha Sinha. <a href='https://aaai.org/ocs/index.php/ICWSM/ICWSM17/paper/view/15681' target='_blank'>25 \
            Tweets to Know you: A New Model to Predict Personality with Social Media.\
            </a> AAAI Publications, Eleventh International AAAI Conference on Web and Social Media (2017): pp. 472-475.<br><br>\
            <a href='https://console.bluemix.net/docs/services/personality-insights/references.html#references' target='_blank'>\
            More Research References ...</a>")
            .tooltip('fixTitle')
            .tooltip('show');
        checkIBMStatus();
    }
    else if (option === 'TwitPersonality'){
        $("citation")
            .attr('data-original-title', "<p><b>Please cite it in your work using the citation below:</b><br><br>\
            Yun, J. T., Vance, N., Wang, C., Troy, J., Marini, L., Booth, R., Nelson, T., Hetrick, A., Hodgekins, H. (2018). \
            The Social Media Macroscope. In Gateways 2018. \
            <a href='https://doi.org/10.6084/m9.figshare.6855269.v2' target='_blank'>https://doi.org/10.6084/m9.figshare.6855269.v2</a><br><br></p>\
            Carducci, Giulio, et al. <a href='http://www.mdpi.com/2078-2489/9/5/127/htm' target='_blank'>TwitPersonality: Computing Personality Traits \
            from Tweets Using Word Embeddings and Supervised Learning</a>. Information 9.5 (2018): 127")
            .tooltip('fixTitle')
            .tooltip('show');
        $("#analyze-btn").prop('disabled', false);
    }
    else{
        $("citation").attr('data-original-title', "").tooltip('hide');
    }
})

/******************************* AUTHORIZATION ********************************/
/**
 * whenever error modal shows, check if credential is valid or not
 */
$('#warning').on('shown.bs.modal', function (e) { checkLoginStatus(); });

/**
 * Twitter authorization
 */
$("#twitter-auth").find('a').on('click', function(){
    $(this).attr('href', 'login/twitter?currentURL=' + newPath);
    $("#twitter-callback").modal('show');
});

/**
 * post the pin to retreive Twitteraccess key and token
 */
$("#twitter-pin-submit").on('click', function(){
    if (formValidation(null, 'twitter-auth')) {
        $.ajax({
            type: 'post',
            url: 'login/twitter',
            data: {
                currentURL:newPath,
                twtPin: $("#twitter-pin").val()
            },
            success: function (data) {
                window.location.replace(data.redirectUrl);
            },
            error: function (jqXHR, exception) {
                $("#twitter-callback").modal('hide');
                $("#error").val(jqXHR.responseText);
                $("#warning").modal('show');
            }
        });
    }
});

/**
 * save IBM personality username and password
 */
$("#bluemix-pin-submit").on('click', function(){
    if (formValidation(null, 'bluemix-auth')){
        $.ajax({
            type: 'post',
            url: 'login/bluemix',
            data: {
                currentURL:newPath,
                bluemixPersonalityUsername: $("#bluemix-personality-username").val(),
                bluemixPersonalityPassword: $("#bluemix-personality-password").val()
            },
            success: function (data) {
                window.location.replace(data.redirectUrl);
            },
            error: function (jqXHR, exception) {
                $("#twitter-callback").modal('hide');
                $("#error").val(jqXHR.responseText);
                $("#warning").modal('show');
            }
        });
    }
});

/******************************** Bot or not ************************************/
/**
 * call botometer to detect if the user name is a bot or not
 */
$(".botometer-icon").on('click', function(){

    var screenName = $(this).parent().prev().find('input').val();

    if (formValidation(screenName, 'botometer')){
        $('#botometer-screen-name').text('@' + screenName);
        $("#botometer-modal").modal('show');
        $("#botometer-modal").find(".login-notes").show();
        $("#botometer-button").show();
        $("#botometer-display").hide();
        $("#botometer-modal").find(".loading").hide();
    }
});


$("#botometer-button").on('click', function(){

    $("#botometer-modal").find(".loading").show();
    $.ajax({
        url: "botometer",
        type: "GET",
        data: {
            "screenName":$('#botometer-screen-name').text()
        },
        success: function (scores) {
            $("#botometer-modal").find(".login-notes").hide();
            $("#botometer-button").hide();
            $("#botometer-display").show();
            $("#botometer-modal").find(".loading").hide();
            renderBotScore(scores);
            downloadBotScore(scores);
        },
        error: function (jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });

});

function renderBotScore(scores){
    // draw gauge
    var data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        ['Bot Score', scores['display_scores']['english']]
    ]);

    var options = {
        min:0,
        max:5,
        width: 200,
        height: 200,
        redFrom: 3.5, redTo: 5,
        yellowFrom:1.5, yellowTo: 3.5,
        greenFrom:0, greenTo:1.5,
        majorTicks: 0.5
    };

    var chart = new google.visualization.Gauge(document.getElementById('botometer-gauge'));
    chart.draw(data, options);

}

function downloadBotScore(scores){
    // generate downloadable full botometer scores report
    var a = $("#botometer-display").find('a');
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scores));
    a.attr('href', 'data:' + data);
    a.attr('download', scores['user']['screen_name'] + '_botometer_scores.json');
}

/******************************* START ANALYSIS ********************************/
/**
 * analyze button (Main function)
 */
$("#analyze-btn").on('click', function(){
    if (formValidation(null, 'update')) {
        var userScreenName = $("#user-search").find('input').val();
        var brandScreenName = $("#brand-search").find('input').val();
        var algorithm = $("#personality-algorithm").find('select').find(':selected').val();

        // loading bar
        $(".loading").show();
        $("#analyze-btn").hide();

        //focus on loading bar
        $('html, body').animate({
            scrollTop: ($('.loading').first().offset().top - 10)
        }, 1000);

        $.ajax({
            url: "update",
            type: "post",
            data: { "userScreenName": userScreenName,
                "brandScreenName":brandScreenName,
                "algorithm":algorithm,
                "sessionID": sessionID
            },
            success: function (data) {
                // loading bar
                $(".loading").hide();
                $("#analyze-btn").show();

                //focus on display containers
                $("#display").show();
                $('html, body').animate({
                    scrollTop: ($('#display').first().offset().top - 10)
                }, 1000);

                update(data.user, 'user');
                update(data.brand, 'brand');
                resetSimScore(data.algorithm);
                updateHistory();
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
});

/**
 * update the main personality panel
 * related to $("#analyze-btn").on('click', function()
 * @param data
 * @param role: user or brand
 */
function update(data, role) {
    var promise = new Promise(function(resolve, reject) {
        if (data != undefined) {
            $("#twitter-" + role + "-container").empty();

            if ('warnings' in data.personality && data.personality.warnings.length > 0){
                var warningMessage = data.personality.warnings[0].message;
            }else{
                var warningMessage = "";
            }

            $("#twitter-"+ role + "-container").append(
                '<div class="personality-header">\
                    <i class="fas fa-exclamation-circle pull-right"\
                        data-toggle="tooltip" data-placement="left" title="' + warningMessage + '"></i>\
                    <div class="row">\
                        <div class="col col-md-3 col-sm-3 col-xs-3">\
                            <img src="' + data.profile_img + '"/>\
                        </div>\
                        <div class="col col-md-9 col-sm-9 col-xs-9">\
                            <h4 id="' + role +  '-screen-name">\
                                <a target="_blank" href="https://twitter.com/' + data.screen_name +'">' + data.screen_name + '</a>\
                            </h4>\
                            <h4 class="word-count">Word Count: </h4>\
                            <h4 class="number">' + data.personality.word_count + '</h4>\
                        </div>\
                    </div>\
                </div>\
                <div class="personality persona"></div>\
                <div class="personality needs"></div>\
                <div class="personality values"></div>\
                <div class="personality consumption-preferences"></div>\
                <div class="button-group">\
                    <a class="btn btn-primary btn-block" href="download?screenName=' + data.screen_name +'&sessionID=' + sessionID + '" target="_blank">Download</a>\
                </div>');
            resolve();
        }
        else{
            reject();
        }
    })

    promise.then(() =>{
        if (data.personality.personality != undefined) updatePersonality(data.personality.personality, role);
        if (data.personality.consumption_preferences != undefined) updateConsumptionPreference(data.personality.consumption_preferences, role);
        if (data.personality.needs != undefined) updateNeeds(data.personality.needs, role);
        if (data.personality.values != undefined) updateValues(data.personality.values, role);

        //tooltip
        $(function() { $('[data-toggle="tooltip"]').tooltip()});
    });

};

/**
 * update the Needs barchart
 * @param needs
 * @param role: user or brand
 */
function updateNeeds(needs, role){
    $("#twitter-"+ role + "-container").find(".personality.needs").append(
        '<h3 class="category" data-toggle="tooltip" data-placement="top" \
        title="Needs describe at a high level those aspects of a product that are likely to resonate with the \
        author of the input text. The following describes the twelve needs that the service evaluates.">Needs</h3> \
        <div id="' + role + '-needs-chart"></div>');

    var table = [['','percentile']]
    $.each(needs, function(i, content){
        table.push([content['name'],content['percentile']]);
    });

    var dataTable = google.visualization.arrayToDataTable(table);
    var materialOptions = {
        bars: 'horizontal',
        height: '400',
        legend: { position: 'none' },
        axes: {
            y: {
                0: {side: 'right'}
            }
        },
        vAxis: { textStyle: {color:'#b04b39',fontSize:'14', fontName:'Monda'}},
        hAxis: { textStyle: {color:'#b04b39',fontSize:'14', fontName:'Monda'}, viewWindow:{max:1}},
        tooltip: {
            textStyle: {
                color:'black'
            }
        },
        backgroundColor:'transparent',
        colors:['#b04b39']
    };
    var materialChart = new google.charts.Bar(document.getElementById(role + '-needs-chart'));
    materialChart.draw(dataTable, google.charts.Bar.convertOptions(materialOptions));
};

/**
 * update the Value barchart
 * @param values
 * @param role
 */
function updateValues(values, role){
    $("#twitter-"+ role + "-container").find(".personality.values").append(
        '<h3 class="category" data-toggle="tooltip" data-placement="top" \
        title="Values describe motivating factors that influence the author\'s decision-making.\
        The following describes the five values that the service infers.">Values</h3>\
        <div id="' + role + '-values-chart"></div>');

    var table = [['','percentile']]
    $.each(values, function(i, content){
        table.push([content['name'],content['percentile']]);
    });

    var dataTable = google.visualization.arrayToDataTable(table);
    var materialOptions = {
        bars: 'horizontal',
        legend: { position: 'none' },
        axes: {
            y: {
                0: {side: 'right'}
            }
        },
        vAxis: { textStyle: {color:'#146563',fontSize:'14', fontName:'Monda'}},
        hAxis: { textStyle: {color:'#146563',fontSize:'14', fontName:'Monda'},viewWindow:{max:1}},
        tooltip: {
            textStyle: {
                color:'black'
            }
        },
        backgroundColor:'transparent',
        colors:['#2a444b']
    };
    var materialChart = new google.charts.Bar(document.getElementById(role+'-values-chart'));
    materialChart.draw(dataTable, google.charts.Bar.convertOptions(materialOptions));
};

/**
 * update the personality barchart and scores
 * @param personality
 * @param role
 */
function updatePersonality(personality, role){
    $("#twitter-"+ role + "-container").find(".personality.persona").append(
        '<h3 class="category" data-toggle="tooltip" data-placement="top" \
         title="Big Five personality characteristics represent the most widely used model for generally describing \
         how a person engages with the world. The model includes five primary dimensions.">Personality</h3>\
         <div id="' + role + '-personality-chart"></div>');

    $.each(personality, function(i, content){
        $("#" + role + "-personality-chart").append('<div class="personality ' + content['trait_id'] + '">\
                <h4 class="word-count">' + content['name'] + '&nbsp</h4>\
                <h4 class="number">'+ (content['percentile'] * 100).toFixed(2)  +'%</h4>\
            </div>');

        // if it has children scores
        if ('children' in content){
            $("#twitter-"+ role + "-container").find(".personality." + content['trait_id']).append(
                '<button class="expand-personality-btn">\
                    <i class="fas fa-chevron-down"></i>\
                </button>\
                <div id="' + role + "-" + content['trait_id'] + '"></div>');

            var table = [['', 'percentile']];
            $.each(content['children'], function(j,child){
                table.push([child['name'], child['percentile']])
            });

            var dataTable = google.visualization.arrayToDataTable(table);
            var materialOptions = {
                bars: 'horizontal',
                legend: { position: 'none' },
                axes: {
                    y: {
                        0: {side: 'right'}
                    }
                },
                hAxis: { viewWindow:{max:1}, textStyle: {fontName:'Monda'}},
                vAxis: {textStyle: {fontName:'Monda'}},
                tooltip: {
                    textStyle: {
                        color:'black'
                    }
                },
                backgroundColor:'transparent',
                colors:'#2a444b'
            };

            var materialChart = new google.charts.Bar(document.getElementById(role + "-" + content['trait_id']));
            materialChart.draw(dataTable, google.charts.Bar.convertOptions(materialOptions));
            google.visualization.events.addListener(materialChart, 'ready', function () {
                $("#" + role + "-" + content['trait_id']).hide();
            });
        }
    });

    $("#twitter-"+ role + "-container").find(".expand-personality-btn").on('click',function(){
        if ($(this).find('i').hasClass('fa-chevron-down')){
            $(this).find('i').removeClass('fa-chevron-down');
            $(this).find('i').addClass('fa-chevron-up');
        }else{
            $(this).find('i').addClass('fa-chevron-down');
            $(this).find('i').removeClass('fa-chevron-up');
        }
        $(this).next().toggle();
    });

};

/**
 * update the consumption preference table
 * @param preference
 * @param role
 */
function updateConsumptionPreference(preference, role){
    $("#twitter-"+ role + "-container").find(".personality.consumption-preferences").append(
        '<h3 class="category"\
         data-toggle="tooltip" data-placement="top" \
         title="The service groups the more than 40 consumption preferences into eight high-level categories. \
         The preferences indicate the author\'s likelihood to prefer different \
         products, services, and activities.">Consumption Preference</h3>\
         <div id="' + role + '-consumption-chart"></div>');

    var table = []
    $.each(preference, function(i, content) {
        $.each(content['consumption_preferences'], function (j, child) {
            if (child['score'] == 1) {
                table.push([child['name'], true]);
            } else {
                table.push([child['name'], false]);
            }
        });
    });

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Consumption Preferences');
    data.addColumn('boolean', 'Likely');
    data.addRows(table);

    materialOptions = {
        showRowNumber: false,
        width: '100%',
        pageSize: 5,
        cssClassNames:{
            headerRow: 'consumption-header-row',
            headerCell:'consumption-table-cell',
            tableCell:'consumption-table-cell'
        }
    };

    var materialTable = new google.visualization.Table(document.getElementById(role +'-consumption-chart'));
    materialTable.draw(data, materialOptions);
};

/******************************* SIMILARITY SCORE ********************************/
/**
 * similarity drop down (calcuate single sim score)
 */
$("#similarity-metrics").on('change', function(){
    var option = $(this).find('option').filter(":selected").val();

    // determine which algorithm by looking at the display
    // if only personality shows and the rest div is empty
    // it is twitPersonality
    if ($(".needs").is(':empty')
        && $(".values").is(':empty')
        && $(".consumption-preferences").is(':empty')){
        var algorithm = 'TwitPersonality';
    }
    else{
        var algorithm = 'IBM-Watson';
    }

    if (option === 'none'){
        resetSimScore();
    }else{
        $.ajax({
            url: "score",
            type: "GET",
            data: { "userScreenName": $("#user-screen-name").find('a').text(),
                "brandScreenName":$("#brand-screen-name").find('a').text(),
                "sessionID": sessionID,
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

    if (algorithm === 'TwitPersonality'){
        $("#similarity-metrics").children('option[value="personality_sim_score"]').show();
        $("#similarity-metrics").children('option[value="needs_sim_score"]').hide();
        $("#similarity-metrics").children('option[value="values_sim_score"]').hide();
        $("#similarity-metrics").children('option[value="consumption_sim_score"]').hide();
    }else if (algorithm === 'IBM-Watson'){
        $("#similarity-metrics").children('option[value="personality_sim_score"]').show();
        $("#similarity-metrics").children('option[value="needs_sim_score"]').show();
        $("#similarity-metrics").children('option[value="values_sim_score"]').show();
        $("#similarity-metrics").children('option[value="consumption_sim_score"]').show();
    }

    $('#similarity-metrics option:first').prop('selected', true);
    $('#similarity-score').text('');


};

/******************************* HISTORY PANEL ********************************/
/**
 * update filelist in history panel
 */
function updateHistory(){
    $.ajax({
        url: "history",
        type: "GET",
        data: { "sessionID": sessionID },
        success: function (data) {
            $(".loading").hide();
            $("#history-chart").empty();
            renderHistoryList(data.historyList);
        },
        error: function (jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });
};

/**
 * seperate historylist(foldername) with different algorithms
 * the results will be used twice: in history list adding tags to each item
 * in bulk comparison generate the auto comparison list
 * hence save it in local storage
 * @param historyList
 */
function seperateByAlgorithm(historyList){
    var folderNames = {'IBM-Personality':[], 'TwitPersonality':[]};
    $.each(historyList,function(i, val) {
        var folderName = Object.keys(val)[0];
        var fileNames = val[folderName];
        fileNames.forEach(filename => {
            if (filename.slice(-17) === '_personality.json') {
                folderNames['IBM-Personality'].push(folderName);
            }
            if (filename.slice(-21) === '_twitPersonality.json') {
                folderNames['TwitPersonality'].push(folderName);
            }
        });
    });
    localStorage.setItem('folderNames', JSON.stringify(folderNames));
}

/**
 * rendering file list in hisotry panel
 * @param historyList
 */
function renderHistoryList(historyList){
    $("#history-links").empty();
    $("#history-links").append('<div class="personality-header"><h2>History</h2></div>');

    // folderNames = {'IBM':[screenname1, screename2..], 'Twit':[screename1, screename3...]}
    seperateByAlgorithm(historyList);
    var folderNames = JSON.parse(localStorage.getItem('folderNames'));

        $.each(historyList,function(i, val){
        var screenName = Object.keys(val)[0];

        $("#history-links").append('<div class="history-link" value="' + screenName + '">\
            <p>'+screenName +'</p>\
            <button onclick="deleteRemote(`'+ screenName + '`);">\
                <i class="fas fa-trash-alt"/>\
            </button>\
            <a href="download?screenName='+screenName +'&sessionID=' + sessionID + '" target="_blank"">\
                <i class="fas fa-download"/>\
            </a>\
          </div>');

        if (folderNames['IBM-Personality'].indexOf(screenName) > -1){
            $(".history-link[value=" + screenName + "]").append('<kbd class="tag-IBM">IBM</kbd>');
        }
        if (folderNames['TwitPersonality'].indexOf(screenName) > -1){
            $(".history-link[value=" + screenName + "]").append('<kbd class="tag-Twit">TWIT</kbd>');
        }

    });

    // history bulk comparison
    $("#history-form").empty();
    $("#history-form").append('<div class="history-input">\
                                    <select class="history-input-bulk-comparison"></select>\
                                    <button id="history-input-btn"><i class="fas fa-plus-circle"></i></button>\
                                </div>\
                               <button class="btn btn-primary btn-block" id="history-btn">bulk comparison</button>');
    var algorithm = $("#history-algorithm input[name=history-algorithm]:checked").val();
    addBulkComparisonSelection(folderNames[algorithm]);

    // add more input box
    $("#history-input-btn").on('click', function(){
        $("#history-form").prepend('<div class="history-input">\
                                    <select class="history-input-bulk-comparison"></select>\
                                    <button class="history-input-del-btn"><i class="fas fa-minus-circle"></i></button>\
                                </div>')
        var algorithm = $("#history-algorithm input[name=history-algorithm]:checked").val();
        addBulkComparisonSelection(folderNames[algorithm]);

        $(".history-input-del-btn").on('click', function(){
            $(this).parent().remove();
        });
    });

    historyBulkComparison();
};

/**
 * change autocomplete list based on different models
 */
$("#history-algorithm input").on('change', function(){
    updateHistory();
});

/**
 * compose history panel bulk comparison screenName lists
 * @param list
 */
function addBulkComparisonSelection(list){
    $(".history-input-bulk-comparison").each(function(i, obj){
        if ($(obj).children().length === 0) {
            $(obj).append('<option>please choose...</option>')
            $(list).each(function(i, item) {
                $(obj).append('<option>' + item + '</option>')
            });
        }
    });
};

/**
 * bulk comparison
 */
function historyBulkComparison(){
    $("#history-btn").on('click', function(){
        if (formValidation(null, 'history')) {
            var screenNames = [];
            $('.history-input-bulk-comparison').each(function(){
                if(screenNames.indexOf($(this).val()) === -1
                    && $(this).val() !== 'please choose...') screenNames.push($(this).val());
            });

            var algorithm = $("#history-algorithm input[name=history-algorithm]:checked").val();

            $.ajax({
                url: "history",
                type: "post",
                data: JSON.stringify({
                    screenNames:screenNames,
                    sessionID: sessionID,
                    algorithm: algorithm

                }),
                contentType: "application/json",
                success: function (data) {
                    $("#history-chart").empty();
                    $("#history-chart").append('<h3>Similarity Matrix</h3>');
                    $("#history-chart").show();
                    drawCorrelationMatrix({
                        container : '#history-chart',
                        data      : data['correlation_matrix_no_legends'],
                        labels    : screenNames,
                        start_color : '#ffffff',
                        end_color : '#b04b39'
                    });
                    $("#history-chart").append('<div class="button-group">\
                                                <button class="btn btn-primary btn-sm" id="similarity-matrix-btn"><i class="fas fa-file-download"></i>\
                                                    Similarity</button>\
                                                <button class="btn btn-primary btn-sm" id="comparison-table-btn"><i class="fas fa-file-download"></i>\
                                                    Personality</button>\
                                                </div>')

                    // downloads
                    frontendDownload("#similarity-matrix-btn", data['correlation_matrix'], 'Bulk_Similarity_Matrix.csv');
                    frontendDownload("#comparison-table-btn", data['comparison_table'], 'Bulk_Personality_Table.csv');

                    // scroll to similarity matrix
                    console.log( $('#history-chart')[0].scrollHeight);
                    console.log( $('#history-chart')[0].clientHeight);

                    $('#bulk-comparison').animate({ scrollTop: $('#history-chart').first().offset().top - 10}, 3000);
                },
                error: function(jqXHR, exception) {
                    $(".loading").hide();
                    $("#error").val(jqXHR.responseText);
                    $("#warning").modal('show');
                }
            });
        }
    });
};

/**
 * delete button in the history panel
 * @param screenName
 */
function deleteRemote(screenName){
    $.ajax({
        url: "deleteRemote",
        type: "get",
        data: { "screenName": screenName,
            "sessionID": sessionID
        },
        success: function (data) {
            $(".loading").hide();
            updateHistory();
        },
        error: function (jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });
};

/**
 * download button in history panel
 * @param btnID
 * @param data
 * @param filename
 */
function frontendDownload(btnID, data, filename){
    $(btnID).on('click', function(){
        let csvContent = "data:text/csv;charset=utf-8,";
        data.forEach(function(rowArray){
            let row = rowArray.join(",");
            csvContent += row + "\r\n";
        });
        var encodedUri = encodeURI(csvContent);
        const anchor = document.createElement('a');
        anchor.href = encodedUri;
        anchor.download = filename;
        anchor.click();
    });
};

/**
 * bulk comparison draw correlation matrix
 * @param options
 */
function drawCorrelationMatrix(options){
    var width, height, top, right, bottom, left;
    width = height = $("#history-chart").width()* 0.55; // %55 percent of the div
    top = right = $("#history-chart").width() * 0.07;
    bottom = left = $("#history-chart").width() * 0.275;

    var margin = {top: top, right: right, bottom: bottom, left: left},
        width = width,
        height = height,
        data = options.data,
        container = options.container,
        labelsData = options.labels,
        startColor = options.start_color,
        endColor = options.end_color;

    if(!data){
        throw new Error('Please pass data');
    }

    if(!Array.isArray(data) || !data.length || !Array.isArray(data[0])){
        throw new Error('It should be a 2-D array');
    }

    var maxValue = d3.max(data, function(layer) { return d3.max(layer, function(d) { return d; }); });
    var minValue = d3.min(data, function(layer) { return d3.min(layer, function(d) { return d; }); });

    var numrows = data.length;
    var numcols = data[0].length;

    var svg = d3.select(container).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var background = svg.append("rect")
        .attr("width", width)
        .attr("height", height);

    var x = d3.scaleBand()
        .domain(d3.range(numcols))
        .domain(d3.range(numcols))
        .range([0, width]);

    var y = d3.scaleBand()
        .domain(d3.range(numrows))
        .range([0, height]);

    var colorMap = d3.scaleLinear()
        .domain([minValue,maxValue])
        .range([startColor, endColor]);

    var row = svg.selectAll(".row")
        .data(data)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });

    var cell = row.selectAll(".cell")
        .data(function(d) { return d; })
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d, i) { return "translate(" + x(i) + ", 0)"; });

    cell.append('rect')
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("stroke-width", 0);

    cell.on("mouseenter", function(d, i){
        d3.select(this)
            .append("text")
            .attr("x", function(d, i){ return x(i) +width/(numrows*2); })
            .attr("y", function(d, i){ return y(i) +width/(numrows*2); })
            .attr("text-anchor", "middle")
            .attr("fill", "#333")
            .style("font-size", "10px")
            .text(d.toFixed(2));
    })
        .on("mouseleave", function(d, i) {
            d3.select(this).select("text").remove();
        });

    row.selectAll(".cell")
        .data(function(d, i) { return data[i]; })
        .style("fill", colorMap);

    var labels = svg.append('g')
        .attr('class', "labels");

    var rowLabels = labels.selectAll(".row-label")
        .data(labelsData)
        .enter().append("g")
        .attr("class", "row-label")
        .attr("transform", function(d, i) { return "translate(" + 0 + "," + y(i) + ")"; });

    rowLabels.append("text")
        .attr("x", -4)
        .attr("y", y.bandwidth() / 2)
        .attr("dy", ".6em")
        .style("font-size", "14px")
        .attr("text-anchor", "end")
        .text(function(d, i) { return d; });

    var columnLabels = labels.selectAll(".column-label")
        .data(labelsData)
        .enter().append("g")
        .attr("class", "column-label")
        .attr("transform", function(d, i) { return "translate(" + x(i) + "," + height + ")"; });

    columnLabels.append("text")
        .attr("x", 0)
        .attr("y", y.bandwidth() / 2)
        .attr("dy", ".82em")
        .style("font-size", "14px")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-60)")
        .text(function(d, i) { return d; });
};

/******************************* HELPER FUNCTIONS ********************************/
/**
 * frontend validation
 * @param whichPerformance
 * @returns {boolean}
 */
function formValidation($this, whichPerformance){
    if (whichPerformance === 'update'){
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

        if ($("#personality-algorithm").find('select').find('option').filter(":selected").val() === 'none'
            || $("#personality-algorithm").find('select').find('option').filter(":selected").val() === undefined){

            $("#modal-message").text('You have to select the algorithm for personality analysis.');
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
        if ($("#bluemix-personality-username").val() === ''){
            $("#modal-message").text('You have to provide a valid IBM personality insight Username!');
            $("#alert").modal('show');

            return false;
        }

        if ($("#bluemix-personality-password").val() === ''){
            $("#modal-message").text('You have to provide a valid IBM personality insight Password!');
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
};

/**
 * check if twitter and ibm credentials already exists
 */
function checkLoginStatus(){
    $.ajax({
        type:'get',
        url:'login/status',
        success:function(data){
            // twitter must be authorized in order to show search panel
           if (data.twitter){
                $("#login").hide();
                $("#search").show();
           }else{
               $("#search").hide();
               $("#display").hide();
               $("#login").show();
           }
        },
        error:function(jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });
}

/**
 * check if IBM credential has been provided
 */
function checkIBMStatus(){
    $.ajax({
        type:'get',
        url:'login/status',
        success:function(data){
            //  IBM must be authorized in order to select that algorithm
            if (!data.bluemix){
                $("#analyze-btn").prop('disabled', true);
                $("#bluemix-callback").modal('show');
            }
            else{
                $("#analyze-btn").prop('disabled', false);
            }
        },
        error: function(jqXHR, exception){
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('slow');
        }
    });
}

/**
 * draw google charts
 */
google.charts.load('current', {packages: ['corechart', 'bar', 'table', 'gauge']});
google.charts.setOnLoadCallback(renderBotScore);
google.charts.setOnLoadCallback(updatePersonality);
google.charts.setOnLoadCallback(updateConsumptionPreference);

/**
 * tooltip
 */
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

$(".botometer-icon").tooltip({
    container: "#search"
});

$("citation").tooltip({
    container:"#personality-algorithm",
    placement:"left"
})
