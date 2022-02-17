#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { URL } from 'url';

import infoCmd from '#commands/info';
import ntfxCmd from '#commands/nftx';

const owners = new Command();

const packageFile = new URL('../package.json', import.meta.url);
const packageJson = JSON.parse(await readFile(packageFile, 'utf-8'));

owners.name('owners').version(packageJson.version);

owners //
	.command('info')
	.alias('i')
	.argument('<address>', 'Contract address')
	.action(infoCmd);

owners //
	.command('nftx')
	.argument('<vault>', 'Vault preset')
	.argument('<block>', 'Block number')
	.action(ntfxCmd);

owners.parse(process.argv);
