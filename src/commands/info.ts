import { EIP721_BASIC_ABI, publicMainnetProvider } from '#constants';
import { BigNumber, Contract } from 'ethers';
import ora from 'ora';

async function wrappedContractCall(ccall: Promise<unknown>) {
	return ccall.catch(() => '');
}

export default async (address: string) => {
	const spinner = ora(`Grabbing info for "${address}"`).start();

	const contract = new Contract(address, EIP721_BASIC_ABI, publicMainnetProvider);
	const name = await wrappedContractCall(contract.name());
	const symbol = await wrappedContractCall(contract.symbol());
	const totalSupply = await wrappedContractCall(contract.totalSupply());

	spinner.succeed();

	return console.table([{ address, name, symbol, totalSupply: totalSupply ? BigNumber.from(totalSupply).toString() : '' }]);
};
