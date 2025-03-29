import { loadData } from "../loadData.js";

export async function radialBarChart() {
    const data = await loadData();
    
    data.forEach(d => d.Arrest = d.Arrest === "True");
    const typeCounts = d3.rollup(data, v => v.length, d => d["Primary Type"]);
    const arrestCounts = d3.rollup(data.filter(d => d.Arrest), v => v.length, d => d["Primary Type"]);

    const typeRates = Array.from(typeCounts, ([type, total]) => ({
        type, rate: (arrestCounts.get(type) || 0) / total * 100 
    })).sort((a, b) => b.rate - a.rate);

    const width = 600, height = 600, innerRadius = 80, outerRadius = 250;
    
    const svg = d3.select("#arrest-rate-pri-type-radial").append("svg")
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

    svg.selectAll("path")
        .data(typeRates)
        .enter()
        .append("path")
        .attr("d", d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(d => radiusScale(d.rate))
            .startAngle(d => angleScale(d.type))
            .endAngle(d => angleScale(d.type) + angleScale.bandwidth())
            .padAngle(0.02)
            .padRadius(innerRadius)
        )
        .attr("fill", "purple");

    // Add labels
    svg.selectAll(".label")
        .data(typeRates)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("text-anchor", "start")  // Align left
        .attr("transform", d => {
            const midAngle = angleScale(d.type) + angleScale.bandwidth() / 2;
            const barOuterRadius = radiusScale(d.rate);
            const labelRadius = barOuterRadius + 5;
            const posX = Math.sin(midAngle) * labelRadius;
            const posY = -Math.cos(midAngle) * labelRadius;
            const rotateAngle = (midAngle * 180 / Math.PI) - 90;
            return `translate(${posX},${posY}) rotate(${rotateAngle})`;
        })
        .style("font-size", "10px")
        .style("fill", "black")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .each(function(d) {
            const words = d.type.split(" ");
            const text = d3.select(this);

            // First word (or first two)
            text.append("tspan")
            .attr("x", 0)
            .attr("dy", "0em")
            .text(words.slice(0, 2).join(" "));

            // Remaining words on the second line
            if (words.length > 2) {
            text.append("tspan")
                .attr("x", 0)
                .attr("dy", "1em")
                .text(words.slice(2).join(" "));
            }
        });

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("visibility", "hidden");
    
    svg.selectAll("path")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", "orange");
            tooltip.style("visibility", "visible");
        })
        .on("mousemove", function (event, d) {
            const type = d.type;
            const rate = d.rate;
            tooltip.html(`Crime Type: ${type}<br>Arrest Rate: ${rate}%`)
                .style("top", `${event.pageY - 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
            d3.select(this).attr("fill", "purple");
            tooltip.style("visibility", "hidden");
        });
}