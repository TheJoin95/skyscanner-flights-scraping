module.exports = {
    setDatepicker: async function (page, wholeMonth, day, month, year) {
		if (wholeMonth !== false) {
			await page.click('[class*="FlightDatepicker"] li:nth-of-type(2) button');
			let monthNumberSelector = (parseInt(month) + 1) - new Date().getMonth();
			await page.click('button[class*="Monthselector_monthselector__month"]:nth-of-type(' + monthNumberSelector + ')');
			console.log(chalk.blue(`Selected the ${month} month`));
		} else {
			var year = year || new Date().getFullYear();
			var month = month.padStart(2, '0') || new Date().getMonth().toString().padStart(2, '0');

			if (year != new Date().getFullYear() || month != new Date().getMonth().toString().padStart(2, '0'))
				await page.select('select[name="months"]', `${year}-${month}`);

			await page.evaluate(day => {
				document.querySelectorAll('[class*="BpkCalendarDate_bpk-calendar-date"]:not([class*="BpkCalendarDate_bpk-calendar-date--outside"])')[(parseInt(day) - 1)].click(); // 16 Agosot
			}, day);
		}
		await page.screenshot({ path: 'screen/datepicker.png' });
	},
};