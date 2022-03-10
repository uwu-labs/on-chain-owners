export interface Vault {
	graph: string;
	nft: string;
	vToken: string;
	xToken: string;
	xTokenWETH: string;
	slp: string;
	forcedExclusions: string[];
}

export const globalExclusions = ['0x7562c35464d90e6789fecae774a72cc9b0c4864a'].map((exclusion) => exclusion.toLowerCase());
export const presets = new Map<string, Vault>();

presets.set('kgf', {
	graph: 'https://api.thegraph.com/subgraphs/name/quantumlyy/kgf-nftx-vault-subgraph-mainnet',
	nft: '0x6be69b2a9b153737887cfcdca7781ed1511c7e36',
	vToken: '0xf373a10d21cc4a9f84421c69ec2d9528b6162012',
	xToken: '0xa183014cef1dfc81cb3fd1dd2ce2ea1380fd983d',
	xTokenWETH: '0x1626b2cfd72dd0f8c12c3b70f4ff70fd09b63333',
	slp: '0xee464a12d73d816081d30b536c44d0cd91baa14e',
	forcedExclusions: [...globalExclusions, '0x85295666273b3d1326f6965f19702a007b4cac07']
});

presets.set('uwu', {
	graph: 'https://api.thegraph.com/subgraphs/name/quantumlyy/uwu-nftx-vault-subgraph-mainnet',
	nft: '0xf75140376d246d8b1e5b8a48e3f00772468b3c0c',
	vToken: '0x5ce188b44266c7b4bbc67afa3d16b2eb24ed1065',
	xToken: '0x65879e73aecfc8a1cc7fe44a2ffb3392721e5652',
	xTokenWETH: '0x3d76622e4bb64c32ddc034776236137695d5b9fd',
	slp: '0xfd52305d58f612aad5f7e5e331c7a0d77e352ec3',
	forcedExclusions: [...globalExclusions, '0x354a70969f0b4a4c994403051a81c2ca45db3615']
});

export default presets;
