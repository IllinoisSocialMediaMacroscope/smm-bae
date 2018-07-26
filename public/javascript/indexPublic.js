/**
 * scroll down and focus on login
 */
$(document).ready(function(){
    $(".login").fadeIn(2000);
    $('html, body').animate({ scrollTop: ($('.login').first().offset().top - 10)}, 3000);
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
    if (formValidation('twitter-auth')) {
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
 * IBM authorization
 */
$("#bluemix-auth").find('a').on('click', function(){
    $("#bluemix-callback").modal('show');
});

/**
 * save IBM personality username and password
 */
$("#bluemix-pin-submit").on('click', function(){
    if (formValidation('bluemix-auth')){
        $.ajax({
            type: 'post',
            url: 'login/bluemix',
            data: {
                currentURL:newPath,
                bluemixPersonalityUsername: $("#bluemix-personaity-username").val(),
                bluemixPersonalityPassword: $("#bluemix-personaity-password").val()
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

/******************************* START ANALYSIS ********************************/
/**
 * analyze button (Main function)
 */
$("#analyze-btn").on('click', function(){
    if (formValidation('update')) {
        var userScreenName = $("#user-search").find('input').val();
        var brandScreenName = $("#brand-search").find('input').val();

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

            if (data.personality.warnings.length > 0){
                var warningMessage = data.personality.warnings[0].message;
            }else{
                var warningMessage = "";
            }

            $("#twitter-"+ role + "-container").append(
                `<div class="personality-header" style="padding:20px;background-color:#607d8b59;border-radius:5px;overflow:auto;">
                    <i class="fas fa-exclamation-circle"
                        data-toggle="tooltip" data-placement="left" title="` + warningMessage + `"></i>  
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
                    <a class="btn btn-primary btn-sm" href="download?screenName=`
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

/**
 * update the Needs barchart
 * @param needs
 * @param role: user or brand
 */
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

/**
 * update the consumption preference table
 * @param preference
 * @param role
 */
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

    if (option === 'none'){
        resetSimScore();
    }else{
        $.ajax({
            url: "score",
            type: "GET",
            data: { "userScreenName": $("#user-screen-name").text(),
                "brandScreenName":$("#brand-screen-name").text(),
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
    var sim = new CountUp('similarity-score', 0, score, 2, 4, options);
    if (!sim.error) {
        sim.start();
    } else {
        console.error(sim.error);
    }
};

/**
 * reset similarity score to empty whenever refresh or analyze new users
 */
function resetSimScore() {
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
 * rendering file list in hisotry panel
 * @param historyList
 */
function renderHistoryList(historyList){
    $(".history-links").remove();
    $("#history-form").empty();

    $("#history-form").append(`<div class="history-input">
                                    <input class="history-input-autocomplete" placeholder="screen name"/>
                                    <button id="history-input-btn"><i class="fas fa-plus-circle" style="color:#b04b39;"></i></button>
                                </div>                                
                               <button class="btn btn-primary btn-block" id="history-btn">bulk comparison</button>`);
    addAutocomplete(historyList);
    // add more input box
    $("#history-input-btn").on('click', function(){
        $("#history-form").prepend(`<div class="history-input">
                                    <input class="history-input-autocomplete" placeholder="screen name"/>
                                    <button class="history-input-del-btn"><i class="fas fa-minus-circle" style="color:#063535;"></i></button>
                                </div>`)

        addAutocomplete(historyList);

        // delete input box
        $(".history-input-del-btn").on('click', function(){
            $(this).parent().remove();
        });
    });

    // add history chart area
    $("#history").append(`
        <div id="history-chart" style="margin-bottom: 40px; display:block;"></div>
        <div id="history-chart-legend" style="margin-bottom:40px;"></div>`);

    // render list of histories
    $.each(historyList,function(i, val){
        $("#history").append(`
        <div class="history-links">
            <p style="display:inline;">`+val +`</p>
            <button style="float:right;background:none;border:none;" onclick="deleteRemote('`+ val + `');">
                <i class="fas fa-trash-alt", style="color:black;margin-right:10px;"/>
            </button>
            <a href="download?screenName=`+val +`&sessionID=` + sessionID + `" target="_blank" style="float:right;">
                <i class="fas fa-download", style="color:black;margin-right:10px;"/>
            </a>    
          </div>`
        )
    });

    // history bulk comparison
    historyBulkComparison();
};

/**
 * history panel autocomplete screenName
 * @param list
 */
function addAutocomplete(list){
    $.each(document.getElementsByClassName("history-input-autocomplete"), function(i, val){
        // if the input hasn't turn into a autocomplete, do that:
        if ($(val).parent().attr('class') !== 'awesomplete'){
            new Awesomplete(val, {list: list, autoFirst:true});
        };
    })
};

/**
 * bulk comparison
 */
function historyBulkComparison(){
    $("#history-btn").on('click', function(){
        if (formValidation('history')) {
            var screenNames = [];
            $('.history-input-autocomplete').each(function(){
                if(screenNames.indexOf($(this).val()) === -1 && $(this).val() !== '') screenNames.push($(this).val());
            });
            $.ajax({
                url: "history",
                type: "post",
                data: JSON.stringify({ screenNames:screenNames,
                    "sessionID": sessionID
                }),
                contentType: "application/json",
                success: function (data) {
                    $("#history-chart").empty();
                    $("#history-chart").append(`<h3>Similarity Matrix</h3>`);
                    $("#history-chart").show();
                    drawCorrelationMatrix({
                        container : '#history-chart',
                        data      : data['correlation_matrix_no_legends'],
                        labels    : screenNames,
                        start_color : '#ffffff',
                        end_color : '#b04b39'
                    });
                    $("#history-chart").append(`<div class="history-btn-group" style="text-align:center;">
                                                <button class="btn btn-primary btn-sm" id="similarity-matrix-btn"><i class="fas fa-download"></i>
                                                    Similarity</button>
                                                <button class="btn btn-primary btn-sm" id="comparison-table-btn"><i class="fas fa-download"></i>
                                                    Personality</button>
                                                </div>`)

                    // downloads
                    frontendDownload("#similarity-matrix-btn", data['correlation_matrix'], 'Bulk_Similarity_Matrix.csv');
                    frontendDownload("#comparison-table-btn", data['comparison_table'], 'Bulk_Personality_Table.csv');
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
        var count = 0 ;
        var screenNames = [];
        $('.history-input-autocomplete').each(function(){
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
        if ($("#bluemix-personaity-username").val() === ''){
            $("#modal-message").text('You have to provide a valid IBM personality insight Username!');
            $("#alert").modal('show');

            return false;
        }

        if ($("#bluemix-personaity-password").val() === ''){
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
           if (data.twitter && data.bluemix){
                $(".login").hide();
                $("#search").show();
            }else{
               $("#search").hide();
               $("#display").hide();
               $(".login").show();

               if (data.twitter){
                   $("#twitter-auth").hide();
                   $("#bluemix-auth").show();
               }else if (data.bluemix){
                   $("#twitter-auth").show();
                   $("#bluemix-auth").hide();
               }else{
                   $("#twitter-auth").show();
                   $("#bluemix-auth").show();
               }
           }
        },
        error:function(jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });
}

/**
 * draw google charts
 */
google.charts.load('current', {packages: ['corechart', 'bar', 'table']});
google.charts.setOnLoadCallback(updatePersonality);
google.charts.setOnLoadCallback(updateConsumptionPreference);

/**
 * tooltip
 */
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})
