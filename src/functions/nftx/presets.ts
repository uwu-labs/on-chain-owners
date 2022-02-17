export interface Vault {
	graph: string;
	nft: string;
	vToken: string;
	xToken: string;
	xTokenWETH: string;
	slp: string;
}

export const presets = new Map<string, Vault>([
	[
		'kgf',
		{
			graph: 'https://api.thegraph.com/subgraphs/name/quantumlyy/kgf-nftx-vault-subgraph-mainnet',
			nft: '0x6be69b2a9b153737887cfcdca7781ed1511c7e36',
			vToken: '0xf373a10d21cc4a9f84421c69ec2d9528b6162012',
			xToken: '0xa183014cef1dfc81cb3fd1dd2ce2ea1380fd983d',
			xTokenWETH: '0x1626b2cfd72dd0f8c12c3b70f4ff70fd09b63333',
			slp: '0xee464a12d73d816081d30b536c44d0cd91baa14e'
		}
	]
]);

export default presets;
