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
                console.log(data.user);
                updateUser(data.user);
            }
        },
        error: function(jqXHR, exception){
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });
})

function updateUser(userData) {
    $("#twitter-user-container").empty();
    $("#twitter-user-container").append(
        `<div class="personality-header" style="text-align:center;">
            <img src="` + userData.profile_img + `" style="width:50px;border-radius:50px;display:inline-block;"/>
            <h2 style="display:inline-block;margin-left:10px;vertical-align:middle">` + userData.screen_name + `</h2>
        </div>
        <div class="personality metadata">
            <h3>Word Count: ` + userData.personality.word_count + `</h3>
            <h3>Language: ` + userData.personality.processed_language + `</h3>
        </div>
        <div class="personality personality" id="personality-personality"></div>
        <div class="personality consumption-perferences"></div>
        <div class="personality needs"></div>
        <div class="personality values"></div>`);

    updatePersonality(userData.personality.personality);
};


function updatePersonality(personality){
    //$(".personality.personality").empty();
    $.each(personality, function(i, content){
        $("#personality-personality").append(`
            <h4>` + content['name'] + `&nbsp` + (content['percentile'] * 100).toFixed(2)  +`%</h4>
            <div id=` + content['trait_id'] + `></div>
        `);

        var table = [['trait', '%']];
        $.each(content['children'], function(j,child){
            table.push([child['name'], (child['percentile'] * 100).toFixed(2)])
            //$("#personality-personality").append(`<h5>` + child['name'] + `&nbsp` + (child['percentile'] * 100).toFixed(2) + `%</h5>`);
        });

        var dataTable = google.visualization.arrayToDataTable(table);
        var materialOptions = {
            bars: 'horizontal',
            hAxis: {textPosition: 'none'},
            vAxis: {textPosition: 'none'},
            axes: {
                y: {
                    0: {side: 'right'}
                }
            }
        };
        var materialChart = new google.charts.Bar(document.getElementById(content['trait_id']));
        materialChart.draw(dataTable, materialOptions);
    });
};

google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(updatePersonality);
