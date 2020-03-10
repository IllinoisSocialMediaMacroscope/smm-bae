/**
 * scroll down and focus on login
 */
$(document).ready(function(){
    $('html, body').animate({ scrollTop: ($('.login').first().offset().top - 10)}, 3000);
    checkLoginStatus();
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
                    update(data.user, 'user');
                    update(data.brand, 'brand');
                    resetSimScore(data.algorithm);
                    updateHistory();

                    // loading bar
                    $(".loading").hide();
                    $("#analyze-btn").show();

                    // update the flow
                    flowEffect({"authorization": "done", "ibmkey": "done", "search": "done", "citation": "on"});

                    // focus on the see result button
                    $('html, body').animate({
                        scrollTop: ($('#see-result').first().offset().top - 10)
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
                console.log(data);
            },
            error: function (jqXHR, exception) {
                $("#error").val(jqXHR.responseText);
                $("#warning").modal('show');
            }
        })
    }
});

$("#see-result").on('click', function(){
    // update the flow
    flowEffect({"authorization":"done", "ibmkey":"done", "search":"on", "citation":"off"});

    //focus on display containers
    $("#display").show();
    $('html, body').animate({
        scrollTop: ($('#display').first().offset().top - 10)
    }, 1000);
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
    $("#user-account a").attr("href", "");
    $("#brand-account a").attr("href", "");

    $("#display").hide();
}

/**
 * update the main personality panel
 * related to $("#analyze-btn").on('click', function()
 * @param data
 * @param role: user or brand
 */
function update(data, role) {
    var promise = new Promise(function(resolve, reject) {
        if (data != undefined) {
            $("#" + role + "-container").empty();

            if ('warnings' in data.personality && data.personality.warnings.length > 0){
                var warningMessage = data.personality.warnings[0].message;
            }else{
                var warningMessage = "";
            }

            $("#"+ role + "-container").append(
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
                <div class="personality consumption-preferences"></div>');
            $("#" + role + "-account h4").text(data.screen_name);
            $("#" + role + "-account a").attr("href", "download?screenName=" + data.screen_name);
            resolve();
        }
        else{
            reject();
        }
    });

    promise.then(() =>{
        if (data.personality.personality != undefined) updatePersonality(data.personality.personality, role);
        if (data.personality.consumption_preferences != undefined) updateConsumptionPreference(data.personality.consumption_preferences, role);
        if (data.personality.needs != undefined) updateNeeds(data.personality.needs, role);
        if (data.personality.values != undefined) updateValues(data.personality.values, role);

        //tooltip
        $(function() { $('[data-toggle="tooltip"]').tooltip()});
    });

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
    $("#"+ role + "-container").find(".personality.values").append(
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
    $('#similarity-score').text('0.0000');


};

/******************************* HISTORY PANEL ********************************/
/**
 * update filelist in history panel
 */
function updateHistory(){
    $.ajax({
        url: "history",
        type: "GET",
        data: {},
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
            <a href="download?screenName='+screenName + '" target="_blank"">\
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
        data: { "screenName": screenName},
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
