// charts/crimeTrends.js
import { loadData } from "../loadData.js";

export async function crimeTrends() {
  const width = 800, height = 500;
  const data = await loadData();

  data.forEach(d => d.Year = +d.Year);
  const validData = data.filter(d => d.Year >= 2015 && d.Year <= 2024);
  const yearlyCounts = d3.rollup(validData, v => v.length, d => d.Year);
  const counts = Array.from(yearlyCounts, ([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year);

  const svg = d3.select("#crime-trends").append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3.scaleLinear().domain([2015, 2024]).range([50, width - 50]);
  const y = d3.scaleLinear().domain([0, d3.max(counts, d => d.count)]).range([height - 50, 50]);

  svg.append("g")
    .attr("transform", `translate(0,${height - 50})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", "translate(50,0)")
    .call(d3.axisLeft(y));

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.count))
    .curve(d3.curveMonotoneX);

  const path = svg.append("path")
    .datum(counts)
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Animate the line drawing
  const totalLength = path.node().getTotalLength();
  path
    .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(1000)
    .ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0);

  svg.selectAll("circle")
    .data(counts)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(0))
    .attr("r", 4)
    .attr("fill", "red")
    .transition()
    .duration(800)
    .delay((d, i) => i * 50)
    .attr("cy", d => y(d.count));
}
