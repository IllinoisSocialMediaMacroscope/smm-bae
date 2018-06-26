$("#analyze-btn").on('click', function(){
    if (formValidation('update')) {
        var user_screen_name = $("#user-search").find('input').val();
        var brand_screen_name = $("#brand-search").find('input').val();

        $.ajax({
            url: "update",
            type: "post",
            data: { "user_screen_name": user_screen_name,
                "brand_screen_name":brand_screen_name,
                "sessionID": sessionID
            },
            success: function (data) {
                $(".loading").hide();

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
                $(".loading").hide();

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
                $("#error").val(jqXHR.responseText);
                $("#warning").modal('show');
            }
        });
    }
})

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
            $("#twitter-"+ role + "-container").append(
                `<div class="personality-header" style="padding:20px;background-color:#607d8b59;border-radius:5px;overflow:auto;">
                    <div class="col col-md-3 col-sm-3 col-xs-3">
                        <img src="` + data.profile_img + `" style="width:60px;border-radius:5px;display:inline;"/>
                    </div>
                    <div class="col col-md-9 col-sm-9 col-xs-9">
                        <h4 id="` + role +  `-screen-name", style="vertical-align:middle">` + data.screen_name + `</h4>                   
                        <h4 style="display:inline-block;">Word Count: </h4>
                        <h4 style="display:inline-block;color:#b04b39;font-weight:800;">` + data.personality.word_count + `</h4>                     
                    </div>
                </div>
                <div class="personality personality" style="padding:10px;">
                    <h3>Personality</h3>
                    <div id="` + role + `-personality-chart"></div>
                </div>                
                <div class="personality needs" style="padding:10px;">
                    <h3>Needs</h3>
                    <div id="` + role + `-needs-chart"></div>
                </div>
                <div class="personality values" style="padding:10px;">
                    <h3>Values</h3>
                    <div id="` + role + `-values-chart"></div>
                </div>
                <div class="personality consumption-perferences" style="padding:10px;">
                    <h3>Consumption</h3>
                    <div id="` + role + `-consumption-chart"></div>
                </div>
                <div class="personality-btn-group" style="padding:10px; text-align:center;">
                    <button class="btn btn-primary btn-sm" onclick="download('` + data.screen_name+ `');">Download</button>
                    <a href="https://console.bluemix.net/docs/services/personality-insights/models.html#models"
                    class="btn btn-primary btn-sm" role="button" target="_blank">Terminology</a>
                    <a href="https://www.ibm.com/watson/developercloud/personality-insights/api/v3/curl.html?curl#profile" 
                    class="btn btn-primary btn-sm" 
                    role="button" target="_blank">API Reference</a>
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
    });

};

function download(screen_name) {
    $.ajax({
        url: "download",
        type: "POST",
        data: {
            "screen_name": screen_name,
            "sessionID": sessionID,
        },
        success: function (data) {
            var a = document.createElement('a');
            var url = window.URL.createObjectURL(new Blob(data, {type: "application/json"}));
            a.href = url;
            a.download = screen_name + '.json';
            a.click();
            window.URL.revokeObjectURL(url);

        },
        error: function (jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });
}

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
        hAxis: { textStyle: {color:'#b04b39',fontSize:'14'}},
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
        vAxis: { textStyle: {color:'#146563',fontSize:'14'}},
        hAxis: { textStyle: {color:'#146563',fontSize:'14'}},
        tooltip: {
            textStyle: {
                color:'black'
            }
        },
        backgroundColor:'transparent',
        colors:['#146563']
    };
    var materialChart = new google.charts.Bar(document.getElementById(role+'-values-chart'));
    materialChart.draw(dataTable, google.charts.Bar.convertOptions(materialOptions));
}

function updatePersonality(personality, role){
    $.each(personality, function(i, content){
        $("#" + role + "-personality-chart").append(`
            <div style="margin:20px;">
                <h4 style="display:inline;vertical-align:baseline;">` + content['name'] + `&nbsp</h4>
                <h4 style="display:inline;vertical-align:baseline;color:#b04b39">`+ (content['percentile'] * 100).toFixed(2)  +`%</h4>
                <button style="float:right;background:none;border:none;" class="expand-personality-btn">
                    <i class="fas fa-chevron-circle-up fa-chevron-circle-down" style="color:black;"></i>
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
    });

    $("#" + role + "-personality-chart").find(".expand-personality-btn").on('click',function(){
        $(this).find('i').toggleClass('fa-chevron-circle-up')
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
    $('#similarity-score').text('NA');
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
    $.each(history_lists,function(i, val){
        $("#history").append(`
        <div class="history-links">
            <p style="display:inline;">`+val +`</p>
            <button style="float:right;background:none;border:none;">
                <i class="fas fa-trash-alt", style="color:black;margin-right:10px;"/>
            </button>
            <button style="float:right;background:none;border:none;">
                <i class="fas fa-download", style="color:black;margin-right:10px;"/>
            </button>    
            <button style="float:right;background:none;border:none;">
                <i class="fas ffar fa-eye", style="color:black;margin-right:10px;"/>
            </button>
          </div>`
        )
    });

    new Awesomplete(document.getElementById("user-history"), {list: history_lists, autoFirst:true});
    new Awesomplete(document.getElementById("brand-history"), {list: history_lists, autoFirst:true});
}

google.charts.load('current', {packages: ['corechart', 'bar', 'table']});
google.charts.setOnLoadCallback(updatePersonality);
google.charts.setOnLoadCallback(updateConsumptionPreference);
