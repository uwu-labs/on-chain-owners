import { providers } from 'ethers';

export const PUBLIC_MAINNET_RPC_URL = 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
export const publicMainnetProvider = new providers.JsonRpcProvider(PUBLIC_MAINNET_RPC_URL, 1);

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
