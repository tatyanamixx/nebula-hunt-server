/**
 * Демонстрация логики циклических наград
 */
function demonstrateCyclingLogic() {
	console.log('🧪 Demonstrating cycling logic for daily rewards...\n');

	// Пример 1: days = [1, 2, 3, 4, 5, 6, 7]
	console.log('📋 Example 1: days = [1, 2, 3, 4, 5, 6, 7]');
	console.log('Max day: 7');
	console.log(
		'Cycle pattern: 1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7, 1, ...\n'
	);

	const days1 = [1, 2, 3, 4, 5, 6, 7];
	const maxDay1 = Math.max(...days1);

	for (let currentStreak = 1; currentStreak <= 15; currentStreak++) {
		let effectiveStreak = currentStreak;
		if (currentStreak > maxDay1) {
			const cyclePosition = ((currentStreak - 1) % maxDay1) + 1;
			effectiveStreak = cyclePosition;
		}

		const hasReward = days1.includes(effectiveStreak);
		console.log(
			`Day ${currentStreak
				.toString()
				.padStart(2)}: effectiveStreak = ${effectiveStreak}, reward = ${
				hasReward ? '✅' : '❌'
			}`
		);
	}

	// Пример 2: days = [3, 15]
	console.log('\n📋 Example 2: days = [3, 15]');
	console.log('Max day: 15');
	console.log('Cycle pattern: 3, 15, 3, 15, 3, 15, ...\n');

	const days2 = [3, 15];
	const maxDay2 = Math.max(...days2);

	for (let currentStreak = 1; currentStreak <= 20; currentStreak++) {
		let effectiveStreak = currentStreak;
		if (currentStreak > maxDay2) {
			const cyclePosition = ((currentStreak - 1) % maxDay2) + 1;
			effectiveStreak = cyclePosition;
		}

		const hasReward = days2.includes(effectiveStreak);
		console.log(
			`Day ${currentStreak
				.toString()
				.padStart(2)}: effectiveStreak = ${effectiveStreak}, reward = ${
				hasReward ? '✅' : '❌'
			}`
		);
	}

	// Пример 3: days = [1, 5, 10]
	console.log('\n📋 Example 3: days = [1, 5, 10]');
	console.log('Max day: 10');
	console.log('Cycle pattern: 1, 5, 10, 1, 5, 10, 1, 5, 10, ...\n');

	const days3 = [1, 5, 10];
	const maxDay3 = Math.max(...days3);

	for (let currentStreak = 1; currentStreak <= 15; currentStreak++) {
		let effectiveStreak = currentStreak;
		if (currentStreak > maxDay3) {
			const cyclePosition = ((currentStreak - 1) % maxDay3) + 1;
			effectiveStreak = cyclePosition;
		}

		const hasReward = days3.includes(effectiveStreak);
		console.log(
			`Day ${currentStreak
				.toString()
				.padStart(2)}: effectiveStreak = ${effectiveStreak}, reward = ${
				hasReward ? '✅' : '❌'
			}`
		);
	}

	console.log('\n✅ Cycling logic demonstration completed!');
	console.log('\nExplanation:');
	console.log('- When currentStreak exceeds maxDay, the system cycles back');
	console.log('- effectiveStreak = ((currentStreak - 1) % maxDay) + 1');
	console.log(
		'- This ensures rewards are given on the specified days in a repeating cycle'
	);
	console.log(
		'- The cycle length is equal to the maximum day in the days array'
	);
}

demonstrateCyclingLogic();
