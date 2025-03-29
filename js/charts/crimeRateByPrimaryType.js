// charts/crimeRateByPrimaryType.js
import { loadData } from "../loadData.js";

export async function crimeRateByPrimaryType() {
  const width = 800, height = 500;
  const data = await loadData();

  data.forEach(d => {
    d.District = +d.District;
    d.Year = +d.Year;
  });

  const svg = d3.select("#crime-rate").append("svg")
    .attr("width", width)
    .attr("height", height);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "lightgray")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("visibility", "hidden");

  const nestedData = d3.rollup(data, v => v.length, d => d.Year, d => d["Primary Type"]);

  const years = Array.from(new Set(data.map(d => d.Year))).sort();
  const crimeTypes = Array.from(new Set(data.map(d => d["Primary Type"]))).sort();

  const stackedData = years.map(year => {
    const entry = { year };
    crimeTypes.forEach(type => entry[type] = nestedData.get(year)?.get(type) || 0);
    return entry;
  });

  const stack = d3.stack().keys(crimeTypes);
  const series = stack(stackedData);

  const x = d3.scaleLinear().domain(d3.extent(years)).range([50, width - 50]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(series, s => d3.max(s, d => d[1]))])
    .range([height - 50, 50]);
  const color = d3.scaleOrdinal(d3.schemeCategory10).domain(crimeTypes);

  svg.append("g")
    .attr("transform", `translate(0,${height - 50})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("transform", "translate(50,0)")
    .call(d3.axisLeft(y));

  svg.selectAll(".layer")
    .data(series)
    .enter().append("path")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .attr("opacity", 0.8)
    .attr("d", d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
    )
    .on("mouseover", function (event, d) {
      d3.select(this).attr("opacity", 1);
      tooltip.style("visibility", "visible");
    })
    .on("mousemove", function (event, d) {
      const [mouseX] = d3.pointer(event, this);
      const year = Math.round(x.invert(mouseX));
      const closestPoint = d.find(point => point.data.year === year);
      if (closestPoint) {
        const crimeCount = closestPoint[1] - closestPoint[0];
        tooltip.html(`Year: ${year}<br>Crime Type: ${d.key}<br>Crime Rate: ${crimeCount}`)
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      }
    })
    .on("mouseout", function () {
      d3.select(this).attr("opacity", 0.8);
      tooltip.style("visibility", "hidden");
    });
}