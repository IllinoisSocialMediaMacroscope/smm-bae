$("#analyze-btn").on('click', function(){
    if (formValidation('update')) {
        var user_screen_name = $("#user-search").find('input').val();
        var brand_screen_name = $("#brand-search").find('input').val();

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
            data: { "user_screen_name": user_screen_name,
                "brand_screen_name":brand_screen_name,
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
                resetSimScore();
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
})

$("#similarity-metrics").on('change', function(){
    var option = $(this).find('option').filter(":selected").val();

    if (option === 'none'){
        resetSimScore();
    }else{
        $.ajax({
            url: "score",
            type: "GET",
            data: { "user_screen_name": $("#user-screen-name").text(),
                "brand_screen_name":$("#brand-screen-name").text(),
                "sessionID": sessionID,
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
})

$("#personality-algorithm").find('select').on('change', function(){
    var option = $(this).find('option').filter(":selected").val();
    if (option === 'IBM-Watson'){
        $("citation")
            .attr('data-original-title', "<p><b>Please cite it in your work using the citation below:</b><br><br>\
            Yun, J. T., Wang, C., Troy, J., Vance, N. P., Marini, L., Booth, R., Nelson, T., Hetrick, A., & Hodgkins, H. (September, 2017) – Social Media Macroscope \
            <a href='http://hdl.handle.net/2142/99742' target='_blank'>http://hdl.handle.net/2142/99742</a><br><br></p>\
            Arnoux, Pierre-Hadrien, Anbang Xu, Neil Boyette, Jalal Mahmud, Rama Akkiraju, \
            and Vibha Sinha. <a href='https://aaai.org/ocs/index.php/ICWSM/ICWSM17/paper/view/15681' target='_blank'>25 Tweets to Know you: A New Model to Predict Personality with Social Media.\
            </a> AAAI Publications, Eleventh International AAAI Conference on Web and Social Media (2017): pp. 472-475.<br><br>\
            <a href='https://console.bluemix.net/docs/services/personality-insights/references.html#references' target='_blank'>More Research References ...</a>")
            .tooltip('fixTitle')
            .tooltip('show');
    }
    ///else if (option === 'another algorithm'){
        // do something here
    //}
    else{
        $("citation")
            .attr('data-original-title', "")
            .tooltip('hide');
    }
})

function deleteRemote(screen_name){
    $.ajax({
        url: "deleteRemote",
        type: "get",
        data: { "screen_name": screen_name,
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
}

function updateHistory(){
    $.ajax({
        url: "history",
        type: "GET",
        data: { "sessionID": sessionID },
        success: function (data) {
            $(".loading").hide();
            renderHistoryList(data.history_list);
        },
        error: function (jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });
}

function update(data, role) {

    var promise = new Promise(function(resolve, reject) {
        if (data != undefined) {
            $("#twitter-" + role + "-container").empty();

            if (data.personality.warnings.length > 0){
                var warning_message = data.personality.warnings[0].message;
            }else{
                var warning_message = "";
            }

            $("#twitter-"+ role + "-container").append(
                `<div class="personality-header" style="padding:20px;background-color:#607d8b59;border-radius:5px;overflow:auto;">
                    <i class="fas fa-exclamation-circle"
                        data-toggle="tooltip" data-placement="left" title="` + warning_message + `"></i>  
                    <div class="row" style="overflow:auto;">
                        <div class="col col-md-3 col-sm-3 col-xs-3">
                            <img src="` + data.profile_img + `" style="width:60px;border-radius:5px;display:inline;"/>
                        </div>
                        <div class="col col-md-9 col-sm-9 col-xs-9">
                            <h4 id="` + role +  `-screen-name", style="vertical-align:middle"><a target="_blank" href="https://twitter.com/` + data.screen_name +`">` + data.screen_name + `</a></h4>                   
                            <h4 style="display:inline-block;">Word Count: </h4>
                            <h4 style="display:inline-block;color:#b04b39;font-weight:800;">` + data.personality.word_count + `</h4>                  
                        </div>
                    </div>
                </div>
                <div class="personality personality" style="padding:10px;">
                    <h3 class="category"
                    data-toggle="tooltip" data-placement="top" 
                    title="Big Five personality characteristics represent the most widely used model for generally describing 
                    how a person engages with the world. The model includes five primary dimensions.">Personality</h3>
                    <div id="` + role + `-personality-chart"></div>
                </div>                
                <div class="personality needs" style="padding:10px;">
                    <h3 class="category" data-toggle="tooltip" data-placement="top" 
                    title="Needs describe at a high level those aspects of a product that are likely to resonate with the 
                    author of the input text. The following describes the twelve needs that the service evaluates.">Needs</h3>
                    <div id="` + role + `-needs-chart"></div>
                </div>
                <div class="personality values" style="padding:10px;">
                    <h3 class="category" data-toggle="tooltip" data-placement="top" 
                    title="Values describe motivating factors that influence the author's decision-making. 
                    The following describes the five values that the service infers.">Values</h3>
                    <div id="` + role + `-values-chart"></div>
                </div>
                <div class="personality consumption-perferences" style="padding:10px;">
                    <h3 class="category"
                    data-toggle="tooltip" data-placement="top" 
                    title="The service groups the more than 40 consumption preferences into eight high-level categories. 
                    The preferences indicate the author's likelihood to prefer different 
                    products, services, and activities.">Consumption Preference</h3>
                    <div id="` + role + `-consumption-chart"></div>
                </div>
                <div class="personality-btn-group" style="padding:10px; text-align:center;">
                    <a class="btn btn-primary btn-sm" href="http://localhost:8080/download?screen_name=`
                        + data.screen_name +`&sessionID=` + sessionID + `" target="_blank">Download</a>
                    <a class="btn btn-primary btn-sm" href="https://console.bluemix.net/docs/services/personality-insights/index.html#about" 
                    role="button" target="_blank">Documentations</a>
                </div>`);
            resolve();
        }
        else{
            reject();
        }
    })

    promise.then(() =>{
        updatePersonality(data.personality.personality, role);
        updateConsumptionPreference(data.personality.consumption_preferences, role);
        updateNeeds(data.personality.needs, role);
        updateValues(data.personality.values, role);

        //tooltip
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
    });

};

function updateNeeds(needs, role){
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
        vAxis: { textStyle: {color:'#b04b39',fontSize:'14'}},
        hAxis: { textStyle: {color:'#b04b39',fontSize:'14'}, viewWindow:{max:1}},
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
}

function updateValues(values, role){
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
        vAxis: { textStyle: {color:'#2a444b',fontSize:'14'}},
        hAxis: { textStyle: {color:'#2a444b',fontSize:'14'},viewWindow:{max:1}},
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
}

function updatePersonality(personality, role){
    $.each(personality, function(i, content){
        $("#" + role + "-personality-chart").append(`
            <div style="margin:20px;">
                <h4 style="display:inline;vertical-align:baseline;">` + content['name'] + `&nbsp</h4>
                <h4 style="display:inline;vertical-align:baseline;color:#b04b39"
                data-toggle="tooltip" title="Normalized scores represent a percentile ranking for each characteristic 
                that is based on qualities that the service infers from the input text. The service computes normalized 
                scores by comparing the raw score for the author's text with results from a sample population.">`+ (content['percentile'] * 100).toFixed(2)  +`%</h4>
                <button style="float:right;background:none;border:none;" class="expand-personality-btn">
                    <i class="fas fa-chevron-down" style="color:black;"></i>
                </button>
                <div style="margin:20px 0 20px 0;" id="` + role + "-" + content['trait_id'] + `"></div>
            </div>
        `);

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
            hAxis: { viewWindow:{max:1}},
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
    });

    $("#" + role + "-personality-chart").find(".expand-personality-btn").on('click',function(){
        if ($(this).find('i').hasClass('fa-chevron-down')){
            $(this).find('i').removeClass('fa-chevron-down');
            $(this).find('i').addClass('fa-chevron-up');
        }else{
            $(this).find('i').addClass('fa-chevron-down');
            $(this).find('i').removeClass('fa-chevron-up');
        }
        $(this).next().toggle();
    })

};

function updateConsumptionPreference(preference, role){

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
        pageSize: 5
    };

    var materialTable = new google.visualization.Table(document.getElementById(role +'-consumption-chart'));
    materialTable.draw(data, materialOptions);
};

function updateSimScore(score){
    var options = {
        useEasing: true,
        useGrouping: true,
        decimal: '.',
    };
    var sim = new CountUp('similarity-score', 0, score, 2, 4, options);
    if (!sim.error) {
        sim.start();
    } else {
        console.error(sim.error);
    }
}

function resetSimScore() {
    $('#similarity-metrics option:first').prop('selected', true);
    $('#similarity-score').text('');
}

function formValidation(whichPerformance){
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
        if ($("#user-history").val() === ''
            || $("#user-history").val() === undefined){

            $("#modal-message").text('You have to provide screen name of the user.');
            $("#alert").modal('show');
            return false;
        }

        if ($("#brand-history").val() === ''
            || $("#brand-history").val() === undefined){

            $("#modal-message").text('You have to provide screen name of the brand.');
            $("#alert").modal('show');

            return false;
        }

        if ($("#user-history").val() === $("#brand-history").val()){
            $("#modal-message").text('You put in the same screen name for user and brand!');
            $("#alert").modal('show');

            return false;
        }
    }

    return true;
}

function renderHistoryList(history_lists){
    $(".history-links").remove();
    $("#history-form").empty();

    $("#history-form").append(`<input class="awesomplete" id="user-history" placeholder="user screen name"/>
                               <input class="awesomplete" id="brand-history" placeholder="brand screen name"/>
                               <button class="btn btn-primary btn-block" id="history-btn">compare</button>`);
    $.each(history_lists,function(i, val){
        $("#history").append(`
        <div class="history-links">
            <p style="display:inline;">`+val +`</p>
            <button style="float:right;background:none;border:none;" onclick="deleteRemote('`+ val + `');">
                <i class="fas fa-trash-alt", style="color:black;margin-right:10px;"/>
            </button>
            <a href="http://localhost:8080/download?screen_name=`+val +`&sessionID=` + sessionID + `" target="_blank" style="float:right;">
                <i class="fas fa-download", style="color:black;margin-right:10px;"/>
            </a>    
          </div>`
        )
    });

    new Awesomplete(document.getElementById("user-history"), {list: history_lists, autoFirst:true});
    new Awesomplete(document.getElementById("brand-history"), {list: history_lists, autoFirst:true});


    $("#history-btn").on('click', function(){
        if (formValidation('history')) {
            var user_screen_name = $("#user-history").val();
            var brand_screen_name = $("#brand-history").val();

            $.ajax({
                url: "history",
                type: "post",
                data: { "user_screen_name": user_screen_name,
                    "brand_screen_name":brand_screen_name,
                    "sessionID": sessionID
                },
                success: function (data) {
                    //focus on display containers
                    $("#display").show();
                    $('html, body').animate({
                        scrollTop: ($('#display').first().offset().top - 10)
                    }, 1000);

                    update(data.user, 'user');
                    update(data.brand, 'brand');
                    resetSimScore();
                },
                error: function (jqXHR, exception) {
                    $(".loading").hide();
                    $("#error").val(jqXHR.responseText);
                    $("#warning").modal('show');
                }
            });
        }
    });
}

google.charts.load('current', {packages: ['corechart', 'bar', 'table']});
google.charts.setOnLoadCallback(updatePersonality);
google.charts.setOnLoadCallback(updateConsumptionPreference);

//tooltip
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})
