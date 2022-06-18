import { EIP1155_BASIC_ABI, maticPublicMainnetProvider, MATIC_STAMP } from '#constants';
import { excludeUsingGlobals } from '#functions/exclude';
import { MATIC_NFT_BALANCES_BLOCK } from '#functions/graph/queries';
import { Contract } from 'ethers';
import { mkdirSync, writeFileSync } from 'fs';
import { request } from 'graphql-request';
import ora from 'ora';
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
					const amountHeld = holderBalance.valueExact;
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
		const outputFile = new URL(`./nftHoldersRaffleId${raffleId}.json`, outputDirectory);
		writeFileSync(outputFile, JSON.stringify(Object.fromEntries([...holderEntries.entries()]), null, 2));
	}

	// Filter for eligible holders by checking if address exists in all all holderRaffleId maps
	const smallestHolderEntriesMap = getSmallestHolderMap(holderStampEntries);
	holderStampEntries.delete(smallestHolderEntriesMap.key);
	let fullStampHolders = filterEligibleAddresses(smallestHolderEntriesMap.value, holderStampEntries);
	fullStampHolders = fullStampHolders.sort((a, b) => Number(b.balance) - Number(a.balance));

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
	console.log('\n', filteredRaffleIds.length, raffleIdList.length, raffleIdList);

	for (const raffleId of raffleIdList) {
		const exists = await contract.exists(Number(raffleId)).catch(() => fail('"exists" call failed'));
		if (exists) filteredRaffleIds.push(Number(raffleId));
	}
	return filteredRaffleIds.sort();
};
// Easier to loop over smallestMap to filter for addresses that exisit in all holderStampEntries.values()
const getSmallestHolderMap = (holderStampEntries: Map<number, Map<string, number>>) => {
	const smallestMapEntry = { key: 0, value: new Map<string, number>() };
	let smallestMapSize = 0;
	for (const [k, v] of holderStampEntries.entries()) {
		if (smallestMapSize <= v.size) {
			smallestMapEntry.key = k;
			smallestMapEntry.value = v;
			smallestMapSize = v.size;
		}
	}
	return smallestMapEntry;
};

/* Filter the holderStampEntries for addresses that exist across all holderStampEntries.values().
We are also reducing the holder onject to contain the min full stamp collection as final balance. */
const filterEligibleAddresses = (smallestHolderMap: Map<string, number>, holderStampEntries: Map<number, Map<string, number>>) => {
	const finalStatsList = [];
	for (const [k, v] of smallestHolderMap) {
		let hasAllStamps = true;
		const tempStatsList = [];
		const smallStampStats = {
			address: k,
			balance: v
		};
		tempStatsList.push(smallStampStats);
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
				return Number(obj.balance) < Number(res.balance) ? obj : res;
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
		const addressList = Array(Number(holder.balance)).fill(holder.address);
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
