import { providers } from 'ethers';
import 'dotenv/config';

export const PUBLIC_MAINNET_RPC_URL = `https://mainnet.infura.io/v3/${process.env.INFRA_KEY}`;
const MATIC_PUBLIC_MAINNET_RPC_URL = `https://polygon-mainnet.infura.io/v3/${process.env.INFRA_KEY}`;
export const publicMainnetProvider = new providers.JsonRpcProvider(PUBLIC_MAINNET_RPC_URL, 1);
export const maticPublicMainnetProvider = new providers.JsonRpcProvider(MATIC_PUBLIC_MAINNET_RPC_URL, 137);

export const TOKEN_BASE_ABI = [
	{
		inputs: [],
		name: 'name',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'symbol',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	}
];

export const EIP721_BASIC_ABI = [
	...TOKEN_BASE_ABI,
	{
		inputs: [],
		name: 'totalSupply',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	}
];

export const EIP1155_BASIC_ABI = [
	{
		inputs: [
			{
				internalType: 'uint256',
				name: 'id',
				type: 'uint256'
			}
		],
		name: 'exists',
		outputs: [
			{
				internalType: 'bool',
				name: '',
				type: 'bool'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: 'id',
				type: 'uint256'
			}
		],
		name: 'totalSupply',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	}
];

export const MATIC_STAMP = {
	name: 'Killer GF Stamps',
	token: 'STAMP',
	address: '0x004097675a293be8d538258ad1a6e561304048f1'
};
