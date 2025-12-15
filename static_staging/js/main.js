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

const respDataUrl = "/api/" + apiVersion + "/resp-data/?season=2024-25";

let respData = {};
try {
    respData = await cacheClient.fetchData(respDataUrl);
} catch (error) {
    console.log("Error retrieving data from " + respDataUrl, error);
}

console.log("respData", respData);

const latestCasesData = {};
const latestCompleteCases = {};

for (const [key, data] of Object.entries(casesData)) {
    latestCasesData[key] = casesData[key][casesData[key].length - 1];
    latestCompleteCases[key] = casesData[key][
        casesData[key].length - (completeDelay + 1)
    ];
}

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

const respInfo = localityInfo.find((locality) =>
    locality.name === localityName.resp
);

let respByStatus = {
    "complete": {},
    "latest": {}
};

if (respData.length) {
    respByStatus["latest"] = respData[respData.length - 1];
}

if (respData.length > 3) {
    respByStatus["complete"] = respData[respData.length - 3];
}

const staleWeekly = compute.isStale(staleThreshold, latestCasesData.covid.date);

const staleResp = compute.isStale(
    staleThreshold, respByStatus["complete"].week_ending_date
);

const ui = new Ui();
ui.setOutput({
    "nycCovidCases": {
        "sevenDayAverage": document.querySelector("#nyc-covid-cases-week"),
        "sevenDayPerLakh": document.querySelector("#nyc-covid-cases-week-lakh"),
        "sevenDayComplete": document.querySelector("#nyc-covid-cases-week-complete"),
        "sevenDayCompletePerLakh": document
            .querySelector("#nyc-covid-cases-week-complete-lakh")
    },
    "nycFluCases": {
        "sevenDayAverage": document.querySelector("#nyc-flu-cases-week"),
        "sevenDayPerLakh": document.querySelector("#nyc-flu-cases-week-lakh"),
        "sevenDayComplete": document.querySelector("#nyc-flu-cases-week-complete"),
        "sevenDayCompletePerLakh": document
            .querySelector("#nyc-flu-cases-week-complete-lakh")
    },
    "nycRsvCases": {
        "sevenDayAverage": document.querySelector("#nyc-rsv-cases-week"),
        "sevenDayPerLakh": document.querySelector("#nyc-rsv-cases-week-lakh"),
        "sevenDayComplete": document.querySelector("#nyc-rsv-cases-week-complete"),
        "sevenDayCompletePerLakh": document
            .querySelector("#nyc-rsv-cases-week-complete-lakh")
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
    "CDC_RESP_NET": {
        "results": document.querySelector("#resp-results"),
        "summary": document.querySelector("#resp-summary"),
        "complete": {
            "date": document.querySelector("#resp-complete-date"),
            "combined": document.querySelector("#resp-complete-combined"),
            "covid": document.querySelector("#resp-complete-covid"),
            "flu": document.querySelector("#resp-complete-flu"),
            "rsv": document.querySelector("#resp-complete-rsv")
        },
        "latest": {
            "date": document.querySelector("#resp-latest-date"),
            "combined": document.querySelector("#resp-latest-combined"),
            "covid": document.querySelector("#resp-latest-covid"),
            "flu": document.querySelector("#resp-latest-flu"),
            "rsv": document.querySelector("#resp-latest-rsv")
        }
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

ui.displayWeeklyData(ui.output.nycCovidCases, latestCasesData.covid);
ui.displayWeeklyData(ui.output.nycFluCases, latestCasesData.flu);
ui.displayWeeklyData(ui.output.nycRsvCases, latestCasesData.rsv);
ui.displayWeeklyData(ui.output.nycWeeklyDeaths, latestWeeklyDeathsData);

ui.displayCompleteWeeklyData(
    ui.output.nycCovidCases, latestCompleteCases.covid
);
ui.displayCompleteWeeklyData(ui.output.nycFluCases, latestCompleteCases.flu);
ui.displayCompleteWeeklyData(ui.output.nycRsvCases, latestCompleteCases.rsv);
ui.displayCompleteWeeklyData(
    ui.output.nycWeeklyDeaths, latestCompleteWeeklyDeaths
);

for (status in respByStatus) {
    ui.displayRespData(status, respByStatus[status]);
}

ui.displayDate(ui.output.nycLatestWeek, latestCasesData.covid);
ui.displayDate(ui.output.nycCompleteWeek, latestCompleteCases.covid);

ui.displayLastMonth(deathsLastMonth);
ui.displayThirtyDays(deathsThirtyDays);


ui.displaySource(casesInfo, staleWeekly);
ui.displaySource(respInfo, staleResp);

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

chartManager.displayData({
    "element": document.querySelector("#resp-chart"),
    "labels": respData.map(row =>
        chartManager.formatDate(row.week_ending_date)
    ),
    "legend": {
        "display": true,
        "position": "right"
    },
    "title": "Hospitalizations per lakh in the United States from CDC RESP-NET",
    "datasets": [
        {
            "backgroundColor": "#E36414",
            "data": respData.map(row => row.combined_rate),
            "label": "Combined",
            "type": "line"
        },
        {
            "backgroundColor": "#FB8B24",
            "data": respData.map(row => row.covid_rate),
            "label": "COVID-19",
            "type": "line"
        },
        {
            "backgroundColor": "#9A031E",
            "data": respData.map(row => row.flu_rate),
            "label": "Influenza",
            "type": "line"
        },
        {
            "backgroundColor": "#5F0F40",
            "data": respData.map(row => row.rsv_rate),
            "label": "RSV",
            "type": "line"
        }
    ]
});