/**
 * Client for displaying infectious disease data from the
 * database cache API.
 *
 * Angus Andrea Grieve-Smith, 2024
 *
 */
const population = 11996161;
const lakh = 100000;

export default class Ui {
    constructor() {
        this.output = {};
    }

    setOutput(output) {
        this.output = output;
    }

    static perLakh = function(input) {
        return (input * lakh * 10 / population).toFixed(2);
    }

    displayLatestData(data) {
        this.output.nycHospitalization.sevenDayAverage.innerText =
            data.hosp_count_7day_avg;
        this.output.nycHospitalization.sevenDayPerLakh.innerText =
            Ui.perLakh(data.hosp_count_7day_avg);

        this.output.nycCases.sevenDayAverage.innerText =
            data.all_case_count_7day_avg;
        this.output.nycCases.sevenDayPerLakh.innerText =
            Ui.perLakh(data.all_case_count_7day_avg);

        this.output.nycDeath.sevenDayAverage.innerText =
            data.death_count_7day_avg;

        const latestDate = new Date(data.date_of_interest);
        this.output.nycLatestDate.forEach((element) => {
            element.innerText = latestDate.toLocaleDateString();
        });
    }

    displayCompleteData(data) {
        this.output.nycHospitalization.sevenDayComplete.innerText =
            data.hosp_count_7day_avg;
        this.output.nycHospitalization.sevenDayCompletePerLakh.innerText =
            Ui.perLakh(data.hosp_count_7day_avg);

        this.output.nycCases.sevenDayComplete.innerText =
            data.all_case_count_7day_avg;
        this.output.nycCases.sevenDayCompletePerLakh.innerText =
            Ui.perLakh(data.all_case_count_7day_avg);
        this.output.nycDeath.sevenDayComplete.innerText =
            data.death_count_7day_avg;

        const latestCompleteDate = new Date(data.date_of_interest);
        this.output.nycCompleteDate.forEach((element) => {
            element.innerText = latestCompleteDate.toLocaleDateString();
        });

    }

    static createSourceElement(locality) {
        const element = document.createElement("p");
        const infoLink = document.createElement("a");
        infoLink.href = locality.info_url;
        infoLink.target = "_blank";
        infoLink.innerText = locality.source_name;

        const dataLink = document.createElement("a");
        dataLink.href = locality.now_url;
        dataLink.target = "_blank";
        dataLink.innerText = "data";

        element.append(
            infoLink,
            new Text(" ("),
            dataLink,
            new Text(")")
        );

        return element;
    }

    displayNycSource(locality) {
        const sourceElement = Ui.createSourceElement(locality);
        this.output.nycSource.forEach((parent) => {
            parent.append(sourceElement.cloneNode(true));
        });
    }

    displayLastMonth(lastMonth) {
        this.output.nycDeath.lastMonth.innerText = lastMonth.deaths;
        const monthText = `${lastMonth.monthName}, ${lastMonth.days} days`;

        this.output.nycLastMonth.forEach((element) => {
            element.innerText = monthText;
        });
    }

    displayThirtyDays(thirtyDays) {
        this.output.nycDeath.thirtyDays.innerText = thirtyDays.deaths;
    }
};