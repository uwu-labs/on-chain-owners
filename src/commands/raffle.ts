import { EIP1155_BASIC_ABI, EIP721_BASIC_ABI, maticPublicMainnetProvider, MATIC_STAMP, publicMainnetProvider } from '#constants';
import { excludeUsingGlobals } from '#functions/exclude';
import { MATIC_NFT_BALANCES_BLOCK, NFT_BALANCES_LATEST_BLOCK } from '#functions/graph/queries';
import { Contract } from 'ethers';
import { mkdirSync, writeFileSync } from 'fs';
import { request } from 'graphql-request';
import ora from 'ora';
import presets from '#functions/presets';
import 'dotenv/config';

export default async (block: number, rafflIds: string) => {
	const { address } = MATIC_STAMP;
	const spinner = ora(`Grabbing holdings of ${address}`).start();
	const fail = (error: string) => {
		spinner.fail(error);
		process.exit(1);
	};
	const holderStampEntries = new Map<number, Map<string, number>>();
	const raffleIdList = rafflIds.split(',');
	const contract = new Contract(address, EIP1155_BASIC_ABI, maticPublicMainnetProvider);
	const filteredRaffleIds = filterRaffleIds(raffleIdList, contract, fail);
	if (filterRaffleIds.length === 0) fail('Error validating raffle-ids. Please ensure you are entering raffle-ids that exist!');
	for (const raffleId of await filteredRaffleIds) {
		let holderEntries = new Map<string, number>();
		const totalSupply = await contract.totalSupply(raffleId).catch(() => fail('"totalSupply" call failed'));
		const holderAddresses = new Set<string>();
		let totalSupplyCounter = 0;
		while (totalSupplyCounter < totalSupply) {
			console.log('\n', MATIC_NFT_BALANCES_BLOCK(address, Number(block), raffleId, holderAddresses.size));
			const holdingData = await request(
				`${process.env.EIP1155_SUBGRAPH_MATIC}`,
				MATIC_NFT_BALANCES_BLOCK(address, Number(block), raffleId, holderAddresses.size)
			).catch((err) => fail(`holders query failed\n${err}`));
			const tokens = holdingData?.erc1155Contract.tokens || [];
			for (const token of tokens) {
				for (const holderBalance of token.balances) {
					const amountHeld = Number(holderBalance.valueExact);
					if (holderBalance.account === null) continue;
					const holder = holderEntries.get(holderBalance.account.id);
					if (!holder) holderEntries.set(holderBalance.account.id, amountHeld);
					const holderAddress = holderBalance.account.id.toLowerCase();
					holderAddresses.add(holderAddress);
					totalSupplyCounter += Number(amountHeld);
				}
			}
		}
		holderStampEntries.set(raffleId, holderEntries);

		// Removes holder addresses which balance value equals 0.
		for (const entry of [...holderEntries.keys()]) if (Number(holderEntries.get(entry)) === 0) holderEntries.delete(entry);

		// Write holderEntries data to json
		holderEntries = excludeUsingGlobals(holderEntries);
		holderEntries = new Map([...holderEntries.entries()].sort((a, b) => b[1] - a[1]));
		const outputDirectory = new URL('../../data/', import.meta.url);
		mkdirSync(outputDirectory, { recursive: true });
		const outputFile = new URL(`./stampHoldersRaffleId${raffleId}.json`, outputDirectory);
		writeFileSync(outputFile, JSON.stringify(Object.fromEntries([...holderEntries.entries()]), null, 2));
	}

	// Fetch KGF holders
	const kgfHolderMap = fetchKGFHolders(fail);
	let fullStampHolders = filterEligibleAddresses(await kgfHolderMap, holderStampEntries);
	fullStampHolders = fullStampHolders.sort((a, b) => b.balance - a.balance);

	// Raffle lists and raffleWinner
	const tempRaffleList = fillFinalHolderRaffleList(fullStampHolders);
	const finalRaffleList = shuffleRaffleList(tempRaffleList);
	const raffleWinner = finalRaffleList[Math.floor(Math.random() * finalRaffleList.length)];

	// Writing data to src
	const finalOutputDirectory = new URL('../../final/', import.meta.url);
	mkdirSync(finalOutputDirectory, { recursive: true });
	const outputFile = new URL(`./fullStampHolders.json`, finalOutputDirectory);
	const tempOutputFile = new URL(`./tempRaffleList.json`, finalOutputDirectory);
	const finalOutputFile = new URL(`./finalRaffleList.json`, finalOutputDirectory);
	writeFileSync(outputFile, JSON.stringify(fullStampHolders, null, 2));
	writeFileSync(tempOutputFile, JSON.stringify(tempRaffleList, null, 2));
	writeFileSync(finalOutputFile, JSON.stringify(finalRaffleList, null, 2));
	spinner.succeed();

	// Winner announced
	console.log('\n', `CONGRATS TO THE WINNER OF THE KGF STAMPS RAFFLE!`);
	console.table([{ raffleWinner }]);
};

