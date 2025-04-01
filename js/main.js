// main.js
import { crimeTypes } from "./charts/crimeTypes.js";
import { monthlyCyclePlot } from "./charts/monthlyCyclePlot.js";
import { drawHourlyFrequency } from "./charts/hourlyFrequency.js";
import { monthlyHeatmap } from "./charts/monthlyHeatmap.js";
import { crimeTypeByDistrict } from "./charts/crimeTypeByDistrict.js";
import { radialBarChart } from "./charts/radialBarChart.js";
import { districtSymbolMap } from "./charts/districtSymbolMap.js";
import { arrestRateByDistrict } from "./charts/arrestRateByDistrict.js";
import { drawSankey } from "./charts/drawSankey.js";
import { arrestsVsDomesticCases } from "./charts/arrestsVsDomesticCases.js";
import { arrestsVsNonDomesticCases } from "./charts/arrestsVsNonDomesticCases.js";


export async function refreshCharts() {
  document.getElementById("loading-spinner").style.display = "block";

  const chartDivs = [
    "#crime-types", "#monthly-facets", "#hourly-frequency", "#monthly-heatmap", "#crime-type-by-district", 
    "#arrest-rate-pri-type-radial", "#district-symbol-map", "#arrest-rate", "#sankey-diagram", "#arrests-vs-domestic",
    "#arrests-vs-non-domestic"
  ];

  chartDivs.forEach(id => d3.select(id).html(""));

  await Promise.all([
    crimeTypes(),
    monthlyCyclePlot(),
    drawHourlyFrequency(),
    monthlyHeatmap(),
    crimeTypeByDistrict(),
    radialBarChart(),
    districtSymbolMap(),
    arrestRateByDistrict(),
    drawSankey(),
    arrestsVsDomesticCases(),
    arrestsVsNonDomesticCases(),
  ]);

  document.getElementById("loading-spinner").style.display = "none";
}

function showDashboard(tab) {
  document.querySelectorAll('.dashboard-container').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
  document.getElementById('dashboard-' + tab).classList.add('active');
  document.querySelector(`.tab-button[onclick*="${tab}"]`).classList.add('active');
}

window.showDashboard = showDashboard;

refreshCharts();
