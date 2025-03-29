import { loadRawData } from "../loadData.js";

export async function arrestsVsDomesticCases() {
  const raw = await loadRawData();

  raw.forEach(d => {
    d.Year = +d.Year;
    d.Arrest = String(d.Arrest).toLowerCase() === "true";
    d.Domestic = String(d.Domestic).toLowerCase() === "true";
  });

  const filtered = raw.filter(d => d.Domestic);

  const grouped = d3.rollups(
    filtered,
    v => ({
      domesticCount: v.length,
      arrestCount: v.filter(d => d.Arrest).length
    }),
    d => d.Year
  );

  const dataset = grouped.map(([year, { domesticCount, arrestCount }]) => ({
    year,
    domesticCount,
    arrestCount
  })).sort((a, b) => a.year - b.year);

  // 🛠 Adjusted dimensions and margins
  const margin = { top: 40, right: 100, bottom: 60, left: 80 };
  const width = 600;
  const height = 400;

  const svg = d3.select("#arrests-vs-domestic").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(dataset.map(d => d.year))
    .range([0, width])
    .padding(0.2);

  const yLeft = d3.scaleLinear()
    .domain([0, d3.max(dataset, d => d.domesticCount)]).nice()
    .range([height, 0]);

  const yRight = d3.scaleLinear()
    .domain([0, d3.max(dataset, d => d.arrestCount)]).nice()
    .range([height, 0]);

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  g.append("g")
    .call(d3.axisLeft(yLeft));

  g.append("g")
    .attr("transform", `translate(${width},0)`)
    .call(d3.axisRight(yRight));

  // Bars
  g.selectAll("rect")
    .data(dataset)
    .enter().append("rect")
    .attr("x", d => x(d.year))
    .attr("y", d => yLeft(d.domesticCount))
    .attr("width", x.bandwidth())
    .attr("height", d => height - yLeft(d.domesticCount))
    .attr("fill", "orange")
    .attr("opacity", 0.9);

  // Line
  const line = d3.line()
    .x(d => x(d.year) + x.bandwidth() / 2)
    .y(d => yRight(d.arrestCount))
    .curve(d3.curveMonotoneX);

  g.append("path")
    .datum(dataset)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  g.selectAll("circle")
    .data(dataset)
    .enter().append("circle")
    .attr("cx", d => x(d.year) + x.bandwidth() / 2)
    .attr("cy", d => yRight(d.arrestCount))
    .attr("r", 4)
    .attr("fill", "steelblue");

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "6px")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("visibility", "hidden");

  g.selectAll("rect, circle")
    .on("mouseover", (event, d) => {
      tooltip.style("visibility", "visible")
        .html(`<strong>Year:</strong> ${d.year}<br>
               <strong>Domestic Cases:</strong> ${d.domesticCount.toLocaleString()}<br>
               <strong>Arrests:</strong> ${d.arrestCount.toLocaleString()}`);
    })
    .on("mousemove", (event) => {
      tooltip.style("top", `${event.pageY - 20}px`)
             .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  // 📍 Axis Labels

  // X-axis
  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", height + margin.top + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Year");

  // Y-axis (left - domestic)
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height + margin.top + margin.bottom) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Domestic Cases");

  // Y-axis (right - arrests)
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height + margin.top + margin.bottom) / 2)
    .attr("y", width + margin.left + 60)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Arrests");
}
