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
                "options": {
                    "plugins": {
                        "legend": {
                            "display": false
                        },
                        "title": {
                            "display": true,
                            "text": config.title
                        }
                    }
                },
                "type": config.chartType,
                "data": {
                    "labels": config.labels,
                    "datasets": config.datasets
                }
            }
        );
    }
};
