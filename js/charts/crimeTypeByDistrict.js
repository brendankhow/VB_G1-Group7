import { loadData } from "../loadData.js";

export async function crimeTypeByDistrict() {
  const data = await loadData();

  const nested = d3.rollups(
    data,
    v => v.length,
    d => +d.District,
    d => d["Primary Type"]
  );

  const districts = Array.from(new Set(data.map(d => +d.District))).sort((a, b) => a - b);
  const crimeTypes = Array.from(new Set(data.map(d => d["Primary Type"])));

  const stackedData = districts.map(district => {
    const districtData = nested.find(d => d[0] === district);
    const crimeMap = districtData ? Object.fromEntries(districtData[1]) : {};
    const entry = { District: district };
    crimeTypes.forEach(type => {
      entry[type] = crimeMap[type] || 0;
    });
    return entry;
  });

  const series = d3.stack().keys(crimeTypes)(stackedData);

  // ⬇ Smaller chart size
  const width = 700;
  const height = 350;
  const margin = { top: 50, right: 20, bottom: 60, left: 70 };

  const svg = d3.select("#crime-type-by-district").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(districts)
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(stackedData, d => d3.sum(crimeTypes, k => d[k]))])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(crimeTypes)
    .range(d3.schemeTableau10);

  const area = d3.area()
    .x(d => x(d.data.District) + x.bandwidth() / 2)
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "6px")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("visibility", "hidden");

  g.selectAll(".layer")
    .data(series)
    .enter()
    .append("path")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .attr("d", area)
    .on("mousemove", function (event, d) {
      const [mx] = d3.pointer(event);
      const districtIndex = Math.floor(mx / x.step());
      const district = districts[districtIndex];
      const value = stackedData[districtIndex]?.[d.key] || 0;

      tooltip
        .html(`<strong>Crime Type:</strong> ${d.key}<br><strong>District:</strong> ${district}<br><strong>Crimes:</strong> ${value.toLocaleString()}`)
        .style("visibility", "visible")
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
    })
    .on("mouseout", () => tooltip.style("visibility", "hidden"));

  // Axes
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => d.toString()).tickSizeOuter(0));

  g.append("g").call(d3.axisLeft(y));

  // Axis labels
  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", height + margin.top + 50)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("District");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height + margin.top + margin.bottom) / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Number of Crimes");

  // Title
  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .text("Crime Type by District");
}
