function twitterAccountHeader(data, role){
    var tweetCount = data.statuses_count >=3200 ? 3200: data.statuses_count;

    $("#" + role + "-container").append(
        '<div class="personality-header">\
            <div class="row">\
                <div class="col col-md-3 col-sm-3 col-xs-3">\
                    <img src="' + data.profile_img + '"/>\
                </div>\
                <div class="col col-md-9 col-sm-9 col-xs-9">\
                    <div class="twitter-account-row">\
                        <h4 id="' + role +  '-screen-name">\
                            <a target="_blank" href="https://twitter.com/' + data.screen_name +'">' + data.screen_name + '</a>\
                        </h4>\
                    </div>\
                    <div class="twitter-account-row">\
                        <h4 class="word-count">Collected Tweet Count: </h4>\
                        <h4 class="number">' + tweetCount + '</h4>\
                    </div>\
                    <div class="twitter-account-row">\
                        <h4 class="word-count">Collected At: </h4>\
                        <h4 class="number">' + data.lastModified.slice(0,10) + '</h4>\
                    </div>\
                </div>\
            </div>\
        </div>'
    );

    if ('personality' in data && 'warnings' in data.personality && data.personality.warnings.length > 0) {
        var warningMessage = data.personality.warnings[0].message;
        $("#" + role + "-container").find('.personality-header').prepend(
            '<i class="fas fa-exclamation-circle pull-right" data-toggle="tooltip" \
            data-placement="left" title="' + warningMessage + '"></i>'
        );
    }
}

/**
 * IBM preivew
 * @param screenName
 * @param IBMData
 * @param role
 * @constructor
 */
function IBMPreviewRender(screenName, IBMData, role) {
    $("#" + role + "-container").empty();
    if (IBMData !== undefined) {
        var promise = new Promise(function (resolve, reject) {
            // add twitter account header
            twitterAccountHeader(IBMData, role);

            $("#" + role + "-container").append(
                '<div class="personality persona"></div>\
                <div class="personality needs"></div>\
                <div class="personality values"></div>\
                <div class="personality consumption-preferences"></div>');

            $("#" + role + "-account h4").text(screenName);
            $("#" + role + "-account p").text('IBM Personality Insights').attr("value", "IBM-Watson");
            $("#" + role + "-account a").attr("href", "download?screenName=" + screenName);

            resolve();
        });

        promise.then(() => {
            if (IBMData.personality.personality != undefined) updatePersonality(IBMData.personality.personality, role);
            if (IBMData.personality.consumption_preferences != undefined) updateConsumptionPreference(IBMData.personality.consumption_preferences, role);
            if (IBMData.personality.needs != undefined) updateNeeds(IBMData.personality.needs, role);
            if (IBMData.personality.values != undefined) updateValues(IBMData.personality.values, role);

            //tooltip
            $(function () {
                $('[data-toggle="tooltip"]').tooltip()
            });
        });
    }
}

/**
 * Pamuksuz preview
 * @param screenName
 * @param PamuksuzData
 * @param role
 * @constructor
 */
function PamuksuzPreviewRender(screenName, PamuksuzData, role) {
    $("#" + role + "-container").empty();
    if (PamuksuzData !== undefined) {
        // add twitter account header
        twitterAccountHeader(PamuksuzData, role);

        $("#" + role + "-container").append(
            '<div class="personality persona">\
                <div class="personality">\
                    <h4 class="word-count">Sophistication</h4>\
                    <h4 class="number">' + PamuksuzData['sophistication'].toFixed(4) + '</h4>\
                </div>\
                <div class="personality">\
                    <h4 class="word-count">Excitement</h4>\
                    <h4 class="number">' + PamuksuzData['excitement'].toFixed(4) + '</h4>\
                </div>\
                <div class="personality">\
                    <h4 class="word-count">Sincerity</h4>\
                    <h4 class="number">' + PamuksuzData['sincerity'].toFixed(4) + '</h4>\
                </div>\
                <div class="personality">\
                    <h4 class="word-count">Competence</h4>\
                    <h4 class="number">' + PamuksuzData['competence'].toFixed(4) + '</h4>\
                </div>\
                <div class="personality">\
                    <h4 class="word-count">Ruggedness</h4>\
                    <h4 class="number">' + PamuksuzData['ruggedness'].toFixed(4) + '</h4>\
                </div>\
            </div>'
        );

        $("#" + role + "-account h4").text(screenName);
        $("#" + role + "-account p").text('Pamuksuz Brand Personality ML Model').attr("value", "Pamuksuz-Personality");
        $("#" + role + "-account a").attr("href", "download?screenName=" + screenName);
    }
}

/**
 * update the Needs barchart
 * @param needs
 * @param role: user or brand
 */
function updateNeeds(needs, role){
    $("#"+ role + "-container").find(".personality.needs").append(
        '<h3 class="category" data-toggle="tooltip" data-placement="top" \
        title="Needs describe at a high level those aspects of a product that are likely to resonate with the \
        author of the input text. The following describes the twelve needs that the service evaluates.">Needs</h3> \
        <div id="' + role + '-needs-chart"></div>');

    var table = [['','percentile']];
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
    $("#"+ role + "-container").find(".personality.values").append(
        '<h3 class="category" data-toggle="tooltip" data-placement="top" \
        title="Values describe motivating factors that influence the author\'s decision-making.\
        The following describes the five values that the service infers.">Values</h3>\
        <div id="' + role + '-values-chart"></div>');

    var table = [['','percentile']];
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
    $("#"+ role + "-container").find(".personality.persona").append(
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
            $("#"+ role + "-container").find(".personality." + content['trait_id']).append(
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

    $("#"+ role + "-container").find(".expand-personality-btn").on('click',function(){
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
    $("#"+ role + "-container").find(".personality.consumption-preferences").append(
        '<h3 class="category"\
         data-toggle="tooltip" data-placement="top" \
         title="The service groups the more than 40 consumption preferences into eight high-level categories. \
         The preferences indicate the author\'s likelihood to prefer different \
         products, services, and activities.">Consumption Preference</h3>\
         <div id="' + role + '-consumption-chart"></div>');

    var table = [];
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

/**
 * draw google charts
 */
google.charts.load('current', {packages: ['corechart', 'bar', 'table', 'gauge']});
google.charts.setOnLoadCallback(updatePersonality);
google.charts.setOnLoadCallback(updateConsumptionPreference);


/**
 * tooltip
 */
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});

