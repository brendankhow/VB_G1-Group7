import { crimeTypes } from "./charts/crimeTypes.js";
//import { monthlyCyclePlot } from "./charts/monthlyCyclePlot.js";
import { drawHourlyFrequency } from "./charts/hourlyFrequency.js";
// import { crimeTypeByDistrict } from "./charts/crimeTypeByDistrict.js";
// import { radialBarChart } from "./charts/radialBarChart.js";
// import { districtSymbolMap } from "./charts/districtSymbolMap.js";
// import { arrestRateByDistrict } from "./charts/arrestRateByDistrict.js";
// import { drawSankey } from "./charts/drawSankey.js";
// import { arrestsVsDomesticCases } from "./charts/arrestsVsDomesticCases.js";
// import { arrestsVsNonDomesticCases } from "./charts/arrestsVsNonDomesticCases.js";
import { loadData } from "./loadData.js"; // You already have this
import { facetedMonthlyTrendChart } from "./charts/facetedMonthlyTrendChart.js"; // assume this is ready

let globalData = [];

export async function refreshCharts(selectedYear = "all") {
  document.getElementById("loading-spinner").style.display = "block";

  // Load once
  if (globalData.length === 0) {
    globalData = await loadData();
    globalData.forEach(d => {
      d.Date = new Date(d.Date);
      d.Month = d.Date.getMonth();
      d.Year = +d.Year;
    });
  
    const years = Array.from(new Set(globalData.map(d => d.Year))).sort();
  
    console.log("🚀 Populating dropdown with years");
    console.log("Years found:", years);
  
    const dropdown = d3.select("#year-select");
    dropdown.append("option").attr("value", "all").text("All Years");
  
    dropdown.selectAll("option.year-option")
      .data(years)
      .enter()
      .append("option")
      .attr("class", "year-option")
      .attr("value", d => d)
      .text(d => d);
  
    dropdown.on("change", function () {
      const selected = this.value;
      refreshCharts(selected);
    });

    // 🔽 Crime type filter dropdown listener
    // ✅ Only re-render crimeTypes chart when dropdown changes
    const crimeTypeSelect = document.getElementById("crime-type-select");
    if (crimeTypeSelect) {
      crimeTypeSelect.addEventListener("change", () => {
        const selectedYear = document.getElementById("year-select").value;
        const filteredData = selectedYear === "all"
          ? globalData
          : globalData.filter(d => d.Year === +selectedYear);

        const limit = parseInt(crimeTypeSelect.value);
        crimeTypes(filteredData, limit); // ✅ Only update this chart
      });
    }
  }

  const filteredData = selectedYear === "all"
    ? globalData
    : globalData.filter(d => d.Year === +selectedYear);

  const chartDivs = [
    "#crime-types", "#monthly-facets", "#hourly-frequency"
  ];
  chartDivs.forEach(id => d3.select(id).html(""));

  // 🔽 Read limit from dropdown
  const limit = parseInt(document.getElementById("crime-type-select")?.value || "10");

  // Pass filteredData only to charts on Overview
  await Promise.all([
    crimeTypes(filteredData, limit),
    facetedMonthlyTrendChart(filteredData),
    drawHourlyFrequency(filteredData),
  ]);

  // Load the rest (not filtered by year)
  // await Promise.all([
  //   monthlyCyclePlot(),
  //   crimeTypeByDistrict(),
  //   radialBarChart(),
  //   districtSymbolMap(),
  //   arrestRateByDistrict(),
  //   drawSankey(),
  //   arrestsVsDomesticCases(),
  //   arrestsVsNonDomesticCases(),
  // ]);

  document.getElementById("loading-spinner").style.display = "none";
}

// Called at start
refreshCharts();

function showDashboard(tab) {
  document.querySelectorAll('.dashboard-container').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
  document.getElementById('dashboard-' + tab).classList.add('active');
  document.querySelector(`.tab-button[onclick*="${tab}"]`).classList.add('active');

  // Hide year filter for non-overview tabs
  const filter = document.getElementById("year-filter-container");
  if (filter) {
    filter.style.display = (tab === "overview") ? "block" : "none";
  }
}

window.showDashboard = showDashboard;
