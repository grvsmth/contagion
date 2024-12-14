import CacheClient from "./CacheClient.js";


const dayDataUrl = "/api/0.1/day-data/?locality=1";
const population = 11996161;
const lakh = 100000;

const cacheClient = new CacheClient();
const dayData = await cacheClient.fetchData(dayDataUrl);

console.log("dayData", dayData);

const latestDayData = dayData[dayData.length - 1];
const latestComplete = dayData.findLast((dayInfo) => {
    return !dayInfo.incomplete;
});

function perLakh(input) {
    return input * lakh * 10 / population;
}

document.querySelector("#nyc-hosp-7day").innerText = latestDayData
    .hosp_count_7day_avg;
document.querySelector("#nyc-hosp-7day-lakh").innerText =
    perLakh(latestDayData.hosp_count_7day_avg).toFixed(2);
document.querySelector("#nyc-hosp-7day-complete").innerText =
    latestComplete.hosp_count_7day_avg;
document.querySelector("#nyc-hosp-7day-complete-lakh").innerText =
    perLakh(latestComplete.hosp_count_7day_avg).toFixed(2);

document.querySelector("#nyc-cases-7day").innerText = latestDayData
    .all_case_count_7day_avg;
document.querySelector("#nyc-cases-7day-complete").innerText = latestComplete
    .all_case_count_7day_avg;

document.querySelector("#nyc-death-7day").innerText = latestDayData
    .death_count_7day_avg;
document.querySelector("#nyc-death-7day-complete").innerText = latestComplete
    .death_count_7day_avg;

const latestDate = new Date(latestDayData.date_of_interest);
document.querySelectorAll(".nyc-latest-date").forEach((element) => {
    element.innerText = latestDate.toLocaleDateString();
});

const latestCompleteDate = new Date(latestDayData.date_of_interest);
document.querySelectorAll(".nyc-complete-date").forEach((element) => {
    element.innerText = latestCompleteDate.toLocaleDateString();
});
