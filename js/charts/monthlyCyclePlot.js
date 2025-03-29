import { loadData } from "../loadData.js";

export async function monthlyCyclePlot() {
  const data = await loadData();

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
  const years = Array.from(new Set(data.map(d => d.Year))).sort();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthSeries = months.map(month => {
    const yearMap = grouped.find(d => d[0] === month)?.[1] || [];
    const values = years.map(y => ({
      year: y,
      count: yearMap.find(([year]) => year === y)?.[1] || 0
    }));
    return { month, values };
  });

  const panelWidth = 80;
  const panelHeight = 350;
  const margin = { top: 20, right: 20, bottom: 30, left: 80 };
  const width = panelWidth * 12;
  const height = panelHeight;

  const svg = d3.select("#monthly-facets")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scalePoint().domain(years).range([0, panelWidth - 10]);
  const y = d3.scaleLinear()
    .domain([10000, d3.max(monthSeries, d => d3.max(d.values, v => v.count))])
    .nice()
    .range([panelHeight - margin.bottom, margin.top]);

  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.count))
    .curve(d3.curveMonotoneX);

  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("font-size", "12px");

  const monthGroup = g.selectAll(".month-panel")
    .data(monthSeries)
    .enter()
    .append("g")
    .attr("class", "month-panel")
    .attr("transform", (d, i) => `translate(${i * panelWidth},0)`);

    monthGroup.append("g")
    .each(function(d, i) {
      const axis = d3.select(this);
      if (i === 0) {
        axis.call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(",")));
      } else {
        axis.call(d3.axisLeft(y).ticks(5).tickFormat("").tickSize(0));
        axis.selectAll("line").remove(); // Remove minor grid lines
      }
      axis.select(".domain")
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    });
  

  monthGroup.append("text")
    .attr("x", (panelWidth - 10) / 2)
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text(d => monthNames[d.month]);

  monthGroup.append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", d => line(d.values));

  // Add trend line for each month
  monthGroup.each(function(d) {
    const g = d3.select(this);
    const values = d.values;

    const xVals = values.map(v => years.indexOf(v.year));
    const yVals = values.map(v => v.count);
    const n = xVals.length;

    const xMean = d3.mean(xVals);
    const yMean = d3.mean(yVals);
    const slope = d3.sum(xVals.map((x, i) => (x - xMean) * (yVals[i] - yMean))) /
                  d3.sum(xVals.map(x => (x - xMean) ** 2));
    const intercept = yMean - slope * xMean;

    const trendLine = xVals.map(x => ({
      year: years[x],
      count: slope * x + intercept
    }));

    g.append("path")
      .datum(trendLine)
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4 2")
      .attr("d", line);

    // Add circles with tooltip
    g.selectAll("circle")
      .data(values)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.count))
      .attr("r", 3)
      .attr("fill", "steelblue")
      .on("mouseover", function(event, d) {
        tooltip.html(`<strong>Year:</strong> ${d.year}<br><strong>Crimes:</strong> ${d.count.toLocaleString()}`)
          .style("visibility", "visible")
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
        d3.select(this).attr("fill", "orange");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
        d3.select(this).attr("fill", "steelblue");
      });
  });

  // Axis labels
  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", height + margin.top + 30)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Year");

    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height + margin.top + margin.bottom) / 2)
    .attr("y", 15) // Move left
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Number of Crimes");
  
}