import CacheClient from "./CacheClient.js";

console.log("main.js");
const dayDataUrl = "/api/0.1/day-data/?locality=1";

const cacheClient = new CacheClient();

const dayData = await cacheClient.fetchData(dayDataUrl);

console.log("dayData", dayData);

const latestDayData = dayData[dayData.length - 1];
const latestComplete = dayData.findLast((dayInfo) => {
    return !dayInfo.incomplete;
});

document.querySelector("#nyc-hosp-7day").innerText = latestDayData
    .hosp_count_7day_avg;
document.querySelector("#nyc-hosp-7day-complete").innerText = latestComplete
    .hosp_count_7day_avg;

document.querySelector("#nyc-cases-7day").innerText = latestDayData
    .all_case_count_7day_avg;
document.querySelector("#nyc-cases-7day-complete").innerText = latestComplete
    .all_case_count_7day_avg;
