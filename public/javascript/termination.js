$("#termination-confirmation").on('click',function(e){
    e.preventDefault();
    $("#terminate-modal").modal('show');
});

function terminate() {
    var cleanData = function () {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: 'get',
                url: 'purgeRemote',
                data: { "sessionID": sessionID },
                success: function (data) {
                    if (data) {
                        if ('ERROR' in data) {
                            $("#error").val(JSON.stringify(data));
                            $("#warning").modal('show');
                            reject(data);
                        }
                        resolve(data);
                    }
                },
                error: function (jqXHR, exception) {
                    $("#error").val(jqXHR.responseText);
                    $("#warning").modal('show');
                    reject(msg);
                }
            });
        });
    };

    cleanData().then(function () {
        window.location = "http://socialmediamacroscope.org/tools/bae/stop?sess=" + sessionID;
    }).catch(function (error) {
        console.log('oh no', error);
    });

}