const filterRaffleIds = async (raffleIdList: Array<string>, contract: Contract, fail: { (error: string): never; (arg0: string): any }) => {
	const filteredRaffleIds = new Array<number>();

	for (const raffleId of raffleIdList) {
		const exists = await contract.exists(Number(raffleId)).catch(() => fail('"exists" call failed'));
		if (exists) filteredRaffleIds.push(Number(raffleId));
	}
	return filteredRaffleIds.sort();
};

/* Filter the holderStampEntries for addresses that exist across all holderStampEntries.values().
We are also reducing the holder onject to contain the min full stamp collection as final balance. */
const filterEligibleAddresses = (kgfHolderMap: Map<string, number>, holderStampEntries: Map<number, Map<string, number>>) => {
	const finalStatsList = [];
	for (const [k, v] of kgfHolderMap) {
		let hasAllStamps = true;
		const tempStatsList = [];
		const kgfStampStats = {
			address: k,
			balance: v
		};
		tempStatsList.push(kgfStampStats);
		for (const value of holderStampEntries.values()) {
			if (!value.has(k)) {
				hasAllStamps = false;
				break;
			}
			const stampStats = {
				address: '',
				balance: 0
			};
			const holderBalances = value.get(k);
			if (holderBalances) {
				stampStats.balance = holderBalances;
				stampStats.address = k;
				tempStatsList.push(stampStats);
			}
		}

		if (hasAllStamps) {
			const finalStampStats = tempStatsList.reduce((res, obj) => {
				return obj.balance < res.balance ? obj : res;
			});
			finalStatsList.push(finalStampStats);
		}
	}
	return finalStatsList;
};

// Populate finalRaffleList by decoupling holder obj and appending that holder.address n balances number of times.
const fillFinalHolderRaffleList = (fullStampHolders: { address: string; balance: number }[]) => {
	const res: string[] = [];

	for (const holder of fullStampHolders) {
		const addressList = Array(holder.balance).fill(holder.address);
		res.push(...addressList);
	}

	return res;
};

// Randomize array in-place using Durstenfeld shuffle algorithm
const shuffleRaffleList = (finalRaffleList: Array<string>) => {
	for (let i = finalRaffleList.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[finalRaffleList[i], finalRaffleList[j]] = [finalRaffleList[j], finalRaffleList[i]];
	}
	return finalRaffleList;
};

// Query EIP721 subgraph using latest block to fetch current KGF holders
const fetchKGFHolders = async (fail: { (error: string): never; (arg0: string): any }) => {
	const preset = presets.get('kgf');
	let holderEntries = new Map<string, number>();
	if (preset) {
		const address = preset.nft;
		const contract = new Contract(address, EIP721_BASIC_ABI, publicMainnetProvider);
		const totalSupply = await contract.totalSupply().catch(() => fail('"totalSupply" call failed'));
		const supplyBlocks = Math.ceil(totalSupply / 999);

		for (let i = 0; i < supplyBlocks; ++i) {
			const holdingData = await request(
				'https://api.thegraph.com/subgraphs/name/quantumlyy/eip721-subgraph-mainnet',
				NFT_BALANCES_LATEST_BLOCK(address, 999, i * 999)
			).catch((err) => fail(`holders query failed\n${err}`));

			const holdings = holdingData?.erc721Contract?.tokens || [];

			for (const holding of holdings) {
				const existing = holderEntries.get(holding.owner.id);

				if (existing) holderEntries.set(holding.owner.id, existing + 1);
				else holderEntries.set(holding.owner.id, 1);
			}
		}

		for (const entry of [...holderEntries.keys()]) if (holderEntries.get(entry) === 0) holderEntries.delete(entry);

		// Are we doing exlusions?
		const { xToken, vToken, slp, forcedExclusions } = preset;
		holderEntries.delete(xToken);
		holderEntries.delete(vToken);
		holderEntries.delete(slp);
		for (const exclusion of forcedExclusions) holderEntries.delete(exclusion);

		holderEntries = excludeUsingGlobals(holderEntries);

		holderEntries = new Map([...holderEntries.entries()].sort((a, b) => b[1] - a[1]));

		const outputDirectory = new URL('../../data/', import.meta.url);
		mkdirSync(outputDirectory, { recursive: true });
		const outputFile = new URL('./kgfHolders.json', outputDirectory);
		writeFileSync(outputFile, JSON.stringify(Object.fromEntries([...holderEntries.entries()]), null, 2));
	}
	return holderEntries;
};
