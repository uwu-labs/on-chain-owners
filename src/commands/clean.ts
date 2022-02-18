import { rmSync } from 'fs';
import ora from 'ora';
import { fileURLToPath } from 'url';

export default () => {
	const spinner = ora('Cleaning output directory').start();

	const outputDirectory = new URL('../../data/', import.meta.url);
	rmSync(fileURLToPath(outputDirectory), { recursive: true, force: true });

	spinner.succeed();
};
