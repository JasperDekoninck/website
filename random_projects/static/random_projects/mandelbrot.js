var canvas = document.getElementById("generation-canvas")
var context = canvas.getContext("2d")

// The scale indicates how much bigger the canvas is than is shown: setting this to one, would give a pixelated image
var scale = 2
document.getElementById("width").value = Math.min(Math.round(window.innerWidth * 0.7), 800)
document.getElementById("height").value = Math.round(600 / 800 * Math.min(window.innerWidth * 0.7, 800))
var width = document.getElementById("width").value
var height = document.getElementById("height").value

// Some global variables for changing and updating the canvas
var i = 0
var interval_generate = null
var interval_draw = null
var image = context.createImageData(canvas.width, canvas.height)

window.addEventListener('resize', function () {
    // resize canvas based on the size of the screen
    document.getElementById("width").value = Math.min(Math.round(window.innerWidth * 0.7), 800)
    document.getElementById("height").value = Math.round(600 / 800 * Math.min(window.innerWidth * 0.7, 800))
    resizeCanvas()
}, false);

function resizeCanvas() {
  width = document.getElementById("width").value
  height = document.getElementById("height").value
  // Only allow values smaller than 5000
  if (width < 5000 && height < 5000) {
    canvas.width = width * scale
    canvas.height = height * scale
    canvas.style.height = height + "px"
    canvas.style.width = width + "px"
    image = context.createImageData(canvas.width, canvas.height)
    i = 0
  }
}

resizeCanvas()

// Some constants that need to be defined globally

// the range in the math cartesian coordinates, pixels need to be scale to be within this range
var x_range;
var y_range;

// for zooming in the start position of the zoom
var numb_start; 
var pos_start;
// current pos of the mouse where it is going to end the zoom
var pos_end;

// the radius at which the element is definitely not in the mandelbrot set (quite high for colorization)
const RADIUS = 30; 
// Max iterations
var max_iterations; 
// color map to use
var color_scheme; 

function calc_max_iterations() {
  // Set the maximum number of iteration based on the range
  max_iterations = Math.floor(512 * (1 / Math.min(Math.abs(x_range[1] - x_range[0]), 
                                          Math.abs(y_range[1] - y_range[0])) ** (1 / 4)))
  document.getElementById("iterations").value = max_iterations
}

function changeIterations() {
  // changes the number of iterations if user asks so and generates the thing
  max_iterations = document.getElementById("iterations").value
  generate()
}

function download() {
  var dt = canvas.toDataURL('image/jpeg')
  this.href = dt
  return false
}

downloadLnk.addEventListener('click', download);

