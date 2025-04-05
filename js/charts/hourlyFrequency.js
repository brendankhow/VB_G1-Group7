export async function drawHourlyFrequency(data) {
  d3.select("#hourly-frequency").html("");

  const hourlyCounts = d3.rollups(
    data,
    v => new Set(v.map(d => d.ID)).size,
    d => d.Date.getHours()
  )
    .filter(d => d[0] !== null)
    .sort((a, b) => a[0] - b[0]);

  const margin = { top: 30, right: 30, bottom: 70, left: 70 };
  const width = 900 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#hourly-frequency")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .classed("responsive-svg", true);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 23]).range([0, width]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(hourlyCounts, d => d[1])])
    .nice()
    .range([height, 0]);

  // X-axis with vertical tick labels
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(24).tickFormat(d3.format("d")))
    .selectAll("text")
    .attr("transform", null)
    .attr("x", 0)
    .attr("y", 10)
    .style("text-anchor", "middle")
    .style("font-size", "14px");

  // Y-axis
  g.append("g")
    .call(d3.axisLeft(y).ticks(5))
    .selectAll("text")
    .style("font-size", "14px");

  // Line generator
  const line = d3.line()
    .x(d => x(d[0]))
    .y(d => y(d[1]))
    .curve(d3.curveMonotoneX);

  // Line path with draw animation
  const path = g.append("path")
    .datum(hourlyCounts)
    .attr("fill", "none")
    .attr("stroke", "orange")
    .attr("stroke-width", 2)
    .attr("d", line);

  const totalLength = path.node().getTotalLength();

  path
    .attr("stroke-dasharray", totalLength + " " + totalLength)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(1000)
    .ease(d3.easeCubic)
    .attr("stroke-dashoffset", 0);

  // Tooltip setup
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("font-size", "14px")
    .style("visibility", "hidden");

  // Dots with tooltip and animation
  g.selectAll("circle")
    .data(hourlyCounts)
    .enter().append("circle")
    .attr("cx", d => x(d[0]))
    .attr("cy", d => y(d[1]))
    .attr("r", 0)
    .attr("fill", "orange")
    .on("mouseover", function (event, d) {
      tooltip.html(`<strong>Hour:</strong> ${d[0]}:00<br><strong>Crimes:</strong> ${d[1].toLocaleString()}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`)
        .style("visibility", "visible");

      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 7)
        .attr("fill", "red");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 4)
        .attr("fill", "orange");
    })
    .transition()
    .duration(800)
    .attr("r", 4);

  // X-axis label (hour of day)
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 60)
    .style("font-size", "14px")
    .attr("text-anchor", "middle")
    .text("Hour of Day (24 hours)");

  // Y-axis label (crime count)
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("dy", "-4em")
    .style("font-size", "14px")
    .attr("text-anchor", "middle")
    .text("Number of Crimes");
}
