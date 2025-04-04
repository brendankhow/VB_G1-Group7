export function facetedMonthlyTrendChart(data) {
  const container = d3.select("#monthly-facets");
  container.html(""); // Clear previous chart

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const margin = { top: 30, right: 20, bottom: 50, left: 50 };
  const panelWidth = 150;
  const panelHeight = 300;
  const months = d3.range(12);

  const containerWidth = container.node().getBoundingClientRect().width;
  const responsiveWidth = panelWidth * 12 + margin.left + margin.right;

  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${responsiveWidth} ${panelHeight + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .classed("responsive-svg", true);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const years = Array.from(new Set(data.map(d => d.Year))).sort();

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

  if (years.length > 1) {
    const grouped = d3.rollups(
      data,
      v => v.length,
      d => d.Month,
      d => d.Year
    );

    const panelData = months.map(month => {
      const yearCounts = grouped.find(d => d[0] === month)?.[1] || [];
      const values = years.map(y => {
        const found = yearCounts.find(x => x[0] === y);
        return { year: y, count: found ? found[1] : 0 };
      });
      return { month, values };
    });

    const x = d3.scalePoint().domain(years).range([0, panelWidth - margin.right]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(panelData, d => d3.max(d.values, v => v.count))])
      .nice()
      .range([panelHeight - margin.bottom, 0]);

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    const monthGroup = g.selectAll(".month-panel")
      .data(panelData)
      .enter().append("g")
      .attr("class", "month-panel")
      .attr("transform", (d, i) => `translate(${i * panelWidth},0)`);

    // 🔳 Add vertical divider lines (excluding first panel)
    g.selectAll(".panel-divider")
      .data(months.slice(1)) // skip first
      .enter()
      .append("line")
      .attr("class", "panel-divider")
      .attr("x1", d => d * panelWidth)
      .attr("x2", d => d * panelWidth)
      .attr("y1", 0)
      .attr("y2", panelHeight - margin.bottom)
      .attr("stroke", "#999")
      .attr("stroke-width", 1);

    // Show x-axis (years) in all panels
    monthGroup.append("g")
      .attr("transform", `translate(0,${panelHeight - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("font-size", "10px");

    // Only first panel shows y-axis
    monthGroup.append("g")
      .attr("transform", `translate(0,0)`)
      .each(function (d, i) {
        if (i === 0) {
          d3.select(this)
            .call(d3.axisLeft(y).ticks(4))
            .selectAll("text")
            .attr("font-size", "10px");
        }
      });

    // 🔴 Red dashed mean line
    monthGroup.append("line")
      .attr("x1", 0)
      .attr("x2", panelWidth - margin.right)
      .attr("y1", d => y(d3.mean(d.values, v => v.count)))
      .attr("y2", d => y(d3.mean(d.values, v => v.count)))
      .attr("stroke", "#e84d4d")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3");

    // 📈 Line path for trend
    monthGroup.each(function (d) {
  const g = d3.select(this);

  const path = g.append("path")
    .datum(d.values)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line);

  const totalLength = path.node().getTotalLength();

  path
    .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
    .attr("stroke-dashoffset", totalLength)
    .transition()
    .duration(1000)
    .ease(d3.easeCubic)
    .attr("stroke-dashoffset", 0);
});


    // 🗓 Month title
    monthGroup.append("text")
      .attr("x", panelWidth / 2 - margin.right)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text(d => monthNames[d.month]);

    // 🔵 Circles + hover behavior
    monthGroup.each(function (d) {
      const g = d3.select(this);
      const circles = g.selectAll("circle")
        .data(d.values, v => v.year);

      circles.enter()
        .append("circle")
        .attr("cx", v => x(v.year))
        .attr("cy", v => y(0))
        .attr("r", 3)
        .attr("fill", "steelblue")
        .merge(circles)
        .transition()
        .duration(800)
        .attr("cy", v => y(v.count));

      g.selectAll("circle")
        .on("mouseover", function (event, v) {
          tooltip.html(`<strong>Year:</strong> ${v.year}<br><strong>Cases:</strong> ${v.count}`)
            .style("top", `${event.pageY - 20}px`)
            .style("left", `${event.pageX + 10}px`)
            .style("visibility", "visible");
          d3.select(this).transition().duration(200).attr("fill", "red").attr("r", 6);
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");
          d3.select(this).transition().duration(200).attr("fill", "steelblue").attr("r", 3);
        });
    });

    // 🏷 Global x-axis label
    svg.append("text")
      .attr("x", responsiveWidth / 2)
      .attr("y", panelHeight + margin.top + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Year");

    // 🏷 Global y-axis label
    svg.append("text")
      .attr("transform", `rotate(-90)`)
      .attr("x", -(panelHeight / 2))
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Number of Cases");

  } else {
    // Single year
    const monthData = d3.rollups(
      data,
      v => v.length,
      d => d.Month
    ).map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month - b.month);

    const x = d3.scalePoint().domain(months).range([30, panelWidth * 12 - margin.right]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(monthData, d => d.count)])
      .range([panelHeight - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => x(d.month))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    const gMain = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    gMain.append("g")
      .attr("transform", `translate(0,${panelHeight - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(i => monthNames[i]))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .attr("font-size", "10px");

    gMain.append("g")
      .attr("transform", `translate(30, 0)`)
      .call(d3.axisRight(y).ticks(5))
      .selectAll("text")
      .attr("font-size", "10px")
      .attr("text-anchor", "end")
      .attr("dx", "-1.5em");

    gMain.append("path")
      .datum(monthData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2)
      .attr("d", line)
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .attr("opacity", 1);

    gMain.selectAll("circle")
      .data(monthData)
      .enter().append("circle")
      .attr("cx", d => x(d.month))
      .attr("cy", d => y(d.count))
      .attr("r", 0)
      .attr("fill", "steelblue")
      .on("mouseover", function (event, d) {
        tooltip.html(`<strong>Month:</strong> ${monthNames[d.month]}<br><strong>Cases:</strong> ${d.count}`)
          .style("top", `${event.pageY - 20}px`)
          .style("left", `${event.pageX + 10}px`)
          .style("visibility", "visible");
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"))
      .transition()
      .duration(800)
      .attr("r", 4);

    gMain.append("text")
      .attr("x", (panelWidth * 12 - margin.right) / 2)
      .attr("y", panelHeight - margin.bottom + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Month");

    gMain.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -((panelHeight - margin.bottom - margin.top) / 2))
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("Number of Crimes");
  }
}
