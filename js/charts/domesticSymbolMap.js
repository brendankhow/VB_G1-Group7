// charts/domesticSymbolMap.js
import { loadData } from "../loadData.js";

export async function domesticSymbolMap() {
  const width = 800, height = 500;
  const data = await loadData();

  data.forEach(d => {
    d.Latitude = +d.Latitude;
    d.Longitude = +d.Longitude;
    d.District = +d.District;
  });

  const domesticData = data.filter(d =>
    String(d.Domestic).toLowerCase() === "true" &&
    !isNaN(d.Latitude) &&
    !isNaN(d.Longitude) &&
    !isNaN(d.District)
  );

  const grouped = d3.rollups(
    domesticData,
    v => ({
      count: v.length,
      lat: d3.mean(v, d => d.Latitude),
      lon: d3.mean(v, d => d.Longitude)
    }),
    d => d.District
  );

  const districtPoints = grouped.map(([district, info]) => ({
    district,
    count: info.count,
    lat: info.lat,
    lon: info.lon
  }));

  const svg = d3.select("#domestic-symbol-map").append("svg")
    .attr("width", width)
    .attr("height", height);

  const container = svg.append("g");

  svg.call(d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      container.attr("transform", event.transform);
    }));

  const centerLon = d3.mean(districtPoints, d => d.lon);
  const centerLat = d3.mean(districtPoints, d => d.lat);

  const projection = d3.geoMercator()
    .center([centerLon, centerLat])
    .scale(30000)
    .translate([width / 2, height / 2]);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px")
    .style("border-radius", "5px")
    .style("border", "1px solid #ccc")
    .style("visibility", "hidden");

  const sizeScale = d3.scaleSqrt()
    .domain([0, d3.max(districtPoints, d => d.count)])
    .range([4, 25]);

  container.selectAll("circle")
    .data(districtPoints)
    .enter().append("circle")
    .attr("cx", d => projection([d.lon, d.lat])[0])
    .attr("cy", d => projection([d.lon, d.lat])[1])
    .attr("r", d => sizeScale(d.count))
    .attr("fill", "steelblue")
    .attr("opacity", 0.75)
    .attr("stroke", "black")
    .on("mouseover", function (event, d) {
      tooltip.html(`District: ${d.district}<br>Domestic Cases: ${d.count}`)
        .style("top", `${event.pageY - 15}px`)
        .style("left", `${event.pageX + 10}px`)
        .style("visibility", "visible");
      d3.select(this).attr("opacity", 1);
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
      d3.select(this).attr("opacity", 0.75);
    });

  container.selectAll("text")
    .data(districtPoints)
    .enter().append("text")
    .attr("x", d => projection([d.lon, d.lat])[0])
    .attr("y", d => projection([d.lon, d.lat])[1] + 4)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "10px")
    .attr("font-weight", "bold")
    .text(d => d.district);
}
