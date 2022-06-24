import { EIP721_BASIC_ABI, publicMainnetProvider, AIKO_WL_PARTNERS } from '#constants';
import { NFT_BALANCES } from '#functions/graph/queries';
import { Contract } from 'ethers';
import { mkdirSync, writeFileSync } from 'fs';
import { request } from 'graphql-request';
import ora from 'ora';
import 'dotenv/config';

interface HolderPartnerStats {
	address: string;
	hasUwu: boolean;
	hasKgf: boolean;
	hasLamp: boolean;
	hasKaiju: boolean;
	hasCaps: boolean;
	hasAsuna: boolean;
	hasMuri: boolean;
	hasHaus: boolean;
	hasTubby: boolean;
}

interface FinalHolderStats {
	address: string;
	wlAllocation: number;
}

export default async (block: number) => {
	const nftHolderMap = await fetchPartnerHolderBalances(block);

	const whiteListHolders = filterEligibleAddresses(nftHolderMap);
	const filteredWhiteListHolders = filterHolderPartnerStatsKeys(whiteListHolders);
	const finalWhiteListHolders = mapFinalHolderStats(filteredWhiteListHolders);
	finalWhiteListHolders.sort((a, b) => b.wlAllocation - a.wlAllocation);

	const outputDirectory = new URL('../../results/', import.meta.url);
	mkdirSync(outputDirectory, { recursive: true });

	const outputFile = new URL(`./eligibleAikoPartnerHolders.json`, outputDirectory);
	writeFileSync(outputFile, JSON.stringify(whiteListHolders, null, 2));

	const filteredOutputFile = new URL(`./filteredEligibleAikoPartnerHolders.json`, outputDirectory);
	writeFileSync(filteredOutputFile, JSON.stringify(filteredWhiteListHolders, null, 2));

	const finalOutputFile = new URL(`./finalEligibleAikoPartnerHolders.json`, outputDirectory);
	writeFileSync(finalOutputFile, JSON.stringify(finalWhiteListHolders, null, 2));
};

const fetchPartnerHolderBalances = async (block: number) => {
	const nftHolderMap = new Map<string, Map<string, number>>();
	for (const partner of AIKO_WL_PARTNERS) {
		const spinner = ora(`Grabbing holdings of "${partner.address}" for token ${partner.name}`).start();
		const fail = (error: string) => {
			spinner.fail(error);
			process.exit(1);
		};
		const contract = new Contract(partner.address, EIP721_BASIC_ABI, publicMainnetProvider);
		const totalSupply = await contract.totalSupply().catch(() => fail('"totalSupply" call failed'));
		const supplyBlocks = Math.ceil(totalSupply / 999);
		let holderEntries = new Map<string, number>();

		for (let i = 0; i < supplyBlocks; ++i) {
			console.log('\n', NFT_BALANCES(partner.address, Number(block), 999, i * 999));
			const holdingData = await request(`${process.env.EIP721_SUBGRAPH}`, NFT_BALANCES(partner.address, Number(block), 999, i * 999)).catch(
				(err) => fail(`holders query failed\n${err}`)
			);

			const holdings = holdingData?.erc721Contract?.tokens || [];
			for (const holding of holdings) {
				const existing = holderEntries.get(holding.owner.id);
				if (existing) holderEntries.set(holding.owner.id, existing + 1);
				else holderEntries.set(holding.owner.id, 1);
			}
		}

		for (const entry of [...holderEntries.keys()]) if (holderEntries.get(entry) === 0) holderEntries.delete(entry);

		holderEntries = new Map([...holderEntries.entries()].sort((a, b) => b[1] - a[1]));
		const outputDirectory = new URL('../../data/', import.meta.url);
		mkdirSync(outputDirectory, { recursive: true });
		const outputFile = new URL(`./nftHolders${partner.name}.json`, outputDirectory);
		writeFileSync(outputFile, JSON.stringify(Object.fromEntries([...holderEntries.entries()]), null, 2));
		nftHolderMap.set(`${partner.name}`, holderEntries);
		spinner.succeed();
	}
	return nftHolderMap;
};

