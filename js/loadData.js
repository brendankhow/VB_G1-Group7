let cachedData = null;

export async function loadRawData() {
  if (!cachedData) {
    cachedData = await d3.csv("data/updated_crime_data_2015_2024.csv");
    cachedData.forEach(d => {
      d.Year = +d.Year;
      d.District = +d.District;
    });
  }
  return cachedData;
}

export async function loadData() {
  return await loadRawData();
}
