// charts/hourlyFrequency.js
import { loadData } from "../loadData.js";

export async function drawHourlyFrequency() {
  const data = await loadData();
  const parseDate = d3.timeParse("%m/%d/%Y %I:%M:%S %p");

  const hourlyCounts = d3.rollups(
    data,
    v => new Set(v.map(d => d.ID)).size,
    d => {
      const date = parseDate(d.Date);
      return date ? date.getHours() : null;
    }
  ).filter(d => d[0] !== null).sort((a, b) => a[0] - b[0]);

  const margin = { top: 30, right: 30, bottom: 50, left: 70 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#hourly-frequency")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 23]).range([0, width]);
  const y = d3.scaleLinear().domain([0, d3.max(hourlyCounts, d => d[1])]).range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(24).tickFormat(d3.format("d")));

  svg.append("g").call(d3.axisLeft(y));

  svg.append("path")
    .datum(hourlyCounts)
    .attr("fill", "none")
    .attr("stroke", "orange")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => x(d[0]))
      .y(d => y(d[1]))
      .curve(d3.curveMonotoneX)
    );

  // Tooltip div
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("visibility", "hidden");

  svg.selectAll("circle")
    .data(hourlyCounts)
    .enter().append("circle")
    .attr("cx", d => x(d[0]))
    .attr("cy", d => y(d[1]))
    .attr("r", 3)
    .attr("fill", "orange")
    .on("mouseover", (event, d) => {
      tooltip.html(`<strong>Hour:</strong> ${d[0]}:00<br><strong>Crimes:</strong> ${d[1].toLocaleString()}`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`)
        .style("visibility", "visible");
      d3.select(event.currentTarget).attr("fill", "red");
    })
    .on("mouseout", (event) => {
      tooltip.style("visibility", "hidden");
      d3.select(event.currentTarget).attr("fill", "orange");
    });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("font-size", "14px")
    .attr("text-anchor", "middle")
    .text("Hour of Day");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -45)
    .style("font-size", "14px")
    .attr("text-anchor", "middle")
    .text("Number of Crimes");
}
