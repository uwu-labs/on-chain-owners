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

export const AIKO_WL_PARTNERS = [
	{
		name: 'UWU',
		address: '0xf75140376d246d8b1e5b8a48e3f00772468b3c0c'
	},
	{
		name: 'KGF',
		address: '0x6be69b2a9b153737887cfcdca7781ed1511c7e36'
	},
	{
		name: 'MURI',
		address: '0x4b61413d4392c806e6d0ff5ee91e6073c21d6430'
	},
	{
		name: 'KAIJU',
		address: '0x0c2e57efddba8c768147d1fdf9176a0a6ebd5d83'
	},
	{
		name: 'HAUS',
		address: '0x5be99338289909d6dbbc57bb791140ef85ccbcab'
	},
	{
		name: 'CAPSULE',
		address: '0xfcb1315c4273954f74cb16d5b663dbf479eec62e'
	},
	{
		name: 'LAMP',
		address: '0xa3b041ee6b56bccbc54a3048417d82fe67736f62'
	},
	{
		name: 'ASUNA',
		address: '0xaf615b61448691fc3e4c61ae4f015d6e77b6cca8'
	},
	{
		name: 'TUBBY',
		address: '0xca7ca7bcc765f77339be2d648ba53ce9c8a262bd'
	}
];

export const AIKO_PARTNERS = [
	{
		name: 'UWU_ORB',
		address: '0xf75140376d246d8b1e5b8a48e3f00772468b3c0c',
		1: 1,
		2: 5,
		3: 15
	},
	{
		name: 'KGF_ORB',
		address: '0x6be69b2a9b153737887cfcdca7781ed1511c7e36',
		1: 1,
		2: 5,
		3: 15
	},
	{
		name: 'MURI_ORB',
		address: '0x4b61413d4392c806e6d0ff5ee91e6073c21d6430',
		1: 1,
		2: 4,
		3: 12
	},
	{
		name: 'KAIJU_ORB',
		address: '0x0c2e57efddba8c768147d1fdf9176a0a6ebd5d83',
		1: 1,
		2: 3,
		3: 9
	},
	{
		name: 'HAUSORB',
		address: '0x5be99338289909d6dbbc57bb791140ef85ccbcab',
		1: 1,
		2: 3,
		3: 9
	},
	{
		name: 'CAPSULE ORB',
		address: '0xfcb1315c4273954f74cb16d5b663dbf479eec62e',
		1: 1,
		2: 3,
		3: 9
	},
	{
		name: 'LAMP ORB',
		address: '0xa3b041ee6b56bccbc54a3048417d82fe67736f62',
		1: 1,
		2: 8,
		3: 16
	},
	{
		name: 'ASUNA ORB',
		address: '0xaf615b61448691fc3e4c61ae4f015d6e77b6cca8',
		1: 1,
		2: 5,
		3: 15
	}
];
