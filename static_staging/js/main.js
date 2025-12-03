import { DateTime } from "/static/node_modules/luxon/build/es6/luxon.js";

import CacheClient from "./CacheClient.js";
import ChartManager from "./ChartManager.js";
import Ui from "./Ui.js";

import compute from "./compute.js";

const localityName = {
    "daily": "NYC",
    "resp": "CDC_RESP_NET",
    "wastewater": "NYC_Wastewater",
    "cases": "NYC_Cases",
    "deaths": "NYC_Deaths"
};

const apiVersion = 0.1;
const staleThreshold = 30;
const completeDelay = 2;

const localityUrl = "/api/" + apiVersion + "/localities/";

const cacheClient = new CacheClient();
const localityInfo = await cacheClient.fetchData(localityUrl);

const casesInfo = localityInfo.find((locality) =>
    locality.name === localityName.cases);

const casesDataUrl = {
    "covid": cacheClient.buildUrl(apiVersion, casesInfo.pk, "COVID-19 cases"),
    "flu": cacheClient.buildUrl(apiVersion, casesInfo.pk, "Influenza cases"),
    "rsv": cacheClient.buildUrl(apiVersion, casesInfo.pk, "RSV cases"),
};

const deathsInfo = localityInfo.find((locality) =>
    locality.name === localityName.deaths);
const weeklyDeathsDataUrl = cacheClient.buildUrl(
    apiVersion, deathsInfo.pk, "COVID-19 deaths"
);

const casesData = {};

for (const [key, dataUrl] of Object.entries(casesDataUrl)) {
    let res = {};

    try {
        casesData[key] = await cacheClient.fetchData(dataUrl);
    } catch (error) {
        console.log("Error retrieving data from " + dataUrl, error);
    }
};

let weeklyDeathsData = {};
try {
    weeklyDeathsData = await cacheClient.fetchData(weeklyDeathsDataUrl);
} catch (error) {
    console.log("Error retrieving data from " + weeklyDeathsDataUrl, error);
}

const latestCovidCasesData = casesData.covid[casesData.covid.length - 1];
const latestCompleteCovidCases = casesData.covid[
    casesData.covid.length - (completeDelay + 1)
];

const latestWeeklyDeathsData = weeklyDeathsData[weeklyDeathsData.length - 1];
const latestCompleteWeeklyDeaths = weeklyDeathsData[
    weeklyDeathsData.length - (completeDelay + 1)
];

const deathsLastMonth = compute.rangeTotal(
    weeklyDeathsData,
    "isLastMonth",
    {"timezone": casesInfo.time_zone_name},
    "value"
);

const thirtyDayThis = {
    "days": 30,
    "endDateString": latestCompleteWeeklyDeaths.date
};

const deathsThirtyDays = compute.rangeTotal(
    weeklyDeathsData, "daysFilter", thirtyDayThis, "value"
);

const staleWeekly = compute.isStale(staleThreshold, latestCovidCasesData.date);

const ui = new Ui();
ui.setOutput({
    "nycCovidCases": {
        "sevenDayAverage": document.querySelector("#nyc-covid-cases-week"),
        "sevenDayPerLakh": document.querySelector("#nyc-covid-cases-week-lakh"),
        "sevenDayComplete": document.querySelector("#nyc-covid-cases-week-complete"),
        "sevenDayCompletePerLakh": document
            .querySelector("#nyc-covid-cases-week-complete-lakh")
    },
    "nycWeeklyDeaths": {
        "sevenDayAverage": document.querySelector("#nyc-deaths-week"),
        "sevenDayPerLakh": document.querySelector("#nyc-deaths-week-lakh"),
        "sevenDayComplete": document.querySelector("#nyc-deaths-week-complete"),
        "sevenDayCompletePerLakh": document
            .querySelector("#nyc-deaths-week-complete-lakh"),
        "lastMonth": document.querySelector("#nyc-deaths-last-month"),
        "thirtyDays": document.querySelector("#nyc-deaths-30days")
    },
    "nycLatestDate": document.querySelectorAll(".nyc-latest-date"),
    "nycCompleteDate": document.querySelectorAll(".nyc-complete-date"),
    "nycLatestWeek": document.querySelectorAll(".nyc-latest-week"),
    "nycCompleteWeek": document.querySelectorAll(".nyc-complete-week"),
    "nycLastMonth": document.querySelectorAll(".last-month"),
    "nycComplete30Begin": document.querySelector("#nyc-30days-begin"),
    "sourceElement": {
        "NYC": document.querySelectorAll(".nyc-source"),
        "NYC_Cases": document.querySelectorAll(".nyc-week-source"),
        "NYC_Deaths": document.querySelectorAll(".nyc-week-source"),
        "NYC_Flu_Pdf": document.querySelectorAll(".nyc-flu-source"),
        "NYC_Wastewater": document.querySelectorAll(".nyc-wastewater-source"),
        "CDC_RESP_NET": document.querySelectorAll(".resp-source")
    }
});

ui.displayWeeklyData(latestCovidCasesData, latestWeeklyDeathsData);
ui.displayCompleteWeeklyData(
    latestCompleteCovidCases, latestCompleteWeeklyDeaths
);
ui.displayLastMonth(deathsLastMonth);
ui.displayThirtyDays(deathsThirtyDays);


ui.displaySource(casesInfo, staleWeekly);

/**
 * Palette via Coolors
 *
 * https://coolors.co/palette/5f0f40-9a031e-fb8b24-e36414-0f4c5c
 */
const chartManager = new ChartManager();

const weekLabels = casesData.covid.map(
    row => chartManager.formatDate(row.date)
);

chartManager.displayData({
    "chartType": "line",
    "element": document.querySelector("#nyc-covid-cases-chart"),
    "labels": weekLabels,
    "legend": {
        "display": false
    },
    "title": "Cases per day (7-day average, confirmed and probable)",
    "datasets": [{
        "backgroundColor": "#E36414",
        "data": casesData.covid.map(row => Math.round(row.value / 7))
    }]
});

chartManager.displayData({
    "chartType": "line",
    "element": document.querySelector("#nyc-flu-cases-chart"),
    "labels": weekLabels,
    "legend": {
        "display": false
    },
    "title": "Cases per day (7-day average, confirmed and probable)",
    "datasets": [{
        "backgroundColor": "#9A031E",
        "data": casesData.flu.map(row => Math.round(row.value / 7))
    }]
});

chartManager.displayData({
    "chartType": "line",
    "element": document.querySelector("#nyc-rsv-cases-chart"),
    "labels": weekLabels,
    "legend": {
        "display": false
    },
    "title": "Cases per day (7-day average, confirmed and probable)",
    "datasets": [{
        "backgroundColor": "#5F0F40",
        "data": casesData.rsv.map(row => Math.round(row.value / 7))
    }]
});

chartManager.displayData({
    "chartType": "line",
    "element": document.querySelector("#nyc-week-deaths-chart"),
    "labels": weekLabels,
    "legend": {
        "display": false
    },
    "title": "Deaths per week",
    "datasets": [{
        "backgroundColor": "#FB8B24",
        "data": weeklyDeathsData.map(row => row.value)
    }]
});
