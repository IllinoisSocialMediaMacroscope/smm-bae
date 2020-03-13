/**
 * whenever error modal shows, check if credential is valid or not
 */
$("#warning").on("shown.bs.modal", function (e) {
    checkLoginStatus();
});

/**
 * Twitter authorization
 */
$("#twitter-auth").find("a").on("click", function () {
    $(this).attr("href", "login/twitter?currentURL=" + newPath);
    $("#twitter-callback").modal("show");
});

/**
 * post the pin to retreive Twitteraccess key and token
 */
$("#twitter-pin-submit").on("click", function () {
    if (formValidation(null, "twitter-auth")) {
        $.ajax({
            type: "post",
            url: "login/twitter",
            data: {
                currentURL: newPath,
                twtPin: $("#twitter-pin").val()
            },
            success: function (data) {
                window.location.replace(data.redirectUrl);
            },
            error: function (jqXHR, exception) {
                $("#twitter-callback").modal("hide");
                $("#error").val(jqXHR.responseText);
                $("#warning").modal("show");
            }
        });
    }
});

/**
 * save IBM personality username and password
 */
$("#bluemix-pin-submit").on("click", function () {
    if (formValidation(null, "bluemix-auth")) {
        $.ajax({
            type: "post",
            url: "login/bluemix",
            data: {
                currentURL: newPath,
                bluemixPersonalityApikey: $("#bluemix-personality-apikey").val(),
            },
            success: function (data) {
                window.location.replace(data.redirectUrl);
            },
            error: function (jqXHR, exception) {
                $("#twitter-callback").modal("hide");
                $("#error").val(jqXHR.responseText);
                $("#warning").modal("show");
            }
        });
    }
});


/**
 * check if twitter and ibm credentials already exists
 */
function checkLoginStatus() {
    $.ajax({
        type: "get",
        url: "login/status",
        success: function (data) {
            // three states: on, off, done;
            var panels = {"authorization": "off", "ibmkey": "off", "search": "off", "citation": "off"};

            if (!data.twitter) {
                panels["authorization"] = "on";
                flowEffect(panels);
            }
            else if (!data.bluemix) {
                panels["ibmkey"] = "on";
                panels["authorization"] = "done";
                flowEffect(panels)
            }
            else {
                panels["ibmkey"] = "c";
                panels["authorization"] = "done";
                panels["search"] = "on";
                flowEffect(panels)
            }
        },
        error: function (jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal("show");
        }
    });
}

/**
 * IBM bluemix skip providing credentials
 * @param panels
 */
$("#bluemix-skip").find('a').on('click', function(e){
    e.preventDefault();
    flowEffect({"authorization": "done", "ibmkey": "off", "search": "on", "citation": "off"});
});

/**
 * when select IBM as algorithm; re-check if the credential is present;
 */
$("#algorithm").on("change", function () {
    var algorithm = $(this).find('option').filter(":selected").val();
    if (algorithm === "IBM-Watson") checkLoginStatus();
});

function flowEffect(panels) {
    $.each(panels, function (key, val) {
        if (val === "done"){
            $("#" + key + "-flow").find("i").show();
            if ($("#" + key + "-flow").find("i").hasClass("fa-times-circle")){
                $("#" + key + "-flow").find(".fas.fa-times-circle").hide();
            }
        }
        else{
            $("#" + key + "-flow").find("i").hide();
            if ($("#" + key + "-flow").find("i").hasClass("fa-times-circle")){
                $("#" + key + "-flow").find(".fas.fa-times-circle").show();
            }
        }
        val === "on" ? $("#" + key + "-flow").attr("class", "btn flowgrid on")
            : $("#" + key + "-flow").attr("class", "btn flowgrid off")
        val === "on" ? $("#" + key).show() : $("#" + key).hide();
    });
}


/**
 * call botometer to detect if the user name is a bot or not
 */
$(".botometer-icon").on("click", function () {
    var screenName = $(this).prev().val();
    if (formValidation(screenName, "botometer")) {
        $("#botometer-screen-name").text("@" + screenName);
        $("#botometer-modal").modal("show");
        $("#botometer-modal").find(".login-notes").show();
        $("#botometer-button").show();
        $("#botometer-display").hide();
        $("#botometer-modal").find(".loading").hide();
    }
});

$("#botometer-button").on("click", function () {
    $("#botometer-modal").find(".loading").show();
    $.ajax({
        url: "botometer",
        type: "GET",
        data: {
            "screenName": $("#botometer-screen-name").text()
        },
        success: function (scores) {
            $("#botometer-modal").find(".login-notes").hide();
            $("#botometer-modal").find(".loading").hide();
            $("#botometer-button").hide();
            $("#botometer-display").show();

            renderBotScore(scores);
            downloadBotScore(scores);
        },
        error: function (jqXHR, exception) {
            $("#error").val(jqXHR.responseText);
            $("#warning").modal("show");
        }
    });

});

function renderBotScore(scores) {
    if (scores !== undefined && "display_scores" in scores && "english" in scores["display_scores"]) {
        var data = google.visualization.arrayToDataTable([
            ["Label", "Value"],
            ["Bot Score", scores["display_scores"]["english"]]
        ]);
        var options = {
            min: 0,
            max: 5,
            width: 200,
            height: 200,
            redFrom: 3.5, redTo: 5,
            yellowFrom: 1.5, yellowTo: 3.5,
            greenFrom: 0, greenTo: 1.5,
            majorTicks: 0.5
        };

        var chart = new google.visualization.Gauge(document.getElementById("botometer-gauge"));
        chart.draw(data, options);
    }
}

function downloadBotScore(scores) {
    // generate downloadable full botometer scores report
    var a = $("#botometer-display").find("a");
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scores));
    a.attr("href", "data:" + data);
    a.attr("download", scores["user"]["screen_name"] + "_botometer_scores.json");
}

/**
 *  USERNAME PROMPT
 */
function delay(callback, ms) {
    var timer = 0;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            callback.apply(context, args);
        }, ms || 0);
    };
}

$("#search").find('input').click(function () {
    $(this).siblings(".prompt").show();
});

$("#search").find('input').keyup(delay(function () {
    var $prompt = $(this).siblings(".prompt");
    if ($(this).val() !== "") {
        $.ajax({
            url: "prompt",
            type: "post",
            data: {"screenName": $(this).val()},
            success: function (data) {
                $prompt.empty();
                $(data).each(function (i, user) {
                    $prompt.append('<div class="prompt-user">' +
                        '<img class="prompt-img" src="' + user.profile_image_url + '"/>' +
                        '<p class="prompt-screen-name">' + user.screen_name + '</p>' +
                        '<p class="prompt-user-name">' + user.name + '</p>' +
                        '<p class="prompt-user-description">' + user.description + '</p></div>')
                });

                $(".prompt-user").on("click", function () {
                    $(this).parent().parent().find("input").val($(this).find(".prompt-screen-name").text());
                    $prompt.hide();
                });
            },
            error: function (jqXHR, exception) {
                $("#error").val(jqXHR.responseText);
                $("#warning").modal('show');
            }
        });
    }
    else {
        $prompt.empty();
    }

}, 300));
