$("#analyze-btn").on('click', function(){
    if (formValidation()) {
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
                // if error then prompt user to rename
                $(".loading").hide();

                //focus on display containers
                $("#display").show();
                $('html, body').animate({
                    scrollTop: ($('#display').first().offset().top - 10)
                }, 1000);

                update(data.user, 'user');
                update(data.brand, 'brand');
                updateSimScore(data.similarity);
            },
            error: function (jqXHR, exception) {
                $("#error").val(jqXHR.responseText);
                $("#warning").modal('show');
            }
        });
    }
})

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
                        <h4 style="vertical-align:middle">` + data.screen_name + `</h4>                   
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
                    <button class="btn btn-primary btn-sm">Download</button>
                    <button class="btn btn-primary btn-sm">Terminology</button>
                    <button class="btn btn-primary btn-sm">API Reference</button>
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
        pageSize: 10
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

function formValidation(){
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

    return true;
}

google.charts.load('current', {packages: ['corechart', 'bar', 'table']});
google.charts.setOnLoadCallback(updatePersonality);
google.charts.setOnLoadCallback(updateConsumptionPreference);
