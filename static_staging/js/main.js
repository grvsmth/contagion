import CacheClient from "./CacheClient.js";
import Ui from "./Ui.js";

const localityUrl = "/api/0.1/localities/?name=NYC";

const cacheClient = new CacheClient();
const localityInfo = await cacheClient.fetchData(localityUrl);
console.log("localityInfo", localityInfo);

const dayDataUrl = "/api/0.1/day-data/?locality=" + localityInfo[0].pk;
const dayData = await cacheClient.fetchData(dayDataUrl);

console.log("dayData", dayData);

const latestDayData = dayData[dayData.length - 1];
const latestComplete = dayData.findLast((dayInfo) => {
    return !dayInfo.incomplete;
});

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
        "sevenDayComplete": document.querySelector("#nyc-death-7day-complete")
    },
    "nycLatestDate": document.querySelectorAll(".nyc-latest-date"),
    "nycCompleteDate": document.querySelectorAll(".nyc-complete-date"),
    "nycSource": document.querySelectorAll(".nyc-source")
});

ui.displayLatestData(latestDayData);
ui.displayCompleteData(latestComplete);

ui.displayNycSource(localityInfo[0]);

