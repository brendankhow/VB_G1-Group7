import { loadRawData } from "../loadData.js";

export async function drawSankey() {
  const raw = await loadRawData();  // Load unfiltered full dataset

  const cleaned = raw
    .filter(d => d["Primary Type"] && d["Domestic"] && d["Arrest"])
    .map(d => ({
      primaryType: d["Primary Type"],
      domestic: d["Domestic"].toLowerCase().trim() === "true",
      arrest: d["Arrest"].toLowerCase().trim() === "true"
    }));

  const freq = d3.rollup(cleaned, v => v.length, d => d.primaryType);
  const top10 = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(d => d[0]);

  const filtered = cleaned.filter(d => top10.includes(d.primaryType));

  if (filtered.length === 0) {
    console.warn("Sankey: No data to render.");
    return;
  }

  const grouped = d3.rollups(
    filtered,
    v => v.length,
    d => d.primaryType,
    d => d.domestic ? "Domestic" : "Non-Domestic",
    d => d.arrest ? "Arrest" : "No Arrest"
  );

  const sankeyData = [];
  for (const [priType, domGroup] of grouped) {
    for (const [domestic, arrestGroup] of domGroup) {
      for (const [arrest, count] of arrestGroup) {
        sankeyData.push({
          "Primary Type": priType,
          "Domestic": domestic,
          "Arrest": arrest,
          "Count": count
        });
      }
    }
  }

  const svg = d3.select("#sankey-diagram")
    .html("")  // Clear previous content
    .attr("width", 1100)
    .attr("height", 700);

  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(15)
    .size([width, height])
    .nodeSort(null);

  const tooltip = d3.select("body").append("div").attr("class", "tooltip");

  const nodes = [], links = [];
  const nodeMap = new Map();
  let nodeId = 0;

  function getNode(name, layer, group) {
    const key = layer + "_" + name;
    if (!nodeMap.has(key)) {
      nodeMap.set(key, { name, layer, id: nodeId++, group });
    }
    return nodeMap.get(key);
  }

  sankeyData.forEach(d => {
    const primary = d["Primary Type"];
    const domestic = d["Domestic"];
    const arrest = d["Arrest"];
    const value = +d["Count"];

    const node1 = getNode(primary, 1, primary);
    const node2 = getNode(domestic, 2, primary);
    const node3 = getNode(arrest, 3, primary);

    links.push({ source: node1.id, target: node2.id, value, group: primary });
    links.push({ source: node2.id, target: node3.id, value, group: primary });
  });

  nodes.push(...nodeMap.values());

  const sankeyGraph = sankey({
    nodes: nodes.map(d => ({ ...d })),
    links: links.map(d => ({ ...d }))
  });

  svg.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(sankeyGraph.links)
    .join("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => color(d.group))
    .attr("stroke-width", d => Math.max(1, d.width))
    .attr("stroke-opacity", 0.6)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(`${d.source.name} → ${d.target.name}<br><b>Cases:</b> ${d.value}`)
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", event => tooltip
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px"))
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));

  const node = svg.append("g")
    .selectAll("g")
    .data(sankeyGraph.nodes)
    .join("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  node.append("rect")
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => color(d.group))
    .attr("stroke", "#000");

  node.append("text")
    .attr("x", -6)
    .attr("y", d => (d.y1 - d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(d => d.name)
    .filter(d => d.x0 < width / 2)
    .attr("x", 6 + sankey.nodeWidth())
    .attr("text-anchor", "start");

  node.on("mouseover", (event, d) => {
    let label = d.layer === 1
      ? `<b>${d.name}</b><br>Total: ${d.value}`
      : d.layer === 2
        ? `<b>${d.name}</b><br>Domestic Cases: ${d.value}`
        : `<b>${d.name}</b><br>Arrests: ${d.value}`;
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip.html(label)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
  }).on("mousemove", event => tooltip
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 28) + "px"))
    .on("mouseout", () => tooltip.transition().duration(300).style("opacity", 0));
}
