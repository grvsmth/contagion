
const exports = {};

exports.isMonth = function(dayItem) {
    const dayDate = new Date(dayItem.date_of_interest);
    return dayDate.getMonth() === this.month;
};

exports.dateRangeFilter = function(dayItem) {
    const dayDate = new Date(dayItem.date_of_interest);
    return dayDate >= this.beginDate && dayDate <= this.endDate;
};

exports.addValues = function(accumulator, currentValue) {
    return accumulator + currentValue;
};

exports.rangeTotal = function(dayData, filterKey, filterThis, propertyKey) {
    const rangeData = dayData.filter(exports[filterKey].bind(filterThis));
    const rangeDeaths = rangeData.map((item) => item[propertyKey]);

    const totalDeaths = rangeDeaths.reduce(exports.addValues, 0);

    const firstDayDate = new Date(rangeData[0].date_of_interest);
    const monthName = new Intl.DateTimeFormat(navigator.languages[0],
        {"month": "long"}
    ).format(firstDayDate);

    return {
        "deaths": totalDeaths,
        "days": rangeData.length,
        "monthName": monthName
    };
};

export default exports;
