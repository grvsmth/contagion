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

    static createSourceElement(locality, isStale) {
        const element = document.createElement("p");
        const infoLink = document.createElement("a");
        infoLink.href = locality.info_url;
        infoLink.target = "_blank";
        infoLink.innerText = locality.source_name;

        const dataLink = document.createElement("a");
        dataLink.href = locality.now_url;
        dataLink.target = "_blank";

        if (isStale) {
            dataLink.innerText = "stale data";
        } else {
            dataLink.innerText = "data";
        }

        element.append(
            infoLink,
            new Text(" ("),
            dataLink,
            new Text(")")
        );

        return element;
    }

    displaySource(locality, isStale=false) {
        const sourceElement = Ui.createSourceElement(locality, isStale);
        this.output.sourceElement[locality.name].forEach((parent) => {
            parent.append(sourceElement.cloneNode(true));

            if (isStale) {
                parent.classList.add("bg-warning");
            }
        });
    }

    displayChart(localityName, chartInfo) {
        const imageUrl = "/media" + chartInfo.path;
        const link = document.createElement("a");
        link.target = "_blank";
        link.href = imageUrl;

        const img = document.createElement("img");
        img.src = imageUrl;
        img.classList.add("img-fluid");

        link.append(img);
        this.output[localityName][chartInfo.chart_type].append(
            link
        );
    }

    displayLastMonth(lastMonth) {
        this.output.nycDeath.lastMonth.innerText = lastMonth.deaths;
        const monthText = `${lastMonth.monthName}, ${lastMonth.days} days`;

        this.output.nycLastMonth.forEach((element) => {
            element.innerText = monthText;
        });
    }

    displayThirtyDays(thirtyDays, beginDate) {
        this.output.nycDeath.thirtyDays.innerText = thirtyDays.deaths;
        this.output.nycComplete30Begin.innerText = beginDate
            .toLocaleDateString();
    }

    displayLatestWastewaterData(wastewaterData) {
        const latestDate = new Date(wastewaterData.sample_date)
            .toLocaleDateString();

        this.output.nycWastewater.wrrf.innerText = wastewaterData.wrrf_name;
        this.output.nycWastewater.latestDate.innerText = latestDate;
        this.output.nycWastewater.latestCount.innerText = wastewaterData
            .copies_l;
    }

    displayLatestWastewaterAverage(wastewaterAverage) {
        this.output.nycWastewater.latestAverage.innerText = wastewaterAverage
            .average;
    }
};