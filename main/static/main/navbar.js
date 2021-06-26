// navbar animation


$('.navbar').addClass('not-scrolled');
$(".dropdown-menu").addClass('not-scrolled');
$(".dropdown-item").addClass('not-scrolled');

function classShift() {
    if ($(window).scrollTop() == 0) {
        $('.navbar').removeClass('scrolled');
        $('.navbar').addClass('un-scrolled');
        $('.navbar').removeClass('not-scrolled');
        $(".dropdown-menu").addClass('not-scrolled');
        $(".dropdown-item").addClass('not-scrolled');
    } else {
        $('.navbar').addClass('scrolled');
        $('.navbar').removeClass('un-scrolled');
        $('.navbar').removeClass('not-scrolled');
        $(".dropdown-menu").removeClass('not-scrolled');
        $(".dropdown-item").removeClass('not-scrolled');
    }
}

$(document).ready(function() {
    $(window).scroll(classShift);
});

