var timer = performance.now()

$(".project").on('touchstart', function(event) {
    timer = performance.now()
});

// prevent popup screen from appearing so that user can see back of project on phone
$(".project").on('touchend', function(event) {
    if (event.cancelable && performance.now() - timer > 200) {
        event.preventDefault()
    }
});