import { readFileSync, writeFileSync } from 'fs';
import ora from 'ora';
import { fileURLToPath } from 'url';

export default () => {
	const spinner = ora('Merging holding data').start();

	const outputDirectory = new URL('../../data/', import.meta.url);
	const nftsFile = new URL('./nftHolders.json', outputDirectory);
	const nftxFile = new URL('./nftxHolders.json', outputDirectory);

	let holdings = new Map<string, number>();

	let nftsRaw: { [K: string]: number } = {};
	try {
		nftsRaw = JSON.parse(readFileSync(fileURLToPath(nftsFile), { encoding: 'utf8' }));
	} catch {}
	const nfts = new Map<string, number>(Object.entries(nftsRaw));

	let nftxRaw: { [K: string]: number } = {};
	try {
		nftxRaw = JSON.parse(readFileSync(fileURLToPath(nftxFile), { encoding: 'utf8' }));
	} catch {}
	const nftx = new Map<string, number>(Object.entries(nftxRaw));

	const states = [nfts, nftx];

	for (const state of states) {
		for (const [holder, amount] of [...state.entries()]) {
			const existing = holdings.get(holder);

			if (existing) holdings.set(holder, existing + amount);
			else holdings.set(holder, amount);
		}
	}

	holdings = new Map([...holdings.entries()].sort((a, b) => b[1] - a[1]));

	const outputFile = new URL('./holders.json', outputDirectory);
	writeFileSync(outputFile, JSON.stringify(Object.fromEntries([...holdings.entries()]), null, 2));

	spinner.succeed();
};
