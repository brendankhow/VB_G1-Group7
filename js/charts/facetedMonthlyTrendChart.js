// charts/facetedMonthlyTrendChart.js
import { loadData } from "../loadData.js";

export async function facetedMonthlyTrendChart() {
  const data = await loadData();

  data.forEach(d => {
    d.Date = new Date(d.Date);
    d.Month = d.Date.getMonth();
    d.Year = d.Date.getFullYear();
  });

  const grouped = d3.rollups(
    data,
    v => v.length,
    d => d.Year,
    d => d.Month
  );

  const years = Array.from(new Set(data.map(d => d.Year))).sort();
  const months = d3.range(12);

  const panelData = years.map(year => ({
    year,
    values: months.map(month => {
      const count = grouped.find(d => d[0] === year)?.[1].find(m => m[0] === month)?.[1] || 0;
      return { month, count };
    })
  }));

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const panelWidth = 250, panelHeight = 200;
  const margin = { top: 30, right: 20, bottom: 40, left: 40 };

  const svg = d3.select("#monthly-facets").append("svg")
    .attr("width", panelWidth * 4)
    .attr("height", Math.ceil(panelData.length / 4) * panelHeight);

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
    .enter().append("g")
    .attr("class", "panel")
    .attr("transform", (d, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      return `translate(${col * panelWidth},${row * panelHeight})`;
    });

  panel.append("g")
    .attr("transform", `translate(0,${panelHeight - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(i => monthNames[i]))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .attr("font-size", "10px");

  panel.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(4))
    .selectAll("text")
    .attr("font-size", "10px");

  panel.append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d => line(d.values));

  panel.append("text")
    .attr("x", panelWidth / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text(d => d.year);

  panel.each(function (d, i) {
    const g = d3.select(this);
    g.selectAll("circle")
      .data(d.values)
      .enter().append("circle")
      .attr("cx", d => x(d.month))
      .attr("cy", d => y(d.count))
      .attr("r", 3)
      .attr("fill", "steelblue")
      .on("mouseover", function (event, v) {
        tooltip.html(`<strong>Month:</strong> ${monthNames[v.month]}<br><strong>Year:</strong> ${d.year}<br><strong>Cases:</strong> ${v.count}`)
          .style("top", `${event.pageY - 20}px`)
          .style("left", `${event.pageX + 10}px`)
          .style("visibility", "visible");
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));
  });
}
