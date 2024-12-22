import CacheClient from "./CacheClient.js";
import Ui from "./Ui.js";

import compute from "./compute.js";

const localityUrl = "/api/0.1/localities/?name=NYC";

const cacheClient = new CacheClient();
const localityInfo = await cacheClient.fetchData(localityUrl);

const dayDataUrl = "/api/0.1/day-data/?locality=" + localityInfo[0].pk;
const dayData = await cacheClient.fetchData(dayDataUrl);

const latestDayData = dayData[dayData.length - 1];
const latestComplete = dayData.findLast((dayInfo) => {
    return !dayInfo.incomplete;
});

const today = new Date();
const monthThis = {"month": today.getMonth() - 1};
const deathsLastMonth = compute.rangeTotal(
    dayData, "isMonth", monthThis, "death_count"
);

const beginDate = new Date();
beginDate.setDate(beginDate.getDate() - 36);

const thirtyDayThis = {"beginDate": beginDate};
const deathsThirtyDays = compute.rangeTotal(
    dayData, "recentDays", thirtyDayThis, "death_count"
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
    "nycLatestDate": document.querySelectorAll(".nyc-latest-date"),
    "nycCompleteDate": document.querySelectorAll(".nyc-complete-date"),
    "nycLastMonth": document.querySelectorAll(".last-month"),
    "nycSource": document.querySelectorAll(".nyc-source")
});

ui.displayLatestData(latestDayData);
ui.displayCompleteData(latestComplete);
ui.displayLastMonth(deathsLastMonth);
ui.displayThirtyDays(deathsThirtyDays);

ui.displayNycSource(localityInfo[0]);

