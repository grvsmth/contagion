import CacheClient from "./CacheClient.js";

console.log("main.js");
const dayDataUrl = "/api/0.1/day-data/?locality=1";

const cacheClient = new CacheClient();

const dayData = await cacheClient.fetchData(dayDataUrl);

console.log("dayData", dayData);
