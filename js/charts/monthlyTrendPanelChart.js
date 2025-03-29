// charts/monthlyTrendPanelChart.js
import { loadRawData } from "../loadData.js";

export async function monthlyTrendPanelChart() {
  const raw = await loadRawData();

  const data = raw.map(d => {
    const date = new Date(d.Date);
    return {
      year: date.getFullYear(),
      month: date.getMonth(), // 0–11
    };
  });

  const grouped = d3.rollups(
    data,
    v => v.length,
    d => d.year,
    d => d.month
  );

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const years = Array.from(new Set(data.map(d => d.year))).sort();
  const months = d3.range(12);

  const panelData = years.map(year => {
    const monthlyCounts = grouped.find(d => d[0] === year)?.[1] ?? [];
    const counts = months.map(month => {
      const count = monthlyCounts.find(m => m[0] === month)?.[1] || 0;
      return { month, count };
    });
    return { year, values: counts };
  });

  // Dimensions
  const panelWidth = 250;
  const panelHeight = 200;
  const margin = { top: 30, right: 20, bottom: 40, left: 40 };
  const svgWidth = panelWidth * Math.min(4, years.length);
  const svgHeight = Math.ceil(years.length / 4) * panelHeight;

  const svg = d3.select("#monthly-facets").html("").append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const x = d3.scalePoint().domain(months).range([margin.left, panelWidth - margin.right]);
  const y = d3.scaleLinear()
    .domain([0, d3.max(panelData, d => d3.max(d.values, v => v.count))])
    .range([panelHeight - margin.bottom, margin.top]);

  const line = d3.line()
    .x(d => x(d.month))
    .y(d => y(d.count))
    .curve(d3.curveMonotoneX);

  const panel = svg.selectAll("g.panel")
    .data(panelData)
    .enter()
    .append("g")
    .attr("class", "panel")
    .attr("transform", (d, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      return `translate(${col * panelWidth},${row * panelHeight})`;
    });

  // Axes
  panel.append("g")
    .attr("transform", `translate(0,${panelHeight - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(i => monthNames[i]))
    .selectAll("text")
    .attr("font-size", "10px")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  panel.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(4))
    .selectAll("text")
    .attr("font-size", "10px");

  // Line
  panel.append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d => line(d.values));

  // Dots with tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("visibility", "hidden");

  panel.each(function (d) {
    const g = d3.select(this);
    g.selectAll("circle")
      .data(d.values)
      .enter().append("circle")
      .attr("cx", v => x(v.month))
      .attr("cy", v => y(v.count))
      .attr("r", 3)
      .attr("fill", "steelblue")
      .on("mouseover", function (event, v) {
        tooltip
          .html(`<strong>Year:</strong> ${d.year}<br><strong>Month:</strong> ${monthNames[v.month]}<br><strong>Cases:</strong> ${v.count}`)
          .style("top", `${event.pageY - 20}px`)
          .style("left", `${event.pageX + 10}px`)
          .style("visibility", "visible");
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));
  });

  // Year label
  panel.append("text")
    .attr("x", panelWidth / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .text(d => d.year);
}
