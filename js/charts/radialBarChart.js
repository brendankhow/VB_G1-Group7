import { loadData } from "../loadData.js";

export async function radialBarChart() {
  try {
    const data = await loadData();
    
    if (!data || data.length === 0) {
      console.warn("⚠️ No data found!");
      return;
    }

    // 🧠 Normalize Arrest values: convert to boolean safely
    data.forEach(d => {
      d.Arrest = d.Arrest?.toString().toLowerCase() === "true";
    });

    const typeCounts = d3.rollup(data, v => v.length, d => d["Primary Type"]);
    const arrestCounts = d3.rollup(
      data.filter(d => d.Arrest),
      v => v.length,
      d => d["Primary Type"]
    );

    const typeRates = Array.from(typeCounts, ([type, total]) => ({
      type,
      rate: (arrestCounts.get(type) || 0) / total * 100
    })).sort((a, b) => b.rate - a.rate);

    console.log("✅ Arrest rates by crime type:");
    typeRates.forEach(d => console.log(`${d.type}: ${d.rate.toFixed(2)}%`));

    if (typeRates.every(d => d.rate === 0)) {
      console.warn("🚫 All arrest rates are 0%. Check 'Arrest' field in your dataset.");
    }

    const width = 600, height = 600;
    const innerRadius = 80, outerRadius = 250;

    const svg = d3.select("#arrest-rate-pri-type-radial")
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const angleScale = d3.scaleBand()
      .domain(typeRates.map(d => d.type))
      .range([0, 2 * Math.PI])
      .padding(0.05);

    const radiusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerRadius, outerRadius]);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(d => {
        const scaled = radiusScale(d.rate);
        return Math.max(scaled, innerRadius + 5); // Ensure visible arc
      })
      .startAngle(d => angleScale(d.type))
      .endAngle(d => angleScale(d.type) + angleScale.bandwidth())
      .padAngle(0.02)
      .padRadius(innerRadius);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "lightgray")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("visibility", "hidden");

    const defaultColor = "purple";
    const hoverColor = "orange";

    // Draw arcs
    svg.selectAll("path")
      .data(typeRates)
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", defaultColor)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", hoverColor);
        tooltip.style("visibility", "visible");
      })
      .on("mousemove", function (event, d) {
        tooltip.html(`
          <strong>Crime Type:</strong> ${d.type}<br>
          <strong>Arrest Rate:</strong> ${d.rate.toFixed(2)}%
        `)
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", defaultColor);
        tooltip.style("visibility", "hidden");
      });

    // Labels
    svg.selectAll(".label")
      .data(typeRates)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("text-anchor", "start")
      .attr("transform", d => {
        const midAngle = angleScale(d.type) + angleScale.bandwidth() / 2;
        const radius = radiusScale(d.rate) + 10;
        const x = Math.sin(midAngle) * radius;
        const y = -Math.cos(midAngle) * radius;
        const rotate = (midAngle * 180 / Math.PI) - 90;
        return `translate(${x},${y}) rotate(${rotate})`;
      })
      .style("font-size", "10px")
      .style("fill", "black")
      .style("font-weight", "bold")
      .style("pointer-events", "none")
      .each(function (d) {
        const text = d3.select(this);
        const words = d.type.split(" ");
        text.append("tspan")
          .attr("x", 0)
          .attr("dy", "0em")
          .text(words.slice(0, 2).join(" "));
        if (words.length > 2) {
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", "1em")
            .text(words.slice(2).join(" "));
        }
      });

  } catch (err) {
    console.error("❌ Error in radialBarChart():", err);
  }
}
