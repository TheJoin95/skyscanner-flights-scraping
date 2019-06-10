module.exports = {
    common: {
        searchSubmit: 'button[type="submit"]',
        flexibleDate: '#day-flexible-days-section .fss-fxo-select button:last-child',
    },
    login: {
        signInButton: '#login-button-nav-item button',
        focusableEmailElement: '[data-testid="login-email-button"]',
        emailElement: '.js-loginEmailInput',
        passwordElement: '#password',
        signinSubmitButton: '[data-testid="login-button"]'
    },
    searchOptions: {
        oneWayButton: '#fsc-trip-type-selector-one-way',
        returnButton: '#fsc-trip-type-selector-return',
        directOnlyButton: 'input[name="directOnly"]',
        originAirport: '#fsc-origin-search',
        destinationAirport: '#fsc-destination-search',
    },
    datePicker: {
        flightPicker: '[class*="FlightDatepicker"]'
    },
    passengerOptions: {
        popupButton:'[name="class-travellers-trigger"]',
        popup: '[class*="BpkPopover"]',
        adultButton: '[class*="BpkPopover"] div [class*="CabinClassTravellersSelector_CabinClassTravellersSelector__nudger-wrapper"]:nth-of-type(1) button:nth-of-type(2)',
        childrenButton: '[class*="BpkPopover"] div [class*="CabinClassTravellersSelector_CabinClassTravellersSelector__nudger-wrapper"]:nth-of-type(2) button:nth-of-type(2)',
        passengerSubmitButton: '[class*="BpkPopover_bpk-popover__footer"] button'
    },
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