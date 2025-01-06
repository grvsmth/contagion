import { DateTime } from "/static/node_modules/luxon/build/es6/luxon.js";

import CacheClient from "./CacheClient.js";
import ChartManager from "./ChartManager.js";
import Ui from "./Ui.js";

import compute from "./compute.js";

const localityName = {
    "daily": "NYC",
    "fluRsv": "NYC_Flu_Pdf",
    "resp": "CDC_RESP_NET",
    "wastewater": "NYC_Wastewater"
};

const apiVersion = 0.1;
const wrrf = "BB";
const staleThreshold = 30;

const localityUrl = "/api/" + apiVersion + "/localities/";

const cacheClient = new CacheClient();
const localityInfo = await cacheClient.fetchData(localityUrl);

const dailyInfo = localityInfo.find((locality) =>
    locality.name === localityName.daily);
const dayDataUrl = "/api/" + apiVersion + "/day-data/?locality=" + dailyInfo.pk;

let dayData = {};
try {
    dayData = await cacheClient.fetchData(dayDataUrl);
} catch (error) {
    console.log("Error retrieving data from " + dayDataUrl, error);
}

const wastewaterInfo = localityInfo.find((locality) =>
    locality.name === localityName.wastewater);

const wastewaterUrl = "/api/" + apiVersion + "/wastewater-data/?locality="
    + wastewaterInfo.pk + "&wrrf_abbreviation=" + wrrf;
const wastewaterData = await cacheClient.fetchData(wastewaterUrl);

const wastewaterAverageUrl = "/api/" + apiVersion
    + "/wastewater-averages/?locality=" + wastewaterInfo.pk + "&wrrf=" + wrrf;
const wastewaterAverageData = await cacheClient.fetchData(wastewaterAverageUrl);

const fluSourceInfo = localityInfo.find(locality =>
    locality.name === localityName.fluRsv);
const documentUrl = "/api/" + apiVersion + "/documents";
const documentInfo = await cacheClient.fetchData(documentUrl);

const latestDocumentInfo = documentInfo[documentInfo.length -1];
const fluRsvImageUrl = "/api/" + apiVersion + "/chart-images/"
    + "?document=" + latestDocumentInfo.pk;
const fluRsvImageInfo = await cacheClient.fetchData(fluRsvImageUrl);

const fluRsvHighlightsUrl = "/api/" + apiVersion + "/highlights-text/"
    + "?document=" + latestDocumentInfo.pk;
const fluRsvHighlights = await cacheClient.fetchData(fluRsvHighlightsUrl);

const respDataUrl = "/api/" + apiVersion + "/resp-data/";

let respData = {};
try {
    respData = await cacheClient.fetchData(respDataUrl);
} catch (error) {
    console.log("Error retrieving data from " + respDataUrl, error);
}

const latestDayData = dayData[dayData.length - 1];
const latestComplete = dayData.findLast((dayInfo) => {
    return !dayInfo.incomplete;
});

const deathsLastMonth = compute.rangeTotal(
    dayData,
    "isLastMonth",
    {"timezone": dailyInfo.time_zone_name},
    "death_count"
);

const thirtyDayThis = {
    "days": 30,
    "endDateString": latestComplete.date_of_interest
};

const deathsThirtyDays = compute.rangeTotal(
    dayData, "daysFilter", thirtyDayThis, "death_count"
);

const latestWastewaterData = wastewaterData[wastewaterData.length - 1];
const latestWastewaterAverage = wastewaterAverageData[
    wastewaterAverageData.length - 1
];

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

const staleDaily = compute.isStale(
    staleThreshold, latestComplete.date_of_interest
);

const staleWastewater = compute.isStale(
    staleThreshold, latestWastewaterData.sample_date
);

const staleFlu = compute.isStale(
    staleThreshold, latestDocumentInfo.publication_date
);

const staleResp = compute.isStale(
    staleThreshold, respByStatus["complete"].week_ending_date
);

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
    "NYC_Flu_Pdf": {
        "flu_results": document.querySelector("#nyc-flu-results"),
        "flu_summary": document.querySelector("#nyc-flu-summary"),
        "ili_visits": document.querySelector("#nyc-ili-visits"),
        "pdfInfo": document.querySelectorAll(".nyc-flu-pdf"),
        "rsv_results": document.querySelector("#nyc-rsv-results")
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
    "nycLastMonth": document.querySelectorAll(".last-month"),
    "nycComplete30Begin": document.querySelector("#nyc-30days-begin"),
    "sourceElement": {
        "NYC": document.querySelectorAll(".nyc-source"),
        "NYC_Flu_Pdf": document.querySelectorAll(".nyc-flu-source"),
        "NYC_Wastewater": document.querySelectorAll(".nyc-wastewater-source"),
        "CDC_RESP_NET": document.querySelectorAll(".resp-source")
    }
});

ui.displayLatestData(latestDayData);
ui.displayCompleteData(latestComplete);
ui.displayLastMonth(deathsLastMonth);
ui.displayThirtyDays(deathsThirtyDays);

ui.displayLatestWastewaterData(latestWastewaterData);
ui.displayLatestWastewaterAverage(latestWastewaterAverage);

fluRsvImageInfo.forEach(chartInfo =>
    ui.displayChart(localityName.fluRsv, chartInfo)
);
ui.displayHighlights(localityName.fluRsv, fluRsvHighlights);
ui.displayPdfLinks(localityName.fluRsv, latestDocumentInfo);

for (status in respByStatus) {
    ui.displayRespData(status, respByStatus[status]);
}

ui.displaySource(dailyInfo, staleDaily);
ui.displaySource(wastewaterInfo, staleWastewater);
ui.displaySource(fluSourceInfo, staleFlu);
ui.displaySource(respInfo, staleResp);

/**
 * Palette via Coolors
 *
 * https://coolors.co/palette/5f0f40-9a031e-fb8b24-e36414-0f4c5c
 */
const chartManager = new ChartManager();
const dayLabels = dayData.map(row =>
    chartManager.formatDate(row.date_of_interest)
);

chartManager.displayData({
    "chartType": "line",
    "element": document.querySelector("#nyc-hosp-chart"),
    "labels": dayLabels,
    "title": "Hospitalizations per day (7-day average)",
    "datasets": [{
        "backgroundColor": "#5F0F40",
        "data": dayData.map(row => row.hosp_count_7day_avg)
    }]
});

chartManager.displayData({
    "chartType": "line",
    "element": document.querySelector("#nyc-cases-chart"),
    "labels": dayLabels,
    "title": "Cases per day (7-day average, confirmed and probable)",
    "datasets": [{
        "backgroundColor": "#9A031E",
        "data": dayData.map(row => row.all_case_count_7day_avg)
    }]
});

chartManager.displayData({
    "chartType": "bar",
    "element": document.querySelector("#nyc-deaths-chart"),
    "labels": dayLabels,
    "title": "Deaths per day",
    "datasets": [{
        "backgroundColor": "#FB8B24",
        "data": dayData.map(row => row.death_count)
    }]
});

chartManager.displayData({
    "element": document.querySelector("#nyc-wastewater-chart"),
    "labels": wastewaterAverageData.map(row =>
        chartManager.formatDate(row.end_date)
    ),
    "title": "Wastewater two-week averages",
    "datasets": [{
        "backgroundColor": "#E36414",
        "data": wastewaterAverageData.map(row => row.average),
        "type": "line"
    }]
});
