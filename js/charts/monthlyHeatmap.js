import { loadData } from "../loadData.js";

export function monthlyHeatmap() {
  loadData().then(data => {
    // Extract month names and count occurrences across all data
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthCounts = d3.rollups(
      data,
      v => v.length,
      d => new Date(d.Date).getMonth()
    );

    const processedData = monthCounts.map(([month, count]) => ({
      month: monthNames[month],
      value: count
    })).sort((a, b) => b.value - a.value); // sort descending
    

    const width = 800;
    const height = 400;
    const margin = { top: 50, right: 20, bottom: 20, left: 20 };

    const svg = d3.select("#monthly-heatmap svg");
    if (!svg.empty()) {
      svg.remove();
    }

    const newSvg = d3.select("#monthly-heatmap")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    newSvg.append("text")
      .attr("x", width / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")

    const treemapLayout = d3.treemap()
      .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
      .padding(5);

    const root = d3.hierarchy({ children: processedData })
      .sum(d => d.value);

    treemapLayout(root);

    const color = d3.scaleSequential()
      .domain([0, d3.max(processedData, d => d.value)])
      .interpolator(d3.interpolateOranges);

    const container = newSvg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const nodes = container.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => color(d.data.value))
      .style("opacity", 0)
      .transition()
      .duration(800)
      .style("opacity", 1);

    nodes.append("text")
      .attr("x", 5)
      .attr("y", 20)
      .attr("fill", "white")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => d.data.month);

    nodes.append("title")
      .text(d => `${d.data.month}: ${d.data.value.toLocaleString()} cases`);
  });
}
