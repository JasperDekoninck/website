description_to_icon = {
    800: ["wi-day-sunny", "wi-night-clear"],
    801: ["wi-day-cloudy", "wi-night-alt-cloudy"],
    802: ["wi-day-cloudy", "wi-night-alt-cloudy"],
    803: ["wi-day-cloudy", "wi-night-alt-cloudy"],
    804: ["wi-cloudy", "wi-cloudy"],
    211: ["wi-thunderstorm", "wi-thunderstorm"],
    601: ["wi-snow-wind", "wi-snow-wind"],
    701: ["wi-day-fog", "wi-night-fog"],
    200: ["wi-day-sleet-storm", "wi-night-alt-sleet-storm"],
    201: ["wi-day-sleet-storm", "wi-night-alt-sleet-storm"],
    202: ["wi-storm-showers", "wi-storm-showers"],
    210: ["wi-day-sleet-storm", "wi-night-alt-sleet-storm"],
    212: ["wi-thunderstorm", "wi-thunderstorm"],
    221: ["wi-thunderstorm", "wi-thunderstorm"],
    230: ["wi-day-sleet-storm", "wi-night-alt-sleet-storm"],
    231: ["wi-day-sleet-storm", "wi-night-alt-sleet-storm"],
    232: ["wi-thunderstorm", "wi-thunderstorm"],
    300: ["wi-day-showers", "wi-night-alt-showers"],
    301: ["wi-day-showers", "wi-night-alt-showers"],
    302: ["wi-showers", "wi-showers"],
    310: ["wi-showers", "wi-showers"],
    311: ["wi-sleet", "wi-sleet"],
    312: ["wi-showers", "wi-showers"],
    313: ["wi-sleet", "wi-sleet"],
    314: ["wi-sleet", "wi-sleet"],
    321: ["wi-showers", "wi-showers"],
    500: ["wi-day-showers", "wi-night-alt-showers"],
    501: ["wi-day-rain", "wi-night-alt-rain"],
    502: ["wi-day-rain", "wi-night-alt-rain"],
    503: ["wi-day-rain", "wi-night-alt-rain"],
    504: ["wi-day-rain", "wi-night-alt-rain"],
    511: ["wi-day-snow-wind", "wi-night-alt-snow-wind"],
    520: ["wi-showers", "wi-showers"],
    521: ["wi-showers", "wi-showers"],
    522: ["wi-sleet", "wi-sleet"],
    531: ["wi-sleet", "wi-sleet"],
    600: ["wi-day-snow-wind", "wi-night-snow-alt-wind"],
    601: ["wi-day-snow-wind", "wi-night-snow-alt-wind"],
    602: ["wi-snow-wind", "wi-snow-wind"],
    611: ["wi-sleet", "wi-sleet"],
    612: ["wi-day-alt-sleet", "wi-night-alt-sleet"],
    613: ["wi-sleet", "wi-sleet"],
    615: ["wi-alt-sleet", "wi-alt-sleet"],
    616: ["wi-sleet", "wi-sleet"],
    620: ["wi-alt-sleet", "wi-alt-sleet"],
    621: ["wi-sleet", "wi-sleet"],
    622: ["wi-sleet", "wi-sleet"],
    701: ["wi-day-fog", "wi-night-fog"],
    711: ["wi-smoke", "wi-smoke"],
    721: ["wi-fog", "wi-fog"],
    731: ["wi-sandstorm", "wi-sandstorm"],
    741: ["wi-day-fog", "wi-night-fog"],
    751: ["wi-sandstorm", "wi-sandstorm"],
    761: ["wi-day-fog", "wi-night-fog"],
    762: ["wi-volcano", "wi-volcano"],
    771: ["wi-strong-wind", "wi-strong-wind"],
    781: ["wi-tornado", "wi-tornado"],
}

var weather = JSON.parse(document.getElementById('weather').innerHTML)

function kelvinToCelcius(kelvin) {
    return Math.round((kelvin - 273.15) * 10) / 10
}

function zfill(number, fill) {
    var output = number.toString();
    while (output.length < fill) {
        output = "0" + output
    }
    return output
}

function UTCToHours(UTC, timezone) {
    var time = (UTC + timezone) % (24 * 3600);
    var hours = Math.floor(time / 3600);
    var minutes = Math.floor((time - hours * 3600) / 60);
    var timeCorrect = zfill(hours, 2) + ":" + zfill(minutes, 2)
    return timeCorrect
}

function UTCToDate(UTC, timezone) {
    var d = new Date((UTC + timezone) * 1000)
    var dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getUTCDay()]
    var dayOfMonth = d.getUTCDate()
    var month = d.toDateString().split(" ")[1]
    var UCTString = d.toUTCString()
    var hour = UCTString.substring(UCTString.length - 12, UCTString.length - 7)
    return [dayOfWeek, dayOfMonth, month, hour]
}

function mstokmh(speed) {
    return speed * 3.6
}

function determineIcon(dt, dt_up, dt_down, id_description) {
    if (dt < dt_up || dt > dt_down) {
        return description_to_icon[id_description][1]
    }
    return description_to_icon[id_description][0]
}

