import { EIP721_BASIC_ABI, publicMainnetProvider, AIKO_PARTNERS } from '#constants';
import { CURR_BLOCK_NFT_BALANCES } from '#functions/graph/queries';
import { Contract } from 'ethers';
import { mkdirSync, writeFileSync } from 'fs';
import { request } from 'graphql-request';
import ora from 'ora';
import 'dotenv/config';
import { convertCSVToJSON, convertToCSV } from '#functions/csv';

export default async () => {
	const nftHolderMap = await fetchPartnerHolderBalances();
	const csvJSON = await convertCSVToJSON();
	const partnerKeys = ['UWU', 'KGF', 'LAMP', 'KAIJU', 'CAPS', 'ASUNA', 'MURI', 'HAUS'];
	const reducedHolders = [];
	const deletedHolders = [];
	const prevSize = csvJSON.length;
	const prevWhitelistAmount = csvJSON.reduce((acc: number, obj: { field1: number }) => {
		if (Number(obj.field1) > 3) {
			obj.field1 = 3;
		}
		return acc + Number(obj.field1);
	}, 0);
	for (const row of csvJSON) {
		row['MAX MINT FOR PARTNERSHIP ORB IS 3'] = row['MAX MINT FOR PARTNERSHIP ORB IS 3'].toLowerCase();
		const address = row['MAX MINT FOR PARTNERSHIP ORB IS 3'];
		let validEntries = 0;
		for (const [key, value] of Object.entries(row)) {
			if (partnerKeys.includes(key) && Number(value) > 0) {
				const holderBalances = nftHolderMap.get(`${key}`);
				if (holderBalances) {
					if (holderBalances.has(address)) {
						const currentBalance = holderBalances.get(address);
						const whiteListCaps = AIKO_PARTNERS.find((obj) => {
							return obj.name === `${key}`;
						});
						if (whiteListCaps && currentBalance) {
							if (currentBalance > whiteListCaps['3']) {
								row[key] = `3`;
							} else if (currentBalance > whiteListCaps['2']) {
								row[key] = `2`;
							} else {
								row[key] = `1`;
							}
							validEntries += Number(row[key]);
						}
					}
				}
			}
		}
		console.log('\n', validEntries, address, row.field1);
		if (validEntries > 0) {
			validEntries > 3 ? (row.field1 = `3`) : (row.field1 = `${validEntries}`);
			reducedHolders.push(row);
		}
		const isFound = reducedHolders.some((element) => {
			if (element === row) {
				return true;
			}

			return false;
		});
		if (!isFound) {
			deletedHolders.push(row);
		}
	}
	const currSize = reducedHolders.length;
	const deletedSize = deletedHolders.length;
	console.log(
		'\n',
		`Successfully reduced previous Aiko WL entry amount from ${prevSize} to a new size of ${currSize}. That's a reduction of ${deletedSize} entries deleted!`
	);
	const currWhitelistAmount = reducedHolders.reduce((acc, obj) => {
		return acc + Number(obj.field1);
	}, 0);
	console.log(
		'\n',
		`Successfully reduced previous Aiko WL allocation from ${prevWhitelistAmount} to a new size of ${currWhitelistAmount}. That's a reduction of ${
			prevWhitelistAmount - currWhitelistAmount
		} WLs deleted!`
	);
	const outputDirectory = new URL('../../results/', import.meta.url);
	mkdirSync(outputDirectory, { recursive: true });
	const outputFile = new URL(`./eligibleAikoPartnerHolders.json`, outputDirectory);
	writeFileSync(outputFile, JSON.stringify(reducedHolders, null, 2));
	const outputFileDeleted = new URL(`./deletedAikoPartnerHolders.json`, outputDirectory);
	writeFileSync(outputFileDeleted, JSON.stringify(deletedHolders, null, 2));
	const headers = Object.keys(reducedHolders[0]);
	reducedHolders.unshift(headers);
	const csv = convertToCSV(reducedHolders);
	const outputCSV = new URL(`./reducedAikoPartnershipOrbs.csv`, outputDirectory);
	writeFileSync(outputCSV, csv);
};

const fetchPartnerHolderBalances = async () => {
	const nftHolderMap = new Map<string, Map<string, number>>();
	for (const partner of AIKO_PARTNERS) {
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
			console.log('\n', CURR_BLOCK_NFT_BALANCES(partner.address, 999, i * 999));
			const holdingData = await request(`${process.env.EIP721_SUBGRAPH}`, CURR_BLOCK_NFT_BALANCES(partner.address, 999, i * 999)).catch((err) =>
				fail(`holders query failed\n${err}`)
			);

			const holdings = holdingData?.erc721Contract?.tokens || [];
			for (const holding of holdings) {
				const existing = holderEntries.get(holding.owner.id);
				if (existing) holderEntries.set(holding.owner.id, existing + 1);
				else holderEntries.set(holding.owner.id, 1);
			}
		}

		for (const entry of [...holderEntries.keys()]) if (holderEntries.get(entry) === 0) holderEntries.delete(entry);

		// holderEntries = excludeContractCreators(holderEntries);
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
