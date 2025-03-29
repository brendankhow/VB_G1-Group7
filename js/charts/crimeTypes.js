import { loadData } from "../loadData.js";

export async function crimeTypes() {
  const margin = { top: 20, right: 30, bottom: 40, left: 180 };
  const width = 760 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const data = await loadData();

  const typeCounts = d3.rollup(data, v => v.length, d => d["Primary Type"]);
  const sortedTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  d3.select("#crime-types").select("svg").remove();

  const svg = d3.select("#crime-types").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const y = d3.scaleBand()
    .domain(sortedTypes.map(d => d[0]))
    .range([0, height])
    .padding(0.1);

  const x = d3.scaleLinear()
    .domain([0, d3.max(sortedTypes, d => d[1])])
    .range([0, width]);

  // Y Axis
  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px");

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(",")));

  // X Axis Label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Number of Crimes");

  // Y Axis Label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 14) // move further left (smaller value = farther left)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Crime Type");


  // Bars
  svg.selectAll("rect")
    .data(sortedTypes)
    .enter().append("rect")
    .attr("y", d => y(d[0]))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", 0)
    .attr("fill", "steelblue")
    .transition()
    .duration(1000)
    .attr("width", d => x(d[1]));

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("visibility", "hidden");

  svg.selectAll("rect")
    .on("mouseover", (event, d) => {
      tooltip.html(`<strong>Type:</strong> ${d[0]}<br><strong>Crimes:</strong> ${d[1].toLocaleString()}`)
        .style("top", `${event.pageY - 20}px`)
        .style("left", `${event.pageX + 10}px`)
        .style("visibility", "visible");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));
}
