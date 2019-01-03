$("#termination-confirmation").on('click',function(e){
    e.preventDefault();
    $("#terminate-modal").modal('show');
});

function terminate() {
    window.location = "http://socialmediamacroscope.org/tools/bae/stop?sess=" + terminateSessionID;
}