function getMousePos(canvas, event) {
  // Gets the mouse position within the canvas
  var rect = canvas.getBoundingClientRect();
  return {
      x: (event.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
      y: (event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
  };
}

// set the number to start the zoom at
canvas.addEventListener("mousedown", function(e) {
  // get the mouse position on mousedown
  pos_start = getMousePos(canvas, e)
  pos_end = getMousePos(canvas, e)
  numb_start = pixel_to_number([pos_start.x, pos_start.y])
})

canvas.addEventListener("touchstart", function(e) {
  // get the mouse position on mousedown
  pos_start = getMousePos(canvas, e.changedTouches[0])
  pos_end = getMousePos(canvas, e.changedTouches[0])
  numb_start = pixel_to_number([pos_start.x, pos_start.y])
})

canvas.addEventListener("mousemove", function(e) {
  // if mouse moves -> update the end position
  pos_end = getMousePos(canvas, e)
})

canvas.addEventListener("touchmove", function(e) {
  // if mouse moves -> update the end position
  e.preventDefault()
  pos_end = getMousePos(canvas, e.changedTouches[0])
})

canvas.addEventListener("mouseup", function(e) {
  // if mouse goes up -> zoom in
  var numb_mouse_pos = pixel_to_number([pos_end.x, pos_end.y])
  x_range = [numb_start[0], numb_mouse_pos[0]]
  y_range = [numb_start[1], numb_mouse_pos[1]]
  numb_start = null
  pos_start = null
  calc_max_iterations()
  generate()
})

canvas.addEventListener("touchend", function(e) {
  // if mouse goes up -> zoom in
  var numb_mouse_pos = pixel_to_number([pos_end.x, pos_end.y])
  x_range = [numb_start[0], numb_mouse_pos[0]]
  y_range = [numb_start[1], numb_mouse_pos[1]]
  numb_start = null
  pos_start = null
  calc_max_iterations()
  generate()
})

function pixel_to_number(pixel) {
  // Convert a pixel value to a number that lies within the range specified by x_range and y_range
    return [pixel[0] / canvas.width * (x_range[1] - x_range[0]) + x_range[0], 
            pixel[1] / canvas.height * (y_range[1] - y_range[0]) + y_range[0]]
}

function absolute_value(number) {
    // gets the absolute value of an imaginary number represented as a list of two numbers
    return number[0] ** 2 + number[1] ** 2
}

function iterate(complex_real, complex_imag, max_iter) {
  // iterates the given number with the maximum number iterations doing the Mandelbrot iteration
  var current_real = 0
  var current_imag = 0
  var size_real = 0
  var size_imag = 0
  var iter  = 0
  var square_radius = RADIUS ** 2

  while (iter < max_iter && (size_real + size_imag) <= square_radius) {
    current_imag = 2 * current_real * current_imag + complex_imag
    current_real = size_real - size_imag + complex_real
    size_real = current_real * current_real
    size_imag = current_imag * current_imag
    iter++
  }

  // this is done as extra for colorization
  for (var extra = 0; extra < 4; extra++) {
    current_imag = 2 * current_real * current_imag + complex_imag
    current_real = size_real - size_imag + complex_real
    size_real = current_real * current_real
    size_imag = current_imag * current_imag
  }

  return [iter, current_imag, current_real]
}

function linear_interpolate(color1, color2, smooth) {
  // Linearly interpolates between the given colors with factor smooth
  return [color2[0] * smooth + color1[0] * (1 - smooth), 
          color2[1] * smooth + color1[1] * (1 - smooth),
          color2[2] * smooth + color1[2] * (1 - smooth), 
          255]
}

function color_scale(final_iter, final_iterate_numb, max_iter, color_map) {
  // The color scale adviced by Wikipedia to make everything the same color as expected
  // final_iter is the iteration at which the number left the radius
  // final_iterate_numb is the imaginary number at the last moment
  // max_iter is the maximum number of iterations possible
  // color_map is the color map to use
  if (final_iter < max_iter) {
    var smoothed = Math.log2(Math.log2(absolute_value(final_iterate_numb))) / 2
    var colorI = final_iter + 1 - smoothed
    var index = Math.floor(colorI % color_map.length)
    if (index < 0) {
      index += color_map.length
    }
    var next_index = (index + 1) % color_map.length
    return linear_interpolate(color_map[index], color_map[next_index], colorI % 1)
  } else {
    return [0, 0, 0, 255]
  }
}

// Color map used on wikipedia
var color_map_wiki = [[0, 7, 103], [0, 8, 106], [0, 8, 109], [0, 9, 113], [0, 10, 116], [0, 11, 119], [0, 12, 122], [1, 13, 125], [1, 14, 127], [1, 15, 130], [1, 17, 133], [2, 18, 
  136], [2, 20, 138], [2, 21, 141], [3, 23, 143], [3, 25, 146], [3, 27, 148], [4, 29, 151], [4, 31, 153], [5, 33, 155], [5, 35, 157], [6, 38, 160], [6, 40, 162], [7, 42, 164], [8, 45, 166], [8, 47, 168], [9, 50, 170], [10, 53, 172], [11, 55, 174], [12, 58, 175], [13, 61, 177], [13, 64, 179], [14, 67, 181], [15, 69, 183], [17, 72, 184], [18, 75, 186], [19, 78, 188], [20, 81, 189], [21, 84, 191], [22, 87, 193], [24, 90, 194], [25, 93, 196], [27, 96, 198], [28, 99, 199], [30, 102, 201], [31, 105, 202], [33, 108, 204], [35, 112, 205], [36, 115, 207], [38, 118, 208], [40, 121, 210], [43, 124, 211], [45, 127, 213], [47, 130, 214], [50, 
  133, 215], [52, 136, 217], [55, 139, 218], [57, 142, 219], [60, 145, 220], [63, 147, 222], [66, 150, 223], [69, 153, 224], [72, 156, 225], [75, 159, 226], [78, 162, 227], [81, 164, 228], [84, 167, 229], [87, 170, 230], [90, 173, 231], [94, 175, 232], [97, 178, 233], [101, 181, 234], [104, 183, 235], [107, 186, 236], 
  [111, 188, 237], [114, 191, 238], [118, 193, 238], [121, 196, 239], [125, 198, 240], [128, 201, 241], [132, 203, 241], [135, 205, 242], [139, 207, 243], [142, 
  210, 244], [146, 212, 244], [149, 214, 245], [153, 216, 245], [156, 218, 246], [160, 220, 247], [163, 222, 247], [166, 224, 248], [170, 226, 248], [173, 228, 249], [176, 229, 249], [179, 231, 249], [182, 233, 250], [186, 234, 250], [189, 236, 251], [192, 237, 251], [194, 239, 251], [197, 240, 252], [200, 242, 252], [203, 243, 252], [206, 244, 253], [208, 245, 253], [211, 246, 253], [213, 247, 253], [215, 248, 254], [218, 249, 254], [220, 250, 254], [222, 251, 254], [224, 252, 254], [226, 252, 254], [227, 253, 255], [229, 253, 255], [231, 254, 255], [232, 254, 255], [233, 254, 255], [234, 255, 255], [235, 255, 255], [236, 255, 255], [237, 255, 255], [238, 255, 255], [239, 255, 254], [239, 255, 253], [240, 255, 252], [241, 254, 250], [241, 254, 248], [242, 254, 246], [242, 254, 244], [243, 253, 241], [244, 253, 238], [244, 252, 234], [245, 252, 231], [245, 251, 227], [246, 251, 223], [246, 250, 219], [247, 249, 214], [247, 249, 210], [248, 248, 205], [248, 247, 200], [248, 246, 195], [249, 246, 190], [249, 245, 185], [249, 244, 179], [250, 243, 174], [250, 242, 168], [250, 241, 162], [251, 240, 157], [251, 238, 151], [251, 237, 145], [252, 236, 139], [252, 235, 133], [252, 233, 127], [252, 232, 121], [252, 231, 115], [253, 229, 109], [253, 228, 104], [253, 226, 98], [253, 225, 92], [253, 223, 86], [254, 221, 81], [254, 220, 75], [254, 218, 70], [254, 216, 64], [254, 215, 59], [254, 213, 54], [254, 211, 49], [254, 209, 45], [254, 207, 40], [255, 205, 36], [255, 203, 31], [255, 201, 28], [255, 199, 24], [255, 197, 20], [255, 194, 17], [255, 192, 14], [255, 190, 11], [255, 188, 9], [255, 185, 7], [255, 183, 5], [255, 180, 3], [255, 178, 2], [255, 175, 1], [255, 173, 0], [255, 170, 0], [255, 168, 0], [254, 165, 0], [253, 162, 0], [252, 159, 0], [251, 156, 0], [249, 153, 0], [246, 150, 0], [244, 147, 0], [241, 143, 0], [238, 140, 0], [234, 137, 0], [231, 133, 0], [227, 130, 0], [223, 127, 0], [218, 123, 0], [214, 119, 0], [209, 116, 0], [204, 112, 0], [199, 109, 0], [194, 105, 0], [188, 102, 0], [183, 98, 0], [177, 94, 0], [171, 91, 0], [165, 87, 0], [159, 84, 0], [153, 80, 0], [147, 77, 0], [141, 73, 0], [135, 70, 0], [129, 66, 0], [123, 63, 0], [117, 60, 0], [111, 56, 0], [105, 53, 0], [99, 50, 0], [93, 47, 0], [87, 44, 0], [81, 41, 0], [75, 38, 0], [70, 35, 0], [64, 32, 0], [59, 30, 0], [53, 27, 0], [48, 25, 0], [44, 22, 0], [39, 20, 0], [34, 18, 
  0], [30, 16, 0], [26, 14, 0], [22, 12, 0], [19, 11, 0], [16, 9, 0], [13, 8, 0], [10, 6, 0], [7, 5, 0], [5, 4, 0], [4, 4, 0], [2, 3, 0], [1, 2, 0], [0, 2, 0], [0, 2, 0], [0, 2, 0], [0, 2, 0], [0, 2, 1], [0, 2, 1], [0, 2, 2], [0, 2, 3], [0, 2, 4], [0, 2, 5], [0, 2, 6], [0, 2, 8], [0, 2, 10], [0, 2, 11], [0, 2, 13], [0, 2, 15], [0, 2, 17], [0, 3, 20], [0, 3, 22], [0, 3, 24], [0, 3, 27], [0, 3, 30], [0, 3, 32], [0, 3, 35], [0, 3, 38], [0, 3, 41], [0, 3, 44], [0, 4, 47], [0, 4, 50], [0, 4, 54], [0, 4, 57], [0, 4, 60], [0, 4, 64], [0, 5, 67], [0, 5, 70], [0, 5, 74], [0, 5, 77], [0, 6, 81], [0, 6, 84], [0, 6, 88], [0, 6, 91], [0, 7, 94], [0, 7, 98]]


  function wiki(final_iter, final_iterate_numb, max_iter) {
  return color_scale(final_iter, final_iterate_numb, max_iter, color_map_wiki)
}

// Hot color map
var color_map_hot =[[161, 8, 0], [165, 9, 0], [169, 10, 0], [173, 12, 0], [178, 14, 0], [182, 15, 0], [186, 17, 0], [191, 19, 0], [196, 22, 0], [200, 24, 0], [205, 26, 0], [209, 
  29, 0], [214, 31, 0], [218, 34, 0], [222, 37, 0], [226, 39, 0], [230, 42, 0], [234, 46, 0], [237, 49, 0], [240, 52, 0], [243, 56, 0], [246, 59, 0], [248, 63, 0], [250, 66, 0], [252, 70, 0], [254, 74, 0], [254, 78, 0], [255, 82, 0], [255, 87, 0], [255, 91, 0], [255, 95, 0], [255, 100, 0], [255, 105, 0], [255, 109, 0], [254, 114, 0], [254, 119, 0], [254, 124, 0], [254, 129, 0], [254, 134, 0], [254, 138, 0], [253, 143, 0], [253, 148, 0], [253, 153, 0], [253, 158, 0], [252, 163, 0], [252, 167, 0], [252, 172, 0], [252, 176, 0], [251, 181, 0], [251, 185, 0], [251, 189, 0], [251, 193, 0], [251, 197, 0], [251, 201, 0], [250, 204, 0], [250, 208, 0], [250, 211, 0], [250, 214, 0], [250, 216, 0], [250, 219, 0], [250, 221, 0], [250, 223, 1], [250, 225, 3], [250, 227, 6], [250, 229, 9], [250, 231, 
  13], [250, 232, 19], [250, 234, 24], [251, 235, 31], [251, 237, 38], [251, 238, 45], [251, 240, 53], [251, 241, 62], [251, 242, 70], [252, 243, 79], [252, 244, 89], [252, 245, 98], [252, 246, 108], [252, 247, 118], [253, 248, 128], [253, 249, 137], [253, 250, 147], [253, 250, 157], [253, 251, 166], [253, 251, 176], [254, 252, 185], [254, 252, 194], [254, 253, 202], [254, 253, 210], [254, 254, 217], [254, 254, 224], [255, 254, 231], [255, 254, 236], [255, 255, 242], [255, 255, 246], [255, 255, 249], [255, 255, 252], [255, 255, 254], [255, 255, 255], [255, 255, 255], [255, 254, 253], [255, 254, 251], [255, 252, 247], [255, 251, 242], [255, 249, 236], [255, 247, 229], [255, 244, 222], [255, 241, 214], [255, 238, 205], [255, 235, 195], [255, 231, 185], [255, 227, 175], [255, 223, 164], [255, 218, 153], [255, 213, 142], [255, 208, 130], [255, 203, 119], [255, 198, 108], [255, 193, 97], [255, 187, 86], [255, 181, 75], [255, 176, 65], [255, 170, 55], [255, 164, 46], [255, 158, 37], [255, 151, 29], [255, 145, 22], [255, 139, 16], [255, 133, 10], [255, 126, 6], [255, 120, 3], [255, 114, 1], [255, 108, 0], [255, 101, 0], [253, 95, 0], [251, 89, 0], [248, 83, 0], [245, 77, 0], [240, 71, 0], [235, 66, 0], [230, 60, 0], [224, 55, 0], [218, 49, 0], [212, 44, 0], [206, 39, 0], [199, 35, 0], [192, 30, 0], [186, 26, 0], [179, 22, 0], [173, 19, 0], [167, 15, 0], [161, 12, 0], [156, 9, 0], [151, 7, 0], [147, 5, 0], [143, 3, 0], [140, 2, 0], [138, 1, 0], [136, 0, 0], [136, 0, 0], [136, 0, 0], [137, 0, 0], [138, 1, 0], [140, 1, 0], [141, 1, 0], [144, 2, 0], [146, 3, 0], [149, 4, 0], [152, 5, 0]]


function hot(final_iter, final_iterate_numb, max_iter) {
  return color_scale(final_iter, final_iterate_numb, max_iter, color_map_hot)
}

// Ocean color map
var color_map_ocean = [[0, 7, 235], [0, 5, 235], [0, 4, 235], [0, 2, 236], [0, 1, 236], [0, 1, 236], [0, 0, 236], [0, 0, 236], [0, 0, 236], [0, 1, 235], [1, 3, 234], [2, 4, 233], [3, 7, 232], [4, 9, 231], [5, 13, 229], [6, 16, 227], [8, 20, 225], [10, 24, 223], [11, 28, 221], [13, 33, 219], [15, 37, 216], [17, 42, 214], [19, 47, 212], [21, 52, 209], [23, 57, 207], [25, 62, 205], [27, 67, 203], [29, 73, 201], [31, 78, 199], [34, 83, 198], [36, 87, 196], [38, 92, 195], [39, 96, 194], [41, 101, 193], [43, 105, 193], [45, 108, 193], [46, 112, 193], [47, 115, 193], [48, 118, 193], [49, 120, 194], [50, 123, 194], [51, 125, 194], [52, 127, 195], [52, 128, 195], [53, 130, 196], [53, 131, 196], [53, 133, 197], [54, 134, 198], [54, 135, 198], [55, 136, 199], [55, 137, 200], [55, 138, 201], [56, 140, 202], [56, 141, 
  203], [57, 142, 203], [58, 143, 204], [58, 145, 205], [59, 146, 206], [60, 148, 207], [61, 150, 208], [63, 152, 209], [64, 154, 210], [66, 157, 211], [68, 159, 212], [70, 162, 213], [72, 165, 214], [75, 168, 215], [78, 171, 216], [81, 174, 217], [85, 177, 218], [89, 180, 218], [93, 183, 219], [97, 186, 220], [101, 189, 221], [106, 192, 222], [111, 195, 223], [116, 198, 224], [121, 201, 225], [126, 204, 226], [131, 207, 227], [136, 209, 228], [142, 212, 229], [147, 215, 229], [152, 218, 230], [158, 220, 231], [163, 223, 232], [169, 225, 233], [174, 227, 233], [179, 230, 234], [184, 232, 235], [189, 234, 235], [194, 236, 236], [199, 238, 237], [203, 240, 237], [208, 242, 238], [212, 244, 238], [216, 245, 239], [220, 247, 239], [223, 248, 240], [227, 249, 240], [230, 250, 241], [233, 252, 241], [235, 252, 241], [237, 253, 241], [239, 254, 242], [240, 254, 242], [241, 255, 242], [242, 255, 242], [242, 255, 242], [241, 255, 242], [240, 254, 242], [237, 254, 242], [233, 252, 241], [228, 251, 241], [222, 249, 241], [215, 247, 240], [208, 245, 240], [200, 243, 239], [191, 240, 238], [182, 237, 238], [173, 234, 237], [163, 231, 236], [153, 227, 236], [142, 223, 235], [132, 219, 234], [121, 215, 234], [111, 211, 233], [100, 207, 232], [90, 202, 231], [79, 197, 231], [69, 193, 230], [60, 188, 229], [51, 183, 229], [42, 178, 228], [34, 172, 227], [27, 167, 227], [20, 162, 226], [14, 157, 226], [10, 151, 226], [6, 146, 225], [3, 140, 225], [1, 135, 225], [0, 129, 225], [0, 124, 225], [0, 119, 225], [0, 113, 225], [0, 108, 225], [0, 102, 226], [0, 97, 226], [0, 92, 226], [0, 87, 226], [0, 81, 227], [0, 76, 227], [0, 71, 227], [0, 67, 228], [0, 62, 228], [0, 57, 229], [0, 52, 229], [0, 48, 230], [0, 44, 230], [0, 40, 231], [0, 36, 231], [0, 32, 232], [0, 28, 232], [0, 25, 232], [0, 21, 233], [0, 18, 233], [0, 15, 234], [0, 13, 234], [0, 10, 234]]

function ocean(final_iter, final_iterate_numb, max_iter) {
  return color_scale(final_iter, final_iterate_numb, max_iter, color_map_ocean)
}


// jet color map
var color_map_jet = [[0, 3, 55], [0, 3, 60], [0, 3, 65], [0, 3, 70], [0, 3, 74], [0, 3, 78], [0, 3, 82], [0, 3, 84], [0, 3, 87], [0, 3, 88], [0, 3, 90], [0, 3, 91], [0, 4, 91], [0, 4, 92], [0, 4, 93], [0, 5, 93], [0, 5, 94], [0, 6, 96], [0, 6, 97], [0, 7, 99], [0, 8, 102], [0, 9, 105], [0, 11, 108], [0, 13, 111], [0, 15, 115], [1, 18, 118], [1, 21, 122], [1, 25, 126], [1, 28, 130], [2, 32, 134], [2, 36, 138], [3, 41, 142], [3, 45, 146], [4, 50, 150], [5, 55, 154], [5, 60, 158], [6, 66, 162], 
[7, 71, 166], [8, 77, 170], [9, 82, 173], [11, 88, 177], [12, 94, 180], [13, 99, 183], [15, 105, 186], [16, 111, 189], [18, 116, 191], [20, 122, 193], [22, 128, 195], [23, 133, 196], [26, 139, 198], [28, 144, 198], [30, 149, 199], [33, 154, 199], [35, 159, 198], [39, 164, 197], [43, 169, 195], [47, 173, 192], [52, 178, 189], [57, 182, 185], [62, 186, 180], [68, 190, 175], [74, 195, 169], [80, 198, 163], [86, 202, 157], [93, 206, 150], [100, 210, 143], [107, 213, 136], [114, 216, 129], [121, 219, 121], [128, 223, 113], [135, 225, 105], [143, 228, 98], [150, 231, 90], [157, 234, 82], [164, 236, 74], [171, 238, 67], [177, 240, 59], [184, 242, 52], [190, 244, 45], [196, 246, 39], [202, 248, 33], [207, 249, 27], [213, 250, 21], [217, 251, 17], [222, 252, 12], [225, 253, 9], [229, 254, 5], 
[232, 254, 3], [234, 255, 1], [236, 255, 0], [237, 255, 0], [238, 255, 0], [239, 254, 0], [240, 252, 0], [241, 250, 0], [242, 248, 0], [243, 245, 0], [244, 242, 0], [245, 238, 0], [246, 234, 0], [246, 229, 0], [247, 225, 0], [248, 219, 0], [248, 214, 0], [249, 208, 0], [249, 203, 0], [250, 196, 0], [250, 190, 0], [251, 184, 0], [251, 177, 0], [252, 170, 0], [252, 164, 0], [252, 157, 0], [253, 150, 0], [253, 143, 0], [253, 136, 0], [254, 129, 0], [254, 122, 0], [254, 115, 0], [254, 108, 0], [254, 102, 0], [254, 95, 0], [255, 89, 0], [255, 83, 0], [255, 77, 0], [255, 71, 0], [255, 65, 0], [255, 60, 0], [255, 55, 0], [255, 50, 0], 
[255, 46, 0], [255, 42, 0], [255, 39, 0], [253, 35, 0], [248, 32, 0], [242, 29, 0], [234, 26, 0], [224, 24, 0], [213, 21, 0], [200, 19, 0], [187, 17, 0], [173, 15, 0], [158, 13, 0], [143, 12, 0], [127, 10, 0], [112, 9, 0], [97, 8, 0], [82, 6, 0], [68, 5, 0], [54, 5, 0], [42, 4, 0], [31, 3, 0], [21, 3, 0], [13, 3, 0], [7, 2, 0], [2, 2, 0], [0, 2, 0], [0, 2, 0], [0, 2, 1], [0, 2, 3], [0, 2, 5], [0, 2, 8], [0, 2, 12], [0, 2, 16], [0, 2, 20], [0, 2, 25], [0, 2, 30], [0, 3, 35], [0, 3, 40]]

function jet(final_iter, final_iterate_numb, max_iter) {
  return color_scale(final_iter, final_iterate_numb, max_iter, color_map_jet)
}


// Blue red color map
var color_map_blue_red = [[0, 1, 51], [0, 1, 57], [0, 2, 62], [0, 2, 67], [0, 2, 71], [0, 2, 76], [0, 3, 79], [0, 3, 83], [0, 3, 85], [0, 3, 87], [0, 3, 89], [0, 3, 90], [0, 3, 91], [0, 4, 92], [0, 4, 92], [0, 4, 93], [0, 5, 94], [0, 5, 95], [0, 6, 96], [0, 6, 98], [0, 7, 100], [0, 8, 103], [0, 10, 106], [0, 13, 109], [0, 16, 113], [1, 20, 116], [1, 24, 120], [1, 29, 124], [2, 34, 128], [2, 39, 132], [3, 45, 136], [3, 51, 140], [4, 57, 144], [4, 63, 148], [5, 69, 152], [6, 76, 156], [7, 83, 160], 
[8, 89, 164], [9, 96, 168], [10, 102, 171], [11, 108, 175], [12, 114, 178], [14, 120, 181], [15, 125, 184], [17, 130, 187], [18, 135, 190], [20, 139, 192], [21, 143, 194], [23, 146, 195], [25, 149, 197], [27, 151, 198], [29, 152, 199], [31, 153, 199], [34, 153, 199], [36, 153, 199], [39, 153, 198], [42, 152, 197], [45, 152, 196], [48, 151, 195], [51, 151, 193], [54, 150, 191], [58, 149, 189], [62, 148, 186], [66, 147, 184], [70, 146, 181], [74, 145, 178], [78, 144, 175], [82, 142, 172], [86, 141, 168], [91, 140, 165], [95, 138, 161], [100, 136, 157], [105, 135, 153], [109, 133, 149], [114, 131, 145], [119, 129, 141], [123, 128, 
136], [128, 126, 132], [133, 124, 127], [138, 122, 123], [143, 120, 118], [147, 118, 113], [152, 115, 109], [157, 113, 104], [162, 111, 99], [166, 109, 95], [171, 107, 90], [176, 104, 85], [180, 102, 80], [185, 100, 76], [189, 97, 71], [193, 95, 67], [198, 93, 62], [202, 90, 58], [206, 88, 54], [210, 85, 49], [214, 83, 45], [217, 81, 41], [221, 78, 38], [224, 76, 34], [228, 74, 30], [231, 71, 27], [234, 69, 24], [237, 67, 20], [239, 64, 17], [242, 62, 15], [244, 60, 12], [246, 57, 10], [248, 55, 8], [250, 53, 6], [251, 51, 4], [252, 49, 3], [253, 47, 2], [254, 45, 1], [255, 43, 0], [255, 41, 0], [255, 39, 0], [254, 37, 0], [252, 36, 0], [250, 34, 0], [247, 32, 0], [243, 31, 0], [239, 29, 0], [234, 28, 0], [228, 26, 0], [222, 25, 0], [215, 23, 0], [208, 22, 0], [201, 20, 0], [193, 19, 
0], [185, 18, 0], [176, 17, 0], [168, 15, 0], [159, 14, 0], [150, 13, 0], [141, 12, 0], [132, 11, 0], [123, 10, 0], [113, 9, 0], [104, 8, 0], [95, 7, 0], [87, 
7, 0], [78, 6, 0], [70, 5, 0], [62, 4, 0], [54, 4, 0], [46, 3, 0], [39, 3, 0], [33, 2, 0], [27, 2, 0], [21, 1, 0], [16, 1, 0], [12, 1, 0], [8, 0, 0], [5, 0, 0], [2, 0, 0], [1, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 1], [0, 0, 3], [0, 0, 5], [0, 0, 8], [0, 0, 12], [0, 0, 16], [0, 0, 21], [0, 1, 25], [0, 1, 31], [0, 1, 36], [0, 1, 41]]


function blue_red(final_iter, final_iterate_numb, max_iter) {
  return color_scale(final_iter, final_iterate_numb, max_iter, color_map_blue_red)
}


// Soft color map
var color_map_soft = [[71, 82, 154], [84, 95, 166], [96, 107, 178], [109, 120, 190], [122, 132, 202], [135, 144, 214], [148, 157, 227], [161, 169, 239], [174, 182, 251], [170, 178, 247], [158, 166, 236], [145, 154, 224], [133, 142, 212], [121, 130, 201], [108, 118, 189], [96, 105, 178], [84, 93, 166], [72, 81, 154], [59, 69, 143], [44, 53, 121], [0, 0, 0], [54, 25, 68], [113, 57, 141], [124, 69, 152], [136, 81, 163], [147, 92, 174], [159, 104, 185], [170, 116, 196], [181, 128, 208], [193, 140, 219], [204, 151, 230], [216, 163, 241], [227, 175, 252], [221, 168, 246], [208, 156, 234], [196, 143, 222], [183, 130, 210], [171, 117, 197], [158, 104, 185], [146, 91, 173], [134, 79, 161], [121, 66, 149], [109, 53, 137], [57, 27, 73], [23, 8, 17], [118, 43, 87], [142, 59, 107], [154, 71, 119], [165, 83, 131], [177, 95, 143], [188, 108, 154], [200, 120, 166], [212, 132, 178], [223, 145, 190], [235, 157, 202], [247, 169, 213], [251, 174, 218], [237, 159, 204], [222, 145, 
  190], [208, 130, 176], [196, 116, 162], [182, 101, 148], [168, 87, 133], [154, 72, 120], [140, 59, 107], [83, 33, 62], [20, 12, 10], [113, 56, 44], [145, 78, 64], [157, 89, 77], [167, 100, 87], [181, 116, 102], [193, 127, 115], [201, 137, 125], [216, 151, 138], [226, 161, 149], [238, 174, 161], [250, 187, 174], [246, 183, 170], [236, 171, 158], [224, 157, 144], [212, 144, 131], [198, 130, 118], [186, 117, 105], [174, 104, 92], [162, 92, 79], [150, 79, 67], [138, 66, 54], [80, 37, 29], [15, 14, 5], [111, 105, 40], [141, 134, 58], [154, 146, 71], [166, 158, 84], [178, 170, 96], [190, 182, 109], [202, 194, 122], [214, 206, 135], [227, 218, 148], [239, 230, 161], [251, 242, 174], [247, 238, 170], [235, 226, 157], [223, 213, 144], [211, 201, 131], [198, 189, 118], [186, 177, 105], [174, 164, 92], [162, 152, 80], [150, 140, 67], [138, 128, 54], [80, 74, 29], [9, 15, 5], [66, 111, 40], [89, 141, 58], [101, 154, 71], [114, 166, 84], [126, 178, 96], [139, 190, 109], [152, 202, 122], [164, 214, 135], [177, 227, 148], [189, 239, 161], [202, 251, 174], [198, 247, 170], [185, 235, 157], [173, 223, 144], [160, 211, 131], [148, 198, 118], [135, 186, 105], [122, 174, 92], [110, 162, 80], [97, 150, 67], [85, 138, 54], [48, 80, 29], [5, 15, 9], [40, 111, 68], [58, 141, 
  91], [71, 154, 104], [84, 166, 116], [96, 178, 129], [109, 190, 142], [122, 202, 155], [135, 214, 167], [148, 227, 180], [161, 239, 193], [174, 251, 206], [170, 247, 202], [157, 235, 189], [144, 223, 176], [131, 211, 163], [118, 198, 151], [105, 186, 138], [92, 174, 125], [80, 162, 112], [67, 150, 100], [54, 138, 87], [29, 80, 49], [5, 13, 15], [40, 97, 111], [58, 126, 141], [71, 138, 154], [84, 151, 166], [96, 163, 178], [109, 176, 190], [122, 188, 202], [135, 200, 214], 
  [148, 213, 227], [161, 225, 239], [174, 238, 251], [170, 234, 247], [157, 221, 235], [144, 209, 223], [131, 196, 211], [118, 184, 198], [105, 172, 186], [92, 159, 174], [80, 147, 162], [67, 134, 150], [54, 122, 138], [29, 71, 80], [5, 7, 15], [40, 50, 111]]

function soft(final_iter, final_iterate_numb, max_iter) {
  return color_scale(final_iter, final_iterate_numb, max_iter, color_map_soft)
}

// Blue purple color map
var color_map_blue_purple = [[116, 48, 79], [113, 45, 76], [111, 43, 74], [108, 40, 72], [105, 38, 70], [103, 36, 68], [101, 34, 67], [98, 32, 65], [96, 31, 64], [94, 29, 63], [91, 28, 62], [89, 27, 61], [87, 26, 60], [85, 26, 59], [83, 25, 59], [82, 25, 59], [80, 25, 59], [78, 25, 59], [76, 25, 59], [75, 25, 59], [73, 26, 60], [72, 26, 60], [70, 26, 60], [69, 27, 61], [67, 27, 61], [66, 28, 61], [65, 28, 62], [63, 29, 63], [62, 29, 63], [61, 30, 64], [60, 31, 65], [59, 32, 65], [58, 33, 66], [57, 34, 67], [56, 35, 68], [55, 36, 69], [54, 37, 70], [53, 38, 71], [52, 39, 72], [52, 41, 73], [51, 42, 75], [50, 44, 76], [50, 45, 77], [49, 47, 79], [48, 48, 80], [48, 50, 82], [47, 52, 83], [47, 53, 85], [47, 55, 86], [46, 57, 88], [46, 59, 90], [45, 61, 92], [45, 63, 94], [45, 65, 95], [45, 67, 97], [45, 70, 99], [44, 72, 101], [44, 74, 103], [44, 77, 106], [44, 79, 108], [44, 82, 110], [44, 84, 112], [44, 87, 115], [45, 90, 117], [46, 93, 120], [47, 96, 122], [48, 99, 125], [50, 102, 128], [52, 105, 130], [55, 109, 133], [57, 112, 136], [60, 115, 139], [63, 119, 142], [66, 123, 145], [70, 126, 148], [73, 130, 151], [77, 133, 154], [81, 137, 157], [86, 141, 160], [90, 145, 163], [94, 148, 167], [99, 152, 170], [104, 156, 173], [109, 160, 176], [114, 164, 179], [119, 167, 182], [124, 171, 186], [129, 175, 189], [134, 179, 192], [139, 182, 195], [144, 186, 198], [150, 189, 201], [155, 193, 204], [160, 197, 207], [165, 200, 210], [171, 203, 212], [176, 207, 215], [181, 210, 218], [186, 213, 221], [191, 216, 223], [195, 219, 226], [200, 222, 228], [205, 225, 230], [209, 228, 233], [214, 231, 235], [218, 233, 237], [222, 236, 239], [226, 238, 241], [229, 240, 243], [233, 242, 244], [236, 244, 246], [239, 246, 248], [242, 248, 249], [245, 249, 250], [247, 250, 251], [249, 252, 252], [251, 253, 253], [252, 253, 254], [253, 254, 254], [254, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [255, 255, 255], [254, 254, 254], [254, 253, 254], [254, 252, 253], [253, 251, 252], [252, 250, 251], [251, 248, 249], [250, 247, 248], [249, 245, 246], [248, 243, 245], [247, 241, 243], [245, 238, 241], [244, 236, 239], [243, 233, 236], [241, 230, 234], [239, 227, 231], [237, 224, 229], [236, 221, 226], [234, 218, 223], [232, 214, 220], [229, 211, 217], [227, 207, 214], [225, 204, 211], [223, 200, 208], [221, 196, 205], [218, 192, 201], [216, 188, 198], [213, 184, 194], [211, 180, 191], [208, 176, 187], [205, 171, 184], [203, 167, 180], [200, 163, 176], [197, 158, 173], [194, 154, 169], [192, 150, 165], [189, 145, 162], [186, 141, 158], [183, 136, 154], [180, 132, 150], [177, 128, 146], [174, 123, 143], [171, 119, 139], [168, 115, 135], [165, 110, 132], [162, 106, 128], [159, 102, 124], [156, 98, 
121], [153, 94, 117], [150, 90, 114], [147, 86, 111], [144, 82, 107], [141, 78, 104], [138, 74, 101], [135, 70, 98], [133, 67, 95], [130, 63, 92], [127, 60, 89], [124, 57, 86], [121, 54, 84]]

function blue_purple(final_iter, final_iterate_numb, max_iter) {
  return color_scale(final_iter, final_iterate_numb, max_iter, color_map_blue_purple)
}



function choose_color(final_iter, final_iterate_numb, max_iter) {
  // chooses the color map to use
  if (color_scheme === "wiki") {
    return wiki(final_iter, final_iterate_numb, max_iter)
  } else if (color_scheme === "ocean") {
    return ocean(final_iter, final_iterate_numb, max_iter)
  }  else if (color_scheme === "hot") {
    return hot(final_iter, final_iterate_numb, max_iter)
  } else if (color_scheme === "jet") {
    return jet(final_iter, final_iterate_numb, max_iter)
  } else if (color_scheme === "blue-red") {
    return blue_red(final_iter, final_iterate_numb, max_iter)
  } else if (color_scheme === "soft") {
    return soft(final_iter, final_iterate_numb, max_iter)
  } else if (color_scheme === "blue-purple") {
    return blue_purple(final_iter, final_iterate_numb, max_iter)
  } 
}


function generate() {
  // reset some variables
  i = 0
  clearInterval(interval_generate)
  clearInterval(interval_draw)

  canvas.style.border = "none"
  // generate everything, and set a draw interval
  interval_generate = setInterval(generate_one_line, 0)
  interval_draw = setInterval(draw, 10)
  return false
}

function draw() {
  // draw the current image data on screen
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.putImageData(image, 0, 0)
  // draw the zoom in area if necessary
  if (numb_start) {
    context.beginPath()
    context.strokeStyle = "red"
    context.lineWidth = 3
    context.rect(pos_start.x, pos_start.y, pos_end.x - pos_start.x, pos_end.y - pos_start.y)
    context.stroke()
  }
}

function generate_one_line() {
  // generates one pixel line of the mandelbrot set
  var number;
  var output;
  var iter;
  var current_imag;
  var current_real;
  var color;

  if (i > canvas.width) {
    return false
  }
  
  for (var j = 0; j < canvas.width; j++) {
    number = pixel_to_number([j + 0.5, i + 0.5])
    output = iterate(number[0], number[1], max_iterations)
    iter = output[0]
    current_imag = output[1]
    current_real = output[2]
    color = choose_color(iter, [current_real, current_imag], max_iterations)

    image.data[i * canvas.width * 4 + j * 4] = color[0]
    image.data[i * canvas.width * 4 + j * 4 + 1] = color[1]
    image.data[i * canvas.width * 4 + j * 4 + 2] = color[2]
    image.data[i * canvas.width * 4 + j * 4 + 3] = color[3]
  }
  i++

  // to make sure that it is possible to see where it is currently busy -> black line
  for (var j = 0; j < canvas.width; j++) {

    image.data[i * canvas.width * 4 + j * 4] = 0
    image.data[i * canvas.width * 4 + j * 4 + 1] = 0
    image.data[i * canvas.width * 4 + j * 4 + 2] = 0
    image.data[i * canvas.width * 4 + j * 4 + 3] = 255
  }
  return false
}

function reset() {
  // resets everything and generates again
  x_range = [-2, 1]
  y_range = [-1.3, 1.3]
  numb_start = null
  max_iterations = 512
  document.getElementById("iterations").value = 512
  max_iterations = document.getElementById("iterations").value
  color_scheme = document.getElementById("dropdown-choice").value
  generate()
  return false
}

reset()

function start_generate() {
  // start a generation based on the given parameters
  max_iterations = document.getElementById("iterations").value
  color_scheme = document.getElementById("dropdown-choice").value

  generate()
}

$("#mandel-form").on("submit", function(e) {
  e.preventDefault()
  start_generate()
})