const filterEligibleAddresses = (nftHolderMap: Map<string, Map<string, number>>) => {
	const finalStatsList: HolderPartnerStats[] = [];
	for (const [partnerKey, partnerMap] of nftHolderMap) {
		for (const [k, v] of partnerMap) {
			const existingHolder = finalStatsList.find((o) => o.address === k);
			if (existingHolder) {
				const updatedHolderStats = sumPartnerHoldings(partnerKey, existingHolder, v);
				upsert(finalStatsList, updatedHolderStats);
			} else {
				const holderStats: HolderPartnerStats = {
					address: k,
					hasUwu: false,
					hasKgf: false,
					hasLamp: false,
					hasKaiju: false,
					hasCaps: false,
					hasAsuna: false,
					hasMuri: false,
					hasHaus: false,
					hasTubby: false
				};
				holderStats.address = k;
				const updatedHolderStats = sumPartnerHoldings(partnerKey, holderStats, v);
				finalStatsList.push(updatedHolderStats);
			}
		}
	}

	return finalStatsList;
};

const sumPartnerHoldings = (partnerKey: string, holderStats: HolderPartnerStats, v: number) => {
	switch (partnerKey) {
		case 'UWU': {
			const hasBal = v > 0 ? true : false;
			holderStats.hasUwu = hasBal;
			break;
		}
		case 'KGF': {
			const hasBal = v > 0 ? true : false;
			holderStats.hasKgf = hasBal;
			break;
		}
		case 'KAIJU': {
			const hasBal = v > 0 ? true : false;
			holderStats.hasKaiju = hasBal;
			break;
		}
		case 'LAMP': {
			const hasBal = v > 0 ? true : false;
			holderStats.hasLamp = hasBal;
			break;
		}
		case 'CAPSULE': {
			const hasBal = v > 0 ? true : false;
			holderStats.hasCaps = hasBal;
			break;
		}
		case 'ASUNA': {
			const hasBal = v > 0 ? true : false;
			holderStats.hasAsuna = hasBal;
			break;
		}
		case 'MURI': {
			const hasBal = v > 0 ? true : false;
			holderStats.hasMuri = hasBal;
			break;
		}
		case 'HAUS': {
			const hasBal = v > 0 ? true : false;
			holderStats.hasHaus = hasBal;
			break;
		}
		case 'TUBBY': {
			const hasBal = v > 0 ? true : false;
			holderStats.hasTubby = hasBal;
			break;
		}
		default:
			console.log(`The partnerKey: ${partnerKey} does not match a defined AIKO WL Partner`);
	}
	return holderStats;
};

const upsert = (array: HolderPartnerStats[], element: HolderPartnerStats) => {
	const i = array.findIndex((_element) => _element.address === element.address);
	if (i > -1) array[i] = element;
	else array.push(element);
};

const filterHolderPartnerStatsKeys = (array: HolderPartnerStats[]) => {
	const filteredHolderPartnerStats: Partial<HolderPartnerStats>[] = [];
	for (const holder of array) {
		const partialHolderPartnerStats: Partial<HolderPartnerStats> = Object.fromEntries(Object.entries(holder).filter(([_, v]) => v !== false));
		filteredHolderPartnerStats.push(partialHolderPartnerStats);
	}
	return filteredHolderPartnerStats;
};

const mapFinalHolderStats = (array: Partial<HolderPartnerStats>[]) => {
	const filteredHolderPartnerStats: FinalHolderStats[] = [];
	for (const holder of array) {
		const { address, ...partnerKeys } = holder;
		if (address) {
			const finalStats: FinalHolderStats = {
				address,
				wlAllocation: 0
			};
			const keys = Object.entries(partnerKeys);
			if (keys.length > 3) {
				finalStats.wlAllocation = 3;
			} else {
				finalStats.wlAllocation = keys.length;
			}
			filteredHolderPartnerStats.push(finalStats);
		}
	}
	return filteredHolderPartnerStats;
};