function determineIconHourly(dt, dt_up, dt_down, id_description) {
    var seconds_day = 24 * 3600
    if ((dt_up % seconds_day) < (dt % seconds_day) && (dt % seconds_day) < (dt_down % seconds_day)) {
        return description_to_icon[id_description][0]
    }
    return description_to_icon[id_description][1]
}

function determineIconDay(id_description) {
    return description_to_icon[id_description][0]
}

function uviDescription(uvi) {
    if (uvi <= 3) {
        return "low"
    } else if (uvi <= 6) {
        return "medium"
    } else if (uvi <= 8) {
        return "high"
    } else {
        return "very high"
    }
}

function onHover(data, hoverInfo) {
    $("#hourly-info").offset({left:data.event.pageX, top:data.event.pageY});
    hoverInfo.style.visibility = "visible"
    var dataHour = weather.hourly[data.points[0].x]
    var icon = determineIconHourly(dataHour.dt, weather.current.sunrise, weather.current.sunset, dataHour.weather[0].id)
    hoverInfo.innerHTML = `
    <div class="time-hourly">${UTCToHours(dataHour.dt, weather.timezone_offset)}</div>
    <div class="icon-hourly"><i class="wi ${icon}"></i></div>
    <div class="description-hourly">${dataHour.weather[0].description}</div>
    <table>
        <tr>
            <td>Temperature</td>
            <th>${Math.round(kelvinToCelcius(dataHour.temp) * 10) / 10}°C</th>
        </tr>
        <tr>
            <td>Rain probability</td>
            <th>${Math.round(dataHour.pop * 100)}%</td>
        </tr>
        <tr>
            <td>Wind</td>
            <th>${Math.round(mstokmh(dataHour.wind_speed)).toString() + " km/h"}</th>
        </tr>
        <tr>
            <td>Clouds</td>
            <th>${Math.round(dataHour.clouds)}%</th>
        </tr>
        <tr>
            <td>UV Index</td>
            <th>${ uviDescription(dataHour.uvi)}</th>
        </tr>
        <tr>
            <td>Humidity</td>
            <th>${Math.round(dataHour.humidity)}%</th>
        </tr>
    </table>
    `
}

document.getElementById("temp-button").onclick = function() {
    document.getElementById("hourly-plot-temp").style.display = "block"
    document.getElementById("hourly-plot-rain").style.display = "none"
    document.getElementById("temp-button").classList.add('active')
    document.getElementById("rain-button").classList.remove('active')
}

document.getElementById("rain-button").onclick = function() {
    document.getElementById("hourly-plot-rain").style.display = "block"
    document.getElementById("hourly-plot-temp").style.display = "none"
    document.getElementById("rain-button").classList.add('active')
    document.getElementById("temp-button").classList.remove('active')
}

