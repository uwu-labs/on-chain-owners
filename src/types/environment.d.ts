export {};

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			INFRA_KEY: string;
			EIP1155_SUBGRAPH_MATIC: string;
			EIP721_SUBGRAPH: string;
		}
	}
}
