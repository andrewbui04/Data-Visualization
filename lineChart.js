function init() {
    var w = window.innerWidth;
    var h = 600;
    var padding = 90;

    // Extract the country name from the URL query parameter
    var urlParams = new URLSearchParams(window.location.search);
    var countryName = urlParams.get('name');

    // Load the CSV file
    d3.csv("map.csv").then(function(csvData) {
        // Extract country names and their respective data
        var countriesData = csvData.map(function(d) {
            var countryData = {
                country: d.country
            };
            // Parse each month's data into an array of objects with month and value
            var monthData = [];
            // Loop through the columns starting from the second one (index 1)
            for (var i = 1; i < Object.keys(d).length; i++) {
                var columnName = Object.keys(d)[i];
                var monthYear = parseMonthYear(columnName);
                monthData.push({
                    monthYear: monthYear,
                    value: +d[columnName] // Parse value as a number
                });
            }
            countryData.data = monthData;
            return countryData;
        });

       
        // Find the index of the country in the countriesData array
        var countryIndex = countriesData.findIndex(function(d) {
            return d.country === countryName;
    });

    // Check if the countryIndex is valid
    if (countryIndex !== -1) {
        // Call the lineChart function with the data for the selected country
        lineChart(countriesData[countryIndex]);
    } else {
        console.error("Country is invalid: " + countryName);
    }
        
    });

    // Function to parse month and year strings into JavaScript Date objects
    function parseMonthYear(monthYearString) {
        // Extract year and month from the column name -> Finally, return JavaScript Date object
        var yearMonth = monthYearString.split("-");
        var year = +yearMonth[0]; // Convert year to number
        var month = +yearMonth[1] - 1; // Convert month to number and subtract 1 for zero-based index
        return new Date(year, month);
    }

    // Function to create the line chart
    function lineChart(countryData) {
        // Remove the previous chart
        d3.select(".lineChart").selectAll("svg").remove();
    
        // Define SVG
        var svg = d3.select(".lineChart")
            .append("svg")
            .attr("width", window.innerWidth)
            .attr("height", h);
    
        // Define scales
        var xScale = d3.scaleTime()
            .domain([parseMonthYear("2022-03"), parseMonthYear("2024-01")]) // March 2022 to January 2024
            .range([padding, w - padding + 12]);
    
        var yScale = d3.scaleLinear()
            .domain([0, d3.max(countryData.data, function(d) { return d.value; })])
            .range([h - padding, padding+50]);
    
        // Define axes
        var xAxis = d3.axisBottom(xScale)
            .tickValues([
                parseMonthYear("2022-03"), parseMonthYear("2022-04"), parseMonthYear("2022-05"),parseMonthYear("2022-06"),parseMonthYear("2022-07"),parseMonthYear("2022-08"),parseMonthYear("2022-09"),parseMonthYear("2022-10"),parseMonthYear("2022-11"),parseMonthYear("2022-12"), 
                parseMonthYear("2023-01"), parseMonthYear("2023-02"), parseMonthYear("2023-03"), parseMonthYear("2023-04"), parseMonthYear("2023-05"),parseMonthYear("2023-06"), parseMonthYear("2023-07"), parseMonthYear("2023-08"), 
                parseMonthYear("2023-09"),  parseMonthYear("2023-10"), parseMonthYear("2023-11"),parseMonthYear("2023-12"), parseMonthYear("2024-01")
            ]) 
            .tickFormat(d3.timeFormat("%b %Y")); // Format tick labels as "Month Year"
    
        var yAxis = d3.axisLeft(yScale);
    
        // Draw x-axis
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + (h - padding) + ")")
            .style("font-size", "13px")
            .call(xAxis);
    
        // Draw y-axis
        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", "translate(" + padding + ",0)")
            .style("font-size", "16px")
            .call(yAxis);
    
        // Draw line
        var line = d3.line()
            .x(function(d) { return xScale(d.monthYear); })
            .y(function(d) { return yScale(d.value); });
    
        var path = svg.append("path")
            .datum(countryData.data)
            .attr("class", "line")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "#FFDD00")
            .attr("stroke-width", 2);
            // Get the total length of the line
        var totalLength = path.node().getTotalLength();

        path.attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
        
        // Add tooltip
        var tooltip = d3.select(".lineChart")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "slategrey")
        .style("color", "gold")
        .style("padding", "10px")
        .style("font-size", "14px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("font-weight", "bold")
        .style("right", "14rem")
        .style("top", "110px"); 
        // Add dots
        svg.selectAll(".dot")
        .data(countryData.data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", function(d) { return xScale(d.monthYear); })
        .attr("cy", function(d) { return yScale(d.value); })
        .attr("r", 5)
        .attr("fill", "#0057B7")
        .attr("cursor", "pointer")
        .on("mouseover", function(events, d) {
            var ukrainianRefugee = d.value;
            var monthYear = d3.timeFormat("%b %Y")(d.monthYear); 
            tooltip.style("visibility", "visible")
                .style("font-size", "18px")
                .html("Total refugees: " + ukrainianRefugee.toLocaleString() + " (" + monthYear + ")");
        })
        .on("mouseout", function(d) {
            tooltip.style("visibility", "hidden")
                    .style("font-size", "14px");
        });

        // Add title
        svg.append("text")
            .attr("x", w / 2)
            .attr("y", padding/3)
            .attr("text-anchor", "middle")
            .style("font-size", "32px")
            .style("font-weight", "bold")
            .text("Ukrainian Refugees in " + countryData.country);
    
        // Add axis labels
        svg.append("text")
        //.attr("transform", "rotate(-90)") -> make the text horizontal
        .attr("x", w/14)
        .attr("y", h/200)
        .attr("dy", "9em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Number of Refugees");
    
        svg.append("text")
            .attr("x", w / 2)
            .attr("y", h - padding / 2)
            //.attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Time");
    }
    
}

window.onload = init;
