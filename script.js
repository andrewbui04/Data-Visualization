function init() {
    // Define the width and height of the SVG canvas
    var w = window.innerWidth;
    var h = 750;

    // Create a new geographical projection using the Mercator projection
    // This will be used to convert GeoJSON coordinates into SVG coordinates
    var projection = d3.geoMercator()
                        .center([ 13, 52 ])
                        .scale([ 620 ])
                        .translate([ w / 2, h / 1.6]);

    // Create a new geographic path generator
    // This will be used to convert GeoJSON objects into SVG path data
    var path = d3.geoPath()
                .projection(projection); // Set the projection to be used by the path generator

    var geoJsonUrl = "https://gist.githubusercontent.com/spiker830/3eab0cb407031bf9f2286f98b9d0558a/raw/7edae936285e77be675366550e20f9166bed0ed5/europe_features.json"

    // set color scale
    var color = d3.scaleThreshold()
                    .domain([1000,10000,100000,500000,1000000,5000000])
                    .range(["#ffc9bb", "#ffa590", "#ff8164", "#ff4122", "#ed3419", "#c61a09"]);
                
    // Select the chart div and append an SVG canvas to it
    var svg = d3.select("#chart")
                .append("svg")
                .attr("width", w) // Set the width of the SVG canvas
                .attr("height", h) // Set the height of the SVG canvas
                .attr("fill", "grey"); // Set the fill color of the SVG canvas

    // Create a date parser and formatter
    const parseTime = d3.timeParse("%Y-%m");
    const formatTime = d3.timeFormat("%Y-%m");

    // Load the data outside of the updateMap function
    var geojsonData, csvData;

    d3.json(geoJsonUrl).then(function(geojson) {
        geojsonData = geojson;
        d3.csv("map.csv").then(function(data) {
            csvData = data;
            // Call updateMap with '2022-03' to '2022-07' for initial display
            updateMap("2022-03", "2022-07", csvData, geojsonData);
        });
    });

    function updateMap(selectedStartDate, selectedEndDate, data, geojson) {
        // Remove the previous choropleth map
        d3.select("#chart").selectAll(".country").remove();

        // Create a date range from selectedStartDate to selectedEndDate
        var startDate = parseTime(selectedStartDate);
        var endDate = parseTime(selectedEndDate);
        var dateRange = d3.timeMonths(startDate, d3.timeMonth.offset(endDate, 1)); // The end date is exclusive, so add 1 month to include it
        
        for (var i = 0; i < data.length; i++) {
            var dataCountry = data[i]['country']; // Get the country name

            // Initialize the sum of the values and the count of valid data values
            var sum = 0;
            var count = 0;

            // Iterate over the date range and sum the values for each date
            dateRange.forEach(function(date) {
                var dateString = formatTime(date);
                console.log(dateString);
                var dataValue = parseFloat(data[i][dateString]);
                if (!isNaN(dataValue)) {
                    sum += dataValue;
                    count++;
                }
            
                // For each feature in the GeoJSON data
                for (var j = 0; j < geojson.features.length; j++) {
                    var jsonCountry = geojson.features[j].properties.name; // Get the country name
                    // If the country names match
                    if (dataCountry == jsonCountry) {
                        // Set the value of the GeoJSON feature
                        geojson.features[j].properties.refugees = Math.round(sum / count);
                        break;
                    }
                }
            });
        }

        // Tell D3 to render a path for each GeoJSON feature
        svg.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "country")
            .style("fill", function(d) { // Set the fill color of the path
                if (d.properties.name === 'Ukraine') {
                    // Create a linear gradient for Ukraine
                    var gradient = svg.append("defs")
                        .append("linearGradient")
                        .attr("id", "gradient")
                        .attr("x1", "0%")
                        .attr("y1", "0%")
                        .attr("x2", "0%")
                        .attr("y2", "100%");
        
                    gradient.append("stop")
                        .attr("offset", "50%")
                        .attr("stop-color", "#0057B7");
        
                    gradient.append("stop")
                        .attr("offset", "50%")
                        .attr("stop-color", "#FFDD00");
        
                    return "url(#gradient)";
                }

                var value = d.properties.refugees; // Get the value of the feature
                
                if (value) {
                    return color(value); // If the value exists, return the corresponding color
                } else {
                    return "#ccc"; // If the value doesn't exist, return a default color
                }
            })
            // Mouseover event listener to highlight bars
            .on("mouseover", function(event, d){
                d3.select(this)
                    .style("stroke", "#001141") // Set the stroke color to black
                    .style("stroke-width", "1.5"); // Set the stroke width to 1
            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .style("stroke", "none"); // Remove the stroke on mouseout
            })
            .on("click", function(event, d) {
                // Redirect the user to a new page
                window.open("https://mercury.swin.edu.au/cos30045/s104177995/Project/lineChart.html?name=" + encodeURIComponent(d.properties.name), '_blank');
            })
            // Add a title for each bar for accessibility
            .append("title")
            .text(function(d){
                return d.properties.name+": " + d.properties.refugees;
            });
    }
        
    d3.csv("map.csv").then(function(data) {

        // Get the first row of the data
        var firstRow = data[0];

        // Get the keys of the first row
        var keys = Object.keys(firstRow);

        // Convert the dates from strings to Date objects
        var dates = keys.slice(1).map(parseTime); // Skip only the first key

        // Create a slider
        var slider = d3.sliderBottom()
            .min(d3.min(dates))
            .max(d3.max(dates))
            .width(window.innerWidth * 0.95) // Set the width to window.innerWidth
            .tickFormat(d3.timeFormat('%Y-%m'))
            .ticks(dates.length) // The number of ticks
            .step(null) // This makes the slider a range slider
            .default([parseTime('2022-03'), parseTime('2022-07')]) // Default range
            .fill('#FFDD00') // Fill color for the selected range
            .on('onchange', function(value) {
                // Format the selected dates to match the format in the data
                var selectedStartDate = d3.timeFormat('%Y-%m')(value[0]);
                var selectedEndDate = d3.timeFormat('%Y-%m')(value[1]);
                // Update the map with the new date range
                updateMap(selectedStartDate, selectedEndDate, csvData, geojsonData);
            });

        var gStep = d3.select('#chart')
            .append('svg')
            .attr('width', '100%') // Adjust the width of the SVG as well
            .attr('height', 100)
            .append('g')
            .attr('transform', 'translate(30,30)');

        gStep.call(slider);
    });

    // set legend
    svg.append("g")
        .attr("class", "legendThreshold")
        .attr("transform", "translate(24, " + h / 1.45 + ")");

    var legend = d3.legendColor()
                    .labelFormat(d3.format(",.0f"))
                    .labels(d3.legendHelpers.thresholdLabels)
                    .labelOffset(10)
                    .shapePadding(0)
                    .scale(color);

    svg.select(".legendThreshold")
        .call(legend);

}

// Set the `init` function to be called when the window is loaded
window.onload = init;