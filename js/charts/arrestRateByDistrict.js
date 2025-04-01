import { loadData } from "../loadData.js";

export async function arrestRateByDistrict() {
  const width = 800, height = 500;

  const data = await loadData();

  data.forEach(d => {
    d.District = +d.District;
    d.Arrest = d.Arrest === "True";
  });

  const districtCounts = d3.rollup(data, v => v.length, d => d.District);
  const arrestCounts = d3.rollup(data.filter(d => d.Arrest), v => v.length, d => d.District);

  const districtRates = Array.from(districtCounts, ([district, total]) => ({
    district,
    rate: (arrestCounts.get(district) || 0) / total * 100
  })).sort((a, b) => b.rate - a.rate);

  d3.select("#arrest-rate").selectAll("*").remove();

  const margin = { top: 20, right: 30, bottom: 50, left: 70 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const svg = d3.select("#arrest-rate")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain([0, d3.max(districtRates, d => d.rate)])
    .range([0, chartWidth]);

  const y = d3.scaleBand()
    .domain(districtRates.map(d => d.district))
    .range([0, chartHeight])
    .padding(0.1);

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).tickFormat(d => d.toFixed(1) + "%"));

  g.append("g").call(d3.axisLeft(y));

  // Bars
  g.selectAll("rect")
    .data(districtRates)
    .enter()
    .append("rect")
    .attr("y", d => y(d.district))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", 0)
    .attr("fill", "green")
    .transition()
    .duration(800)
    .delay((d, i) => i * 30)
    .attr("width", d => x(d.rate));

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("visibility", "hidden");

  g.selectAll("rect")
    .on("mouseover", (event, d) => {
      tooltip.html(
        `<strong>District:</strong> ${d.district}<br><strong>Arrest Rate:</strong> ${d.rate.toFixed(2)}%`
      )
        .style("top", `${event.pageY - 20}px`)
        .style("left", `${event.pageX + 10}px`)
        .style("visibility", "visible");
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  // X Axis Label
  svg.append("text")
    .attr("x", margin.left + chartWidth / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Arrest Rate (%)");

  // Y Axis Label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("District");
}
