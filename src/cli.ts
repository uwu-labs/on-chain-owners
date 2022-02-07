#!/usr/bin/env node

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { URL } from 'url';

import infoCmd from '#commands/info';

const owners = new Command();

const packageFile = new URL('../package.json', import.meta.url);
const packageJson = JSON.parse(await readFile(packageFile, 'utf-8'));

owners.name('owners').version(packageJson.version);

owners //
	.command('info')
	.description('generates a component/piece')
	.alias('i')
	.argument('<address>', 'Contract address')
	.action(infoCmd);

owners.parse(process.argv);
