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
        const options = {
            "plugins": {
                "legend": config.legend,
                "title": {
                    "display": true,
                    "text": config.title
                }
            }
        };

        if ("additionalOptions" in config) {
            Object.assign(options, config.additionalOptions);
        }

        new Chart (
            config.element,
            {
                "options": options,
                "type": config.chartType,
                "data": {
                    "labels": config.labels,
                    "datasets": config.datasets
                }
            }
        );
    }
};
