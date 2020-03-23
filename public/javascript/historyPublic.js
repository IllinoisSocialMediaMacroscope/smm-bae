/******************************* HISTORY PANEL ********************************/
$(document).ready(function(){
    updateHistory();
    $('html, body').animate({ scrollTop: ($('#history').first().offset().top - 10)}, 3000);
});


/**
 * update filelist in history panel
 */
function updateHistory(){
    $.ajax({
        url: "history-list",
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
 * @param historyList
 */
function seperateByAlgorithm(historyList){
    var folderNames = {'IBM-Personality':[], 'TwitPersonality':[], 'Pamuksuz-Personality':[]};
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
            if (filename.slice(-30) === '_utku_personality_average.json') {
                folderNames['Pamuksuz-Personality'].push(folderName);
            }
        });
    });
    return folderNames;
}

/**
 * rendering file list in hisotry panel
 * @param historyList
 */
function renderHistoryList(historyList){
    $("#history-links").empty();
    $("#history-links").append('<div class="personality-header"><h2>History</h2></div>');

    // folderNames = {'IBM':[screenname1, screename2..], 'Twit':[screename1, screename3...]}
    var folderNames = seperateByAlgorithm(historyList);

    $.each(historyList,function(i, val){

        var screenName = Object.keys(val)[0];

        $("#history-links").append('<div class="history-link" value="' + screenName + '">\
            <a href="" class="preview" onclick="previewHistory(event, `'+ screenName +'`)">'+screenName +'</a>\
            <button onclick="deleteRemote(`'+ screenName + '`);">\
                <i class="fas fa-trash-alt"/>\
            </button>\
            <a class="download" href="download?screenName='+screenName + '" target="_blank"">\
                <i class="fas fa-download"/>\
            </a>\
          </div>');

        if (folderNames['IBM-Personality'].indexOf(screenName) > -1){
            $(".history-link[value=" + screenName + "]").append('<kbd class="tag-IBM">IBM</kbd>');
        }
        if (folderNames['TwitPersonality'].indexOf(screenName) > -1){
            $(".history-link[value=" + screenName + "]").append('<kbd class="tag-Twit">TWIT</kbd>');
        }
        if (folderNames['Pamuksuz-Personality'].indexOf(screenName) > -1){
            $(".history-link[value=" + screenName + "]").append('<kbd class="tag-Pamuksuz">Pamuksuz</kbd>');
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
                                </div>');
        var algorithm = $("#history-algorithm input[name=history-algorithm]:checked").val();
        addBulkComparisonSelection(folderNames[algorithm]);

        $(".history-input-del-btn").on('click', function(){
            $(this).parent().remove();
        });
    });

    historyBulkComparison();
};

/**
 * history list onclick preview result
 */
function previewHistory(e, screenName){
    e.preventDefault();
    $.ajax({
        url: "preview",
        type: "GET",
        data: {
            screenName: screenName
        },
        success: function (data) {
            IBMPreviewRender(screenName, data['IBM-Personality'], 'IBM-preview');
            PamuksuzPreviewRender(screenName, data['Pamuksuz-Personality'], 'Pamuksuz-preview');
            $("#history-preview").modal("show");
        },
        error: function (jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal('show');
        }
    });
}

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
            $(obj).append('<option>please choose...</option>');
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
                url: "bulk-comparison",
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
                                                <button class="btn btn-primary btn-sm" id="similarity-matrix-btn"><i class="fas fa-download"></i>\
                                                    Similarity</button>\
                                                <button class="btn btn-primary btn-sm" id="comparison-table-btn"><i class="fas fa-download"></i>\
                                                    Personality</button>\
                                                </div>');

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
