import { DateTime } from "/static/node_modules/luxon/build/es6/luxon.js";

const exports = {};

exports.isLastMonth = function(dayItem) {
    const dayDate = DateTime.fromISO(dayItem.date_of_interest);
    return dayDate.get("month") === this.lastMonth;
};

exports.daysFilter = function(dayItem) {
    const beginDate = DateTime.fromISO(this.endDateString).minus({"days": 30});
    const dayDate = DateTime.fromISO(dayItem.date_of_interest);
    const endDate = DateTime.fromISO(this.endDateString);
    return dayDate > beginDate && dayDate <= endDate;
};

exports.addValues = function(accumulator, currentValue) {
    return accumulator + currentValue;
};

exports.rangeTotal = function(dayData, filterKey, filterThis, propertyKey) {
    const today = DateTime.now().setZone(filterThis.timezone);
    filterThis.lastMonth = today.minus({"months": 1}).get("month");

    const zeroResult = {
        "deaths": 0,
        "days": 0,
        "monthName": today.monthLong
    };

    const rangeData = dayData.filter(exports[filterKey].bind(filterThis));
    const rangeDeaths = rangeData.map((item) => item[propertyKey]);

    const totalDeaths = rangeDeaths.reduce(exports.addValues, 0);

    if (!rangeData.length) {
        return zeroResult;
    }

    if (!('date_of_interest' in rangeData[0])) {
        console.error('No date_of_interest', rangeData[0]);
        return zeroResult;
    }

    const firstDayDate = DateTime.fromISO(rangeData[0].date_of_interest);

    return {
        "beginDate": firstDayDate.toLocaleString(DateTime.DATE_SHORT),
        "deaths": totalDeaths,
        "days": rangeData.length,
        "monthName": firstDayDate.monthLong
    };
};

exports.isStale = function(thresholdDays, inputDateString) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - thresholdDays);

    const inputDate = new Date(inputDateString);
    if (!(inputDate instanceof Date) || isNaN(inputDate)) {
        console.error("Invalid input date for isStale: " + inputDateString);
    }

    return inputDate <= thresholdDate;
};

export default exports;