if (weather != null) {
    var currentIcon = determineIcon(weather.current.dt, weather.current.sunrise, 
                                    weather.current.sundown, weather.current.weather[0].id)
    document.getElementById("city").innerHTML = document.getElementById("city-input").innerHTML
    var dateObj = UTCToDate(weather.current.dt, weather.timezone_offset)
    document.getElementById("time-now").innerHTML = `${dateObj[0]}, ${dateObj[1]} ${dateObj[2]} ${dateObj[3]}`
    document.getElementById("temperature-now").innerHTML = kelvinToCelcius(weather.current.temp).toString() + `°C  
    &nbsp;  <i class='wi ${currentIcon}'></i>`                                                      
    document.getElementById("description-now").innerHTML = weather.current.weather[0].description  
    document.getElementById("wind-now").innerHTML = Math.round(mstokmh(weather.current.wind_speed)).toString() + " km/h"   
    document.getElementById("rain-now").innerHTML = Math.round(weather.minutely[0]["precipitation"] * 1000) / 1000 + " mm"  
    document.getElementById("UV-now").innerHTML = uviDescription(weather.current.uvi)  
    document.getElementById("humidity-now").innerHTML = weather.current.humidity.toString() + "%"   
    document.getElementById("pressure-now").innerHTML = weather.current.pressure.toString() + " Pa"   
    document.getElementById("clouds-now").innerHTML = weather.current.clouds.toString() + "%"  
    document.getElementById("real-feel-now").innerHTML = (Math.round(kelvinToCelcius(weather.current.feels_like) * 10) / 10).toString() + "°C"   
    document.getElementById("dew-now").innerHTML = (Math.round(kelvinToCelcius(weather.current.dew_point) * 10) / 10).toString() + "°C"   
    document.getElementById("sunset-now").innerHTML = UTCToHours(weather.current.sunset, weather.timezone_offset)   
    document.getElementById("sunrise-now").innerHTML = UTCToHours(weather.current.sunrise, weather.timezone_offset) 
    
    var x = []
    var y = []
    var any_rain = false;
    for (const minute of weather.minutely) {
        x.push(UTCToHours(minute.dt, weather.timezone_offset))
        y.push(minute.precipitation)
        if (minute.precipitation > 0) {
            any_rain = true;
        }
    }
    var data = [
        {
          x: x,
          y: y,
          type: 'bar',  
          hoverinfo: "none"       
        }
    ];

    var layout =  {
        yaxis: {fixedrange: true, range: [0, 3]},
        xaxis : {fixedrange: true, tickangle: -45, nticks: 13}, 
        dragmode: false, 
        width: Math.min(600, window.innerWidth * 0.95), 
        margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 0,
            pad: 0
          },
        height: document.getElementById("current-weather").clientHeight,
    }
    if (any_rain) {
        Plotly.newPlot(document.getElementById("minute-weather"), data, layout, 
        {displayModeBar: false})
    } else {
        layout["title"] = {text: "No rain expected", x: 0.5, y: 0.5}
        Plotly.newPlot(document.getElementById("minute-weather"), data, layout, 
        {displayModeBar: false})
    }

    var x = []
    var x_ticks = []
    var x_skip_ticks = []
    var y1 = []
    var y2 = []
    var any_rain = false;
    for (var i =0; i < weather.hourly.length; i++) {
        const hour = weather.hourly[i]
        x.push(i)
        if (i % 3 == 0) {
            x_skip_ticks.push(i)
            x_ticks.push(UTCToHours(hour.dt, weather.timezone_offset))
        }
        
        y1.push(kelvinToCelcius(hour.temp))
        y2.push(hour.pop * 100)
        if (hour.pop > 0) {
            any_rain = true;
        }
    }

    var dataTemp = [
        {
          x: x,
          y: y1,
          type: 'scatter',
          mode: 'lines+markers',
          marker: {color: "rgb(255,157,59)", size: 8},
          hoverinfo: "none"         
        }
    ];

    var dataRain = [
        {
          x: x,
          y: y2,
          type: 'bar',
          hoverinfo: "none"         
        }
    ];

    var layout =  {
        yaxis: {fixedrange: true},
        xaxis : {fixedrange: true, 
                tickangle: -45,
                tickvals: x_skip_ticks,
                ticktext: x_ticks}, 
        dragmode: false,
        margin: {
            l: 50,
            r: 50,
            b: 50,
            t: 0,
            pad: 0
          },
        height: Math.min(400, document.getElementById("hourly-weather").clientWidth / 1.5),
        width: document.getElementById("hourly-weather").clientWidth,
    }
    console.log("hello")

    var plotTemp = document.getElementById("hourly-plot-temp")
    var plotRain = document.getElementById("hourly-plot-rain")
    Plotly.newPlot(plotTemp, dataTemp, layout, 
        {displayModeBar: false})

    layout.yaxis.autorange = false
    layout.yaxis.range = [0, 100]
    if (any_rain) {
        Plotly.newPlot(plotRain, dataRain, layout, 
        {displayModeBar: false})
    } else {
        layout["title"] = {text: "No rain expected", x: 0.5, y: 0.5}
        Plotly.newPlot(plotRain, dataRain, layout, 
        {displayModeBar: false})
    }

    var hoverInfo = document.getElementById("hourly-info")
    
    plotTemp.on('plotly_hover', function(data){
        onHover(data, hoverInfo)
    })
        .on('plotly_unhover', function(data){
        hoverInfo.innerHTML = '';
        hoverInfo.style.visibility = "hidden"
    });

    plotRain.on('plotly_hover', function(data){
        onHover(data, hoverInfo)
    })
        .on('plotly_unhover', function(data){
        hoverInfo.innerHTML = '';
        hoverInfo.style.visibility = "hidden"
    });

    var weatherDaily = document.getElementById("daily-weather")
    weatherDaily.innerHTML = ""
    for (const day of weather.daily) {
        var icon = determineIconDay(day.weather[0].id)
        var dateObj = UTCToDate(day.dt, weather.timezone_offset)
        weatherDaily.innerHTML += `
        <div class="day">
            <div class="time-daily">${dateObj[0]}, ${dateObj[1]} ${dateObj[2]}</div>
            <div class="icon-daily"><i class="wi ${icon}"></i></div>
            <div class="description-daily">${day.weather[0].description}</div>
            <table>
                <tr>
                    <td>Min temperature</td>
                    <th>${Math.round(kelvinToCelcius(day.temp.min) * 10) / 10}°C</th>
                </tr>
                <tr>
                    <td>Max temperature</td>
                    <th>${Math.round(kelvinToCelcius(day.temp.max) * 10) / 10}°C</th>
                </tr>
                <tr>
                    <td>Rain probability</td>
                    <th>${Math.round(day.pop * 100)}%</td>
                </tr>
                <tr>
                    <td>Wind</td>
                    <th>${Math.round(mstokmh(day.wind_speed)).toString() + " km/h"}</th>
                </tr>
                <tr>
                    <td>Clouds</td>
                    <th>${Math.round(day.clouds)}%</th>
                </tr>
                <tr>
                    <td>UV Index</td>
                    <th>${ uviDescription(day.uvi)}</th>
                </tr>
                <tr>
                    <td>Humidity</td>
                    <th>${Math.round(day.humidity)}%</th>
                </tr>
            </table>
        </div>
        `
    }
}
