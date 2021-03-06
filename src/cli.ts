#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { URL } from 'url';

import cleanCmd from '#commands/clean';
import infoCmd from '#commands/info';
import mergeCmd from '#commands/merge';
import nftsCmd from '#commands/nfts';
import ntfxCmd from '#commands/nftx';
import raffleCmd from '#commands/raffle';

const owners = new Command();

const packageFile = new URL('../package.json', import.meta.url);
const packageJson = JSON.parse(await readFile(packageFile, 'utf-8'));

owners.name('owners').version(packageJson.version);

owners //
	.command('clean')
	.alias('c')
	.action(cleanCmd);

owners //
	.command('info')
	.alias('i')
	.argument('<address>', 'Contract address')
	.action(infoCmd);

owners //
	.command('nfts')
	.argument('<addressOrPreset>', 'Contract address or preset containing it')
	.argument('<block>', 'Block number')
	.action(nftsCmd);

owners //
	.command('nftx')
	.argument('<preset>', 'Vault preset')
	.argument('<block>', 'Block number')
	// @ts-expect-error Passing args.
	.action((...args) => ntfxCmd(false, ...args));

owners //
	.command('all')
	.alias('a')
	.argument('<preset>', 'uwulabs project preset')
	.argument('<block>', 'Block number')
	.action(async (...args) => {
		cleanCmd();
		// @ts-expect-error Passing args.
		await nftsCmd(...args);
		// @ts-expect-error Passing args.
		await ntfxCmd(true, ...args);
		mergeCmd();
	});

owners //
	.command('raffle')
	.alias('r')
	.argument('<block>', 'Block number')
	.argument('<rafflIds>', 'Raffle ids')
	.action(async (...args) => {
		cleanCmd();
		// @ts-expect-error Passing args.
		await raffleCmd(...args);
	});

owners.parse(process.argv);
