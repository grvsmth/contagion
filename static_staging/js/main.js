import { DateTime } from "/static/node_modules/luxon/build/es6/luxon.js";

import CacheClient from "./CacheClient.js";
import ChartManager from "./ChartManager.js";
import Ui from "./Ui.js";

import compute from "./compute.js";

const localityName = {
    "daily": "NYC",
    "resp": "CDC_RESP_NET",
    "wastewater": "NYC_Wastewater",
    "cases": "NYC_Cases"
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

const casesInfo = localityInfo.find((locality) =>
    locality.name === localityName.cases);
const weekDataUrl = "/api/" + apiVersion + "/week-data/";

let dayData = {};
try {
    dayData = await cacheClient.fetchData(dayDataUrl);
} catch (error) {
    console.log("Error retrieving data from " + dayDataUrl, error);
}

let weekData = {};
try {
    weekData = await cacheClient.fetchData(weekDataUrl);
    console.log("weekData", weekData);
} catch (error) {
    console.log("Error retrieving data from " + weekDataUrl, error);
}

const wastewaterInfo = localityInfo.find((locality) =>
    locality.name === localityName.wastewater);

const wastewaterUrl = "/api/" + apiVersion + "/wastewater-data/?locality="
    + wastewaterInfo.pk + "&wrrf_abbreviation=" + wrrf;
const wastewaterData = await cacheClient.fetchData(wastewaterUrl);

const wastewaterAverageUrl = "/api/" + apiVersion
    + "/wastewater-averages/?locality=" + wastewaterInfo.pk + "&wrrf=" + wrrf;
const wastewaterAverageData = await cacheClient.fetchData(wastewaterAverageUrl);

const respDataUrl = "/api/" + apiVersion + "/resp-data/?season=2024-25";

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

const latestWeekData = weekData[weekData.length - 1];
const latestCompleteWeek = weekData.findLast((weekInfo) => {
    return !weekInfo.incomplete;
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

const staleWeekly = compute.isStale(staleThreshold, latestWeekData.date);

const staleWastewater = compute.isStale(
    staleThreshold, latestWastewaterData.sample_date
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
    "nycWeeklyCases": {
        "sevenDayAverage": document.querySelector("#nyc-cases-week"),
        "sevenDayPerLakh": document.querySelector("#nyc-cases-week-lakh"),
        "sevenDayComplete": document.querySelector("#nyc-cases-week-complete"),
        "sevenDayCompletePerLakh": document
            .querySelector("#nyc-cases-week-complete-lakh")
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
        "NYC_Cases": document.querySelectorAll(".nyc-week-source"),
        "NYC_Flu_Pdf": document.querySelectorAll(".nyc-flu-source"),
        "NYC_Wastewater": document.querySelectorAll(".nyc-wastewater-source"),
        "CDC_RESP_NET": document.querySelectorAll(".resp-source")
    }
});

ui.displayLatestData(latestDayData);
ui.displayCompleteData(latestComplete);
ui.displayWeeklyData(latestWeekData);
// ui.displayCompleteData(latestComplete);
ui.displayLastMonth(deathsLastMonth);
ui.displayThirtyDays(deathsThirtyDays);


for (status in respByStatus) {
    ui.displayRespData(status, respByStatus[status]);
}

ui.displaySource(dailyInfo, staleDaily);
ui.displaySource(wastewaterInfo, staleWastewater);
ui.displaySource(casesInfo, staleWeekly);
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
    "legend": {
        "display": false
    },
    "title": "Hospitalizations per day (7-day average)",
    "datasets": [{
        "backgroundColor": "#5F0F40",
        "data": dayData.map(row => row.hosp_count_7day_avg)
    }]
});
/*
chartManager.displayData({
    "chartType": "line",
    "element": document.querySelector("#nyc-week-cases-chart"),
    "labels": weekLabels,
    "legend": {
        "display": false
    },
    "title": "Cases per day (7-day average, confirmed and probable)",
    "datasets": [{
        "backgroundColor": "#9A031E",
        "data": weekData.map(row => row.value)
    }]
});
*/
chartManager.displayData({
    "chartType": "bar",
    "element": document.querySelector("#nyc-deaths-chart"),
    "labels": dayLabels,
    "legend": {
        "display": false
    },
    "title": "Deaths per day",
    "datasets": [{
        "backgroundColor": "#FB8B24",
        "data": dayData.map(row => row.death_count)
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
