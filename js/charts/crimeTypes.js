export async function crimeTypes(data, limit = 10) {
  const margin = { top: 20, right: 30, bottom: 50, left: 180 };

  const container = document.getElementById("crime-types");
  const maxWidth = 600;
  const containerWidth = Math.min(container.clientWidth, maxWidth);
  const width = containerWidth - margin.left - margin.right;
  const height = 265 - margin.top - margin.bottom;

  // Clear previous chart
  d3.select("#crime-types").html("");

  // Count and sort primary crime types
  const typeCounts = d3.rollup(data, v => v.length, d => d["Primary Type"]);
  const sortedTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // Update title dynamically
  document.getElementById("crime-types-title").textContent = `Top ${limit} Crime Types`;

  // Set up SVG
  const svg = d3.select("#crime-types")
    .append("svg")
    .attr("viewBox", `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .classed("responsive-svg", true);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const y = d3.scaleBand()
    .domain(sortedTypes.map(d => d[0]))
    .range([0, height])
    .padding(0.1);

  const x = d3.scaleLinear()
    .domain([0, d3.max(sortedTypes, d => d[1])])
    .nice()
    .range([0, width]);

  // Axes
  g.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px");

  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(",")));

  // Axis Labels
  g.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Number of Crimes");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 14)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Crime Type");

  // Bars
  // Draw bars with animation
  const bars = g.selectAll("rect")
  .data(sortedTypes)
  .enter()
  .append("rect")
  .attr("x", 0)
  .attr("y", d => y(d[0]))
  .attr("height", y.bandwidth())
  .attr("width", 0)
  .attr("fill", "steelblue")
  .transition()
  .duration(800)
  .attr("width", d => x(d[1]));

  // Add text labels AFTER bar animation
  g.selectAll(".label")
  .data(sortedTypes)
  .enter()
  .append("text")
  .attr("class", "label")
  .attr("x", d => x(d[1]) + 5)
  .attr("y", d => y(d[0]) + y.bandwidth() / 2)
  .attr("dy", "0.35em")
  .style("font-size", "12px")
  .style("fill", "#333")
  .style("opacity", 0) // start invisible
  .text("0")
  .transition()
  .delay(800) // wait for bar to finish
  .duration(800)
  .style("opacity", 1)
  .tween("text", function(d) {
    const i = d3.interpolate(0, d[1]);
    return function(t) {
      this.textContent = d3.format(",")(Math.round(i(t)));
    };
  });


  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("font-size", "14px")
    .style("visibility", "hidden")
    .style("pointer-events", "none");

  g.selectAll("rect")
    .on("mouseover", (event, d) => {
      tooltip.html(`<strong>Type:</strong> ${d[0]}<br><strong>Crimes:</strong> ${d[1].toLocaleString()}`)
        .style("top", `${event.pageY - 20}px`)
        .style("left", `${event.pageX + 10}px`)
        .style("visibility", "visible");

      d3.select(event.currentTarget)
        .transition().duration(200)
        .attr("fill", "orange");
    })
    .on("mouseout", (event) => {
      tooltip.style("visibility", "hidden");

      d3.select(event.currentTarget)
        .transition().duration(200)
        .attr("fill", "steelblue");
    });

  console.log("🟠 crimeTypes called with limit:", limit);
}
