import { DateTime } from "/static/node_modules/luxon/build/es6/luxon.js";

const exports = {};

exports.isLastMonth = function(dayItem) {
    const dayDate = DateTime.fromISO(dayItem.date);

    return dayDate.get("year") === this.lastMonthYear
        && dayDate.get("month") === this.lastMonth;
};

exports.daysFilter = function(dayItem) {
    const beginDate = DateTime.fromISO(this.endDateString).minus({"days": 30});
    const dayDate = DateTime.fromISO(dayItem.date);
    const endDate = DateTime.fromISO(this.endDateString);
    return dayDate > beginDate && dayDate <= endDate;
};

exports.addValues = function(accumulator, currentValue) {
    return accumulator + currentValue;
};

exports.rangeTotal = function(dayData, filterKey, filterThis, propertyKey) {
    const today = DateTime.now().setZone(filterThis.timezone);
    const lastMonth = today.minus({"months": 1});
    filterThis.lastMonth = lastMonth.get("month");
    filterThis.lastMonthYear = lastMonth.get("year");

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

    if (!('date' in rangeData[0])) {
        console.error('No date', rangeData[0]);
        return zeroResult;
    }

    const firstDayDate = DateTime.fromISO(rangeData[0].date);

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

exports.cdcSeason = function() {
    const nowDate = new Date();
    const nowYear = nowDate.getFullYear();

    if (nowDate.getMonth() < 9) {
        return (nowYear - 1).toString() + "-" + nowYear.toString().substring(2);
    }

    return nowYear.toString() + "-" + (nowYear + 1).toString().substring(2)
}

export default exports;
