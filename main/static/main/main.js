// JS file for scroll on button click of the buttons in the header

$("#discover-button").click(function() {
    $('html,body').animate({
        scrollTop: $("#about-site").offset().top - $(".navbar").height() - 20},
        'slow');
});

$("#news-button").click(function() {
    $('html,body').animate({
        scrollTop: $("#news").offset().top - $(".navbar").height() - 20},
        'slow');
});
