// get session id
var sessionURL = window.location.href;
var pathArray = window.location.pathname.split('/');
var newPath = "";
var sessionID = "local";
for (i=0; i<pathArray.length-1; i++){
    if (pathArray[i] === 'weber'){
        sessionID = pathArray[i+2];
    }
    newPath += pathArray[i];
    newPath += "/";
}
var currPage = pathArray[pathArray.length-1];
