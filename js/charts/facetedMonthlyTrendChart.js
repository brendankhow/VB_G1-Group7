export function facetedMonthlyTrendChart(data) {
  const container = d3.select("#monthly-facets");
  container.html(""); // Clear previous chart

  data.forEach(d => {
    const date = new Date(d.Date);
    d.Month = date.getMonth();
    d.Year = date.getFullYear();
  });

  const grouped = d3.rollups(
    data,
    v => v.length,
    d => d.Month,
    d => d.Year
  );

  const months = d3.range(12);
  const fixedYears = d3.range(2015, 2025);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const panelWidth = 80;
  const panelHeight = 250;
  const margin = { top: 20, right: 20, bottom: 30, left: 80 };
  const width = panelWidth * 12;
  const height = panelHeight;

  const wrapper = container.append("div")
    .style("width", "100%")
    .style("overflow-x", "auto");

  const svg = wrapper.append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto");

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "12px 16px")
    .style("border", "1px solid #999")
    .style("border-radius", "6px")
    .style("font-size", "16px")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.2)");

  const yearsInData = Array.from(new Set(data.map(d => d.Year)));

  if (yearsInData.length > 1) {
    const monthSeries = months.map(month => {
      const yearMap = grouped.find(d => d[0] === month)?.[1] || [];
      const values = fixedYears.map(y => ({
        year: y,
        count: yearMap.find(([year]) => year === y)?.[1] || 0
      }));
      return { month, values };
    });

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(fixedYears)
      .range([0, panelWidth - 10]);

    const y = d3.scaleLinear()
      .domain([10000, d3.max(monthSeries, d => d3.max(d.values, v => v.count))])
      .nice()
      .range([panelHeight - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    const monthGroup = g.selectAll(".month-panel")
      .data(monthSeries)
      .enter()
      .append("g")
      .attr("class", "month-panel")
      .attr("transform", (d, i) => `translate(${i * panelWidth},0)`);

    // Y-axis
    monthGroup.append("g")
      .each(function(d, i) {
        const axis = d3.select(this);
        if (i === 0) {
          axis.call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")));
        } else {
          axis.call(d3.axisLeft(y).ticks(5).tickFormat("").tickSize(0));
          axis.selectAll("line").remove();
        }
        axis.select(".domain")
          .attr("stroke", "black")
          .attr("stroke-width", 1);
      });

    // X-axis (years)
    monthGroup.append("g")
      .attr("transform", `translate(0, ${panelHeight - margin.bottom})`)
      .each(function() {
        d3.select(this)
          .call(d3.axisBottom(x).tickValues(fixedYears))
          .selectAll("text")
          .attr("transform", "rotate(-45)")
          .style("text-anchor", "end")
          .style("font-size", "7px");
      });

    // Month labels
    monthGroup.append("text")
      .attr("x", (panelWidth - 10) / 2)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text(d => monthNames[d.month]);

    // Line with draw effect
    monthGroup.append("path")
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", d => line(d.values))
      .attr("stroke-dasharray", function(d) {
        const length = this.getTotalLength();
        return `${length} ${length}`;
      })
      .attr("stroke-dashoffset", function() {
        return this.getTotalLength();
      })
      .transition()
      .delay(fixedYears.length * 100)
      .duration(1000)
      .attr("stroke-dashoffset", 0);

    // Dots and trendlines
    monthGroup.each(function(d) {
      const g = d3.select(this);
      const values = d.values;

      const xVals = values.map(v => fixedYears.indexOf(v.year));
      const yVals = values.map(v => v.count);

      const xMean = d3.mean(xVals);
      const yMean = d3.mean(yVals);
      const slope = d3.sum(xVals.map((x, i) => (x - xMean) * (yVals[i] - yMean))) /
                    d3.sum(xVals.map(x => (x - xMean) ** 2));
      const intercept = yMean - slope * xMean;

      const trendLine = xVals.map(x => ({
        year: fixedYears[x],
        count: slope * x + intercept
      }));

      g.append("path")
        .datum(trendLine)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4 2")
        .attr("d", line)
        .attr("opacity", 0)
        .transition()
        .delay(fixedYears.length * 100 + 500)
        .duration(800)
        .attr("opacity", 1);

      g.selectAll("circle")
        .data(values)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 0)
        .attr("fill", "steelblue")
        .style("opacity", 0)
        .transition()
        .delay((_, i) => i * 100)
        .duration(300)
        .attr("r", 3)
        .style("opacity", 1)
        .on("end", function(_, i, nodes) {
          d3.select(nodes[i])
            .on("mouseover", function(event, d) {
              tooltip.html(`<strong>Year:</strong> ${d.year}<br><strong>Crimes:</strong> ${d.count.toLocaleString()}`)
                .style("visibility", "visible")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
              d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 6)
                .attr("fill", "red");
            })
            .on("mouseout", function() {
              tooltip.style("visibility", "hidden");
              d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 3)
                .attr("fill", "steelblue");
            });
        });
    });

    // Bottom axis label
    svg.append("text")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", height + margin.top + 30)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Year");

    // Left axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height + margin.top + margin.bottom) / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Number of Crimes");
  

  } else {
    // Single-year fallback (left unchanged but already responsive)
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
      .attr("transform", null)
      .style("text-anchor", "middle")
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
      .attr("r", 3)
      .attr("fill", "steelblue")
      .on("mouseover", function(event, d) {
        tooltip.html(`<strong>Month:</strong> ${monthNames[d.month]}<br><strong>Cases:</strong> ${d.count}`)
          .style("top", `${event.pageY - 20}px`)
          .style("left", `${event.pageX + 10}px`)
          .style("visibility", "visible");
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6)
          .attr("fill", "red");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 3)
          .attr("fill", "steelblue");
      });

    svg.append("text")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", height + margin.top + margin.bottom - 5) // Push it closer to the bottom
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Month");
    
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -((panelHeight - margin.bottom - margin.top) / 2))
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Number of Crimes");
  }
}
