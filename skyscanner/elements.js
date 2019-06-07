module.exports = {
    common: {},
    login: {},
    searchOptions: {},
    datePicker: {},
    passengerOptions: {},
    flightList: {
        results: '.day-list-item div article.result',
        depart: '[class*="LegInfo__leg-depart"]',
        duration: '[class*="LegInfo__leg-stops-3lHev"]',
        destination: '[class*="LegInfo__leg-arrive"]',
        price: '.price'
    },
    destinationList: {
        dataContainer: '.browse-list-category',
        record: '.browse-list-result',
        title: 'h3',
        direct: '.browse-data-directness',
        url: '.flightLink',
        parentDataContainer: '.result-list ul',
        dataContainerOpened: '.browse-list-category.open'
    }
};