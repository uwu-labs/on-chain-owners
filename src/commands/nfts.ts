import { EIP721_BASIC_ABI, publicMainnetProvider } from '#constants';
import { NFT_BALANCES } from '#functions/graph/queries';
import { Contract } from 'ethers';
import { mkdirSync, writeFileSync } from 'fs';
import { request } from 'graphql-request';
import ora from 'ora';

export default async (address: string, block: number) => {
	const spinner = ora(`Grabbing holdings of "${address}"`).start();
	const fail = (error: string) => {
		spinner.fail(error);
		process.exit(1);
	};

	const contract = new Contract(address, EIP721_BASIC_ABI, publicMainnetProvider);
	const totalSupply = await contract.totalSupply().catch(() => fail('"totalSupply" call failed'));

	const supplyBlocks = Math.ceil(totalSupply / 999);
	let holderEntries = new Map<string, number>();

	for (let i = 0; i < supplyBlocks; ++i) {
		const holdingData = await request(
			'https://api.thegraph.com/subgraphs/name/quantumlyy/eip721-subgraph-mainnet',
			NFT_BALANCES(address, Number(block), 999, i * 999)
		).catch((err) => fail(`holders query failed\n${err}`));

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
	const outputFile = new URL('./nftHolders.json', outputDirectory);
	writeFileSync(outputFile, JSON.stringify(Object.fromEntries([...holderEntries.entries()]), null, 2));

	spinner.succeed();
};
