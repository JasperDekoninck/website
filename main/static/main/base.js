// If the width of the screen is bigger than screen width (can happen in a project or so) -> 
// make sure it has good widtj

$(document).ready(function() {
    $("footer").css("width", 0);
    $("footer").css("width", $(document).width());
    $(window).scroll(function() {
        $("footer").css("width", 0);
        $("footer").css("width", $(document).width());
    })
});
