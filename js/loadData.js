let cachedData = null;

export async function loadRawData() {
  if (!cachedData) {
    const fileNames = Array.from({ length: 26 }, (_, i) =>
      `data/crime_data_part${i + 1}.csv?v=${Date.now()}`
    );
    
    console.log("Attempting to load files:", fileNames);

    try {
      const allData = await Promise.all(
        fileNames.map(async file => {
          try {
            const data = await d3.csv(file);
            console.log(`✅ Loaded ${file} (${data.length} rows)`);
            return data;
          } catch (err) {
            console.error(`❌ Failed to load ${file}:`, err);
            return []; // fallback to empty array
          }
        })
      );

      cachedData = allData.flat();
      cachedData.forEach(d => {
        d.Year = +d.Year;
        d.District = +d.District;
        // add more parsing as needed
      });

      console.log(`✅ All files loaded. Total rows: ${cachedData.length}`);

    } catch (error) {
      console.error("Unexpected error during file loading:", error);
      cachedData = [];
    }
  }

  return cachedData;
}

export async function loadData() {
  return await loadRawData();
}
