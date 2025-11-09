const FossilRecord = require("../FossilRecord");
const ChartController = require("./ChartController");

class CellsChart extends ChartController {
    constructor() {
        super(
            "Species Populations",
            "Population",
            "Shows the population of each species over time."
        );
        this.speciesNames = [];
    }

    setData() {
        this.clear();

        const spHist = FossilRecord.species_pop_counts;

        // If we don't have species data yet, do nothing (empty chart until data appears)
        if (!spHist || spHist.length === 0) {
            this.addAllDataPoints();
            return;
        }

        // Collect all species that ever appeared
        const nameSet = {};
        for (let snap of spHist) {
            for (let name in snap) {
                nameSet[name] = true;
            }
        }

        this.speciesNames = Object.keys(nameSet);

        if (this.speciesNames.length === 0) {
            this.addAllDataPoints();
            return;
        }

        // Optional: limit to first 4 species to keep it readable
        this.speciesNames = this.speciesNames.slice(0, 4);

        // One line per species (same pattern as original CellsChart)
        for (let name of this.speciesNames) {
            this.data.push({
                type: "line",
                markerType: "none",
                showInLegend: true,
                legendText: name,
                dataPoints: []
            });
        }

        this.addAllDataPoints();
    }

    addDataPoint(i) {
        const t = FossilRecord.tick_record[i];
        const spHist = FossilRecord.species_pop_counts || [];
        const snapshot = spHist[i] || {};

        // If no species configured, nothing to do
        if (!this.speciesNames || this.speciesNames.length === 0) {
            return;
        }

        // For each species, only add a point if it exists at this tick.
        // This way: line starts when species appears and ends when extinct.
        this.speciesNames.forEach((name, seriesIndex) => {
            if (Object.prototype.hasOwnProperty.call(snapshot, name)) {
                const y = snapshot[name];
                this.data[seriesIndex].dataPoints.push({ x: t, y: y });
            }
        });
    }
}

module.exports = CellsChart;
