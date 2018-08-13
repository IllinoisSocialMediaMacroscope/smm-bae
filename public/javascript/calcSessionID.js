/**
 * parse URL and get Session ID
 * session ID is unique for each hubzero instance
 * equivalent to each user
 * @type {string}
 */

var pathArray = window.location.pathname.split('/');
var newPath = "";
var sessionID = "local";
for (i=0; i<pathArray.length-1; i++){
    if (pathArray[i] === 'weber'){
        sessionID = pathArray[i+2];
    }
    newPath += pathArray[i];
    newPath += "/";
};

/**
 * click header redirect to homepage
 */
$("#header").find('a').on('click', function(){
    window.location.replace(newPath);
});
