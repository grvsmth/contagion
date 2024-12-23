// import Chart from '../node_modules/chart.js/dist/chart.umd.js'

export default class ChartManager {
    constructor() {
        this.dateFormat = Intl.DateTimeFormat(
            navigator.languages[0], {"month": "short", "day": "numeric"}
        );
    }

    formatDate(dateString) {
        const dayDate = new Date(dateString);
        return this.dateFormat.format(dayDate);
    }

    displayData(config) {
        new Chart (
            config.element,
            {
                "type": config.chartType,
                "data": {
                    "labels": config.data.map(row =>
                        this.formatDate(row.date_of_interest)
                    ),
                    "datasets": [
                        {
                            "backgroundColor": config.backgroundColor,
                            "label": config.title,
                            "data": config.data.map(row =>
                                row[config.seriesKey]
                            )
                        }
                    ]
                }
            }
        );
    }
};
