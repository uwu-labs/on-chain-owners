import { mkdirSync, writeFileSync } from 'fs';
import csv from 'csvtojson';

// interface Row {
// 	field1: string;
// 	address: string;
// 	uwuOrb: string;
// 	kgfOrb: string;
// 	lampOrb: string;
// 	kaijuOrb: string;
// 	capsOrb: string;
// 	asunaOrb: string;
// 	muriOrb: string;
// 	hasuOrb: string;
// 	additional: string;
// }

export const convertCSVToJSON = async () => {
	const jsonArray = await csv().fromFile('src/csv/aiko_partnership_orbs.csv');
	const outputDirectory = new URL('../../csv/', import.meta.url);
	mkdirSync(outputDirectory, { recursive: true });
	const outputFile = new URL(`./aikoCSV.json`, outputDirectory);
	writeFileSync(outputFile, JSON.stringify(jsonArray, null, 2));

	return jsonArray;
};

export const convertToCSV = (objArray: string | any[]) => {
	// eslint-disable-next-line no-negated-condition
	const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	let str = '';
	// eslint-disable-next-line @typescript-eslint/prefer-for-of
	for (let i = 0; i < array.length; i++) {
		let line = '';
		// eslint-disable-next-line guard-for-in
		for (const index in array[i]) {
			if (line !== '') line += ',';

			line += array[i][index];
		}

		str += `${line}\r\n`;
	}

	return str;
};
