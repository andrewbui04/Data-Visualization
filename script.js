function init() {
    // Define the width and height of the SVG canvas
    var w = window.innerWidth;
    var h = window.innerHeight;

    // Create a new geographical projection using the Mercator projection
    // This will be used to convert GeoJSON coordinates into SVG coordinates
    var projection = d3.geoMercator()
                        .center([ 13, 52 ])
                        .scale([ 560 ])
                        .translate([ w / 2, h / 2 ]);

    // Create a new geographic path generator
    // This will be used to convert GeoJSON objects into SVG path data
    var path = d3.geoPath()
                .projection(projection); // Set the projection to be used by the path generator

    var geoJsonUrl = "https://gist.githubusercontent.com/spiker830/3eab0cb407031bf9f2286f98b9d0558a/raw/7edae936285e77be675366550e20f9166bed0ed5/europe_features.json"

    // set color scale
    var color = d3.scaleThreshold()
                    .domain([1000,10000,100000,500000,1000000,1500000])
                    .range(["#ffc9bb", "#ffa590", "#ff8164", "#ff4122", "#ed3419", "#c61a09"]);

    
                
    // Select the chart div and append an SVG canvas to it
    var svg = d3.select("#chart")
                .append("svg")
                .attr("width", w) // Set the width of the SVG canvas
                .attr("height", h * 0.85 ) // Set the height of the SVG canvas
                .attr("fill", "grey"); // Set the fill color of the SVG canvas

    // Define the chosen_dataset variable outside of the updateMap function
    var chosen_dataset = "dataset1.csv";

    // Move the updateMap function outside of the init function
    window.updateMap = function(sliderValue) {
        // Update the chosen_dataset based on the slider value
        chosen_dataset = sliderValue === "0" ? "dataset1.csv" : "dataset2.csv";
        // Remove the previous choropleth map
        d3.select("#chart").selectAll("path").remove();
        
        d3.csv(chosen_dataset).then(function(data) {

            // Request the GeoJSON
            d3.json(geoJsonUrl).then(function(geojson) {

                for (var i = 0; i < data.length; i++) {
                    var dataCountry = data[i].coa_name; // Get the country name
                    var dataValue = parseFloat(data[i].refugees); // Get the value
                    // For each feature in the GeoJSON data
                    for (var j = 0; j < geojson.features.length; j++) {
                        var jsonCountry = geojson.features[j].properties.name; // Get the country name
                        // If the country names match
                        if (dataCountry == jsonCountry) {
                            // Set the value of the GeoJSON feature
                            geojson.features[j].properties.refugees = dataValue;
                            break;
                        }
                    }
                }

                // Tell D3 to render a path for each GeoJSON feature
                svg.selectAll("path")
                    .data(geojson.features)
                    .enter()
                    .append("path")
                    .attr("d", path)
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
                    // Add a title for each bar for accessibility
                    .append("title")
                    .text(function(d){
                        return d.properties.name+": " + d.properties.refugees;
                    });
            });
        });
    }
                
    updateMap("0");


    // set legend
    
    svg.append("g")
        .attr("class", "legendThreshold")
        .attr("transform", "translate(0, " + h / 1.45 + ")");
    

    var legend = d3.legendColor()
                    .labelFormat(d3.format(",.0f"))
                    .labels(d3.legendHelpers.thresholdLabels)
                    .labelOffset(10)
                    .shapePadding(0)
                    .scale(color);

    svg.select(".legendThreshold")
        .call(legend);
    }

    // Create a container for the slider and labels
    var sliderContainer = d3.select("body").append("div")
                            .attr("id", "sliderContainer");

    // Add the label for the start of the slider
    sliderContainer.append("div")
        .attr("class", "sliderLabel")
        .text("Dec 2022");

    // Add the slider
    sliderContainer.append("input")
        .attr("type", "range")
        .attr("min", "0")
        .attr("max", "1")
        .attr("value", "0")
        .attr("id", "yearSlider")
        .on("input", function() {
            updateMap(this.value);
        });

    // Add the label for the end of the slider
    sliderContainer.append("div")
        .attr("class", "sliderLabel")
        .text("Dec 2023");

// Set the `init` function to be called when the window is loaded
window.onload = init;