module.exports = {
  getRandomIntInclusive: (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
  calcDaysQty: (startDate, endDate) => {
    startDate = Number(startDate);
    endDate = Number(endDate);
    return endDate - startDate + 1;
  },
};
