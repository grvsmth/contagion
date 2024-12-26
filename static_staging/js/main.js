import CacheClient from "./CacheClient.js";
import ChartManager from "./ChartManager.js";
import Ui from "./Ui.js";

import compute from "./compute.js";

const localityName = {
    "daily": "NYC",
    "wastewater": "NYC_Wastewater"
};
const wrrf = "BB";

const localityUrl = "/api/0.1/localities/";

const cacheClient = new CacheClient();
const localityInfo = await cacheClient.fetchData(localityUrl);

const dailyInfo = localityInfo.find((locality) =>
    locality.name === localityName.daily);
const dayDataUrl = "/api/0.1/day-data/?locality=" + dailyInfo.pk;
const dayData = await cacheClient.fetchData(dayDataUrl);

const wastewaterInfo = localityInfo.find((locality) =>
    locality.name === localityName.wastewater);

const wastewaterUrl = "/api/0.1/wastewater-data/?locality="
    + wastewaterInfo.pk + "&wrrf_abbreviation=" + wrrf;
const wastewaterData = await cacheClient.fetchData(wastewaterUrl);
console.log("wastewaterData", wastewaterData);

const wastewaterAverageUrl = "/api/0.1/wastewater-averages/?locality="
    + wastewaterInfo.pk + "&wrrf=" + wrrf;
const wastewaterAverageData = await cacheClient.fetchData(wastewaterAverageUrl);
console.log("wastewaterAverageData", wastewaterAverageData);


const latestDayData = dayData[dayData.length - 1];
const latestComplete = dayData.findLast((dayInfo) => {
    return !dayInfo.incomplete;
});

const today = new Date();
const monthThis = {"month": today.getMonth() - 1};
const deathsLastMonth = compute.rangeTotal(
    dayData, "isMonth", monthThis, "death_count"
);

const endDate = new Date(latestComplete.date_of_interest);
const complete30Begin = new Date(latestComplete.date_of_interest);
complete30Begin.setDate(complete30Begin.getDate() - 29);

const thirtyDayThis = {"beginDate": complete30Begin, "endDate": endDate};
const deathsThirtyDays = compute.rangeTotal(
    dayData, "dateRangeFilter", thirtyDayThis, "death_count"
);

const latestWastewaterData = wastewaterData[wastewaterData.length - 1];
const latestWastewaterAverage = wastewaterAverageData[
    wastewaterAverageData.length - 1
];


const ui = new Ui();
ui.setOutput({
    "nycHospitalization": {
        "sevenDayAverage": document.querySelector("#nyc-hosp-7day"),
        "sevenDayPerLakh": document.querySelector("#nyc-hosp-7day-lakh"),
        "sevenDayComplete": document.querySelector("#nyc-hosp-7day-complete"),
        "sevenDayCompletePerLakh": document
            .querySelector("#nyc-hosp-7day-complete-lakh")
    },
    "nycCases": {
        "sevenDayAverage": document.querySelector("#nyc-cases-7day"),
        "sevenDayPerLakh": document.querySelector("#nyc-cases-7day-lakh"),
        "sevenDayComplete": document.querySelector("#nyc-cases-7day-complete"),
        "sevenDayCompletePerLakh": document
            .querySelector("#nyc-cases-7day-complete-lakh")
    },
    "nycDeath": {
        "sevenDayAverage": document.querySelector("#nyc-death-7day"),
        "sevenDayComplete": document.querySelector("#nyc-death-7day-complete"),
        "lastMonth": document.querySelector("#nyc-death-last-month"),
        "thirtyDays": document.querySelector("#nyc-death-30days")
    },
    "nycWastewater": {
        "latestDate": document.querySelector("#nyc-wastewater-latest-date"),
        "latestCount": document.querySelector("#nyc-wastewater-latest-count"),
        "latestAverage": document.querySelector("#nyc-wastewater-7day"),
        "wrrf": document.querySelector("#nyc-wrrf")
    },
    "nycLatestDate": document.querySelectorAll(".nyc-latest-date"),
    "nycCompleteDate": document.querySelectorAll(".nyc-complete-date"),
    "nycLastMonth": document.querySelectorAll(".last-month"),
    "nycComplete30Begin": document.querySelector("#nyc-30days-begin"),
    "sourceElement": {
        "NYC": document.querySelectorAll(".nyc-source"),
        "NYC_Wastewater": document.querySelectorAll(".nyc-wastewater-source")
    }
});

ui.displayLatestData(latestDayData);
ui.displayCompleteData(latestComplete);
ui.displayLastMonth(deathsLastMonth);
ui.displayThirtyDays(deathsThirtyDays, complete30Begin);

ui.displayLatestWastewaterData(latestWastewaterData);
ui.displayLatestWastewaterAverage(latestWastewaterAverage);

ui.displaySource(dailyInfo);
ui.displaySource(wastewaterInfo);
// TODO display wastewater source

/**
 * Palette via Coolors
 *
 * https://coolors.co/palette/780000-c1121f-fdf0d5-003049-669bbc
 */
const chartManager = new ChartManager();
chartManager.displayData({
    "element": document.querySelector("#nyc-hosp-chart"),
    "title": "Hospitalizations per day (7-day average)",
    "seriesKey": "hosp_count_7day_avg",
    "chartType": "line",
    "backgroundColor": "#C1121F",
    "data": dayData
});

chartManager.displayData({
    "element": document.querySelector("#nyc-cases-chart"),
    "title": "Cases per day (7-day average, confirmed and probable)",
    "seriesKey": "all_case_count_7day_avg",
    "chartType": "line",
    "backgroundColor": "#003049",
    "data": dayData
});

chartManager.displayData({
    "element": document.querySelector("#nyc-deaths-chart"),
    "title": "Deaths per day",
    "seriesKey": "death_count",
    "chartType": "bar",
    "backgroundColor": "#780000",
    "data": dayData
});
