import { highRound } from '#functions';
import { TOKEN_BALANCES } from '#functions/graph/queries';
import presets from '#functions/presets';
import { mkdirSync, writeFileSync } from 'fs';
import { request } from 'graphql-request';
import ora from 'ora';

export default async (vault: string, block: string) => {
	const spinner = ora(`Grabbing vault "${vault}" owners`).start();
	const fail = (error: string) => {
		spinner.fail(error);
		process.exit(1);
	};

	if (!presets.has(vault)) fail('Vault not found');
	const { graph, vToken, xToken, slp, forcedExclusions } = presets.get(vault)!;

	const vTokenData = await request(graph, TOKEN_BALANCES(vToken, Number(block))).catch((err) => fail(`vToken query failed\n${err}`));

	const vTokenHolders = vTokenData?.erc20Contract?.balances || [];
	const vTokenEntries: any[] = vTokenHolders.map((h: any) => ({ holder: h.account.id, entries: highRound(Number(h.value)) }));

	const xTokenData = await request(graph, TOKEN_BALANCES(xToken, Number(block))).catch((err) => fail(`xToken query failed\n${err}`));

	const xTokenHolders = xTokenData?.erc20Contract?.balances || [];
	const xTokenEntries: any[] = xTokenHolders.map((h: any) => ({ holder: h.account.id, entries: highRound(Number(h.value)) }));

	let holderEntries = new Map<string, number>();

	for (const vTokenEntry of vTokenEntries) {
		holderEntries.set(vTokenEntry.holder, vTokenEntry.entries);
	}
	for (const xTokenEntry of xTokenEntries) {
		const existing = holderEntries.get(xTokenEntry.holder);

		if (existing) holderEntries.set(xTokenEntry.holder, existing + xTokenEntry.entries);
		else holderEntries.set(xTokenEntry.holder, xTokenEntry.entries);
	}

	for (const entry of [...holderEntries.keys()]) if (holderEntries.get(entry) === 0) holderEntries.delete(entry);

	holderEntries.delete(xToken);
	holderEntries.delete(vToken);
	holderEntries.delete(slp);
	for (const exclusion of forcedExclusions) holderEntries.delete(exclusion);

	holderEntries = new Map([...holderEntries.entries()].sort((a, b) => b[1] - a[1]));

	const outputDirectory = new URL('../../data/', import.meta.url);
	mkdirSync(outputDirectory, { recursive: true });
	const outputFile = new URL('./nftxHolders.json', outputDirectory);
	writeFileSync(outputFile, JSON.stringify(Object.fromEntries([...holderEntries.entries()]), null, 2));

	spinner.succeed();
};
