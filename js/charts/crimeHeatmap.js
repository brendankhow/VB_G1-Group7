// charts/crimeHeatmap.js
import { loadData } from "../loadData.js";

export async function crimeHeatmap() {
  const width = 800, height = 500;
  const data = await loadData();

  const svg = d3.select("#crime-heatmap").append("svg")
    .attr("width", width)
    .attr("height", height);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px")
    .style("border-radius", "4px")
    .style("border", "1px solid #999")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("visibility", "hidden");

  data.forEach(d => {
    d.Date = new Date(d.Date);
    d.Month = d.Date.getMonth();
    d.Year = d.Date.getFullYear();
  });

  const grouped = d3.rollups(
    data,
    v => new Set(v.map(d => d.ID)).size,
    d => d.Year,
    d => d.Month
  );

  const years = [...new Set(data.map(d => d.Year))].sort();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const matrix = [];
  grouped.forEach(([year, monthArr]) => {
    monthArr.forEach(([month, count]) => {
      matrix.push({ year, month, count });
    });
  });

  const x = d3.scaleBand().domain(d3.range(12)).range([60, width - 30]).padding(0.05);
  const y = d3.scaleBand().domain(years).range([50, height - 30]).padding(0.05);
  const color = d3.scaleSequential(d3.interpolateOrRd).domain(d3.extent(matrix, d => d.count));

  svg.append("g")
    .attr("transform", `translate(0, 45)`)
    .call(d3.axisTop(x).tickFormat(i => months[i]))
    .selectAll("text")
    .style("text-anchor", "start")
    .attr("transform", "rotate(-45)");

  svg.append("g")
    .attr("transform", `translate(55, 0)`)
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(matrix)
    .enter().append("rect")
    .attr("x", d => x(d.month))
    .attr("y", d => y(d.year))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.count))
    .on("mouseover", function (event, d) {
      tooltip.html(`<strong>Month:</strong> ${months[d.month]}<br><strong>Year:</strong> ${d.year}<br><strong>Cases:</strong> ${d.count}`)
        .style("top", `${event.pageY - 20}px`)
        .style("left", `${event.pageX + 10}px`)
        .style("visibility", "visible");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  svg.selectAll("text.count")
    .data(matrix)
    .enter().append("text")
    .attr("x", d => x(d.month) + x.bandwidth() / 2)
    .attr("y", d => y(d.year) + y.bandwidth() / 2 + 4)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .text(d => d.count);
}
