const FossilRecord = require("../FossilRecord");
const ChartController = require("./ChartController");

class SpeciesLifespanChart extends ChartController {
    constructor() {
        super(
            "Species Lifespans",
            "Ticks alive",
            "Each bar shows how long a species survived (in ticks). Extant species use the current tick as their end."
        );
    }

    setData() {
        this.clear();

        // Single column series
        this.data.push({
            type: "column",          // vertical bar chart
            showInLegend: false,
            dataPoints: []
        });

        const dataPoints = this.data[0].dataPoints;

        // Current time to use for extant species
        const currentTick =
            (FossilRecord.env && FossilRecord.env.total_ticks) ||
            FossilRecord.tick_record[FossilRecord.tick_record.length - 1] ||
            0;

        // Extant species (still alive): lifespan = currentTick - start_tick
        for (let s of Object.values(FossilRecord.extant_species)) {
            const start = s.start_tick || 0;
            const end = currentTick;
            const lifespan = Math.max(0, end - start);

            dataPoints.push({
                label: s.name,
                y: lifespan
            });
        }

        // Extinct species: lifespan = end_tick - start_tick
        for (let s of Object.values(FossilRecord.extinct_species)) {
            const start = s.start_tick || 0;
            const end = (typeof s.end_tick === "number") ? s.end_tick : start;
            const lifespan = Math.max(0, end - start);

            dataPoints.push({
                label: s.name,
                y: lifespan
            });
        }

        this.chart.options.data = this.data;
        this.chart.render();
    }

    // For this chart, just rebuild from current fossil data each time
    updateData() {
        this.setData();
    }
}

module.exports = SpeciesLifespanChart;
