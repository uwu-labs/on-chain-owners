import { gql } from 'graphql-request';

export const TOKEN_BALANCES = (addr: string, block: number) => gql`
	{
		erc20Contract(id: "${addr}", block: { number: ${block} }) {
			balances(first: 999, where: { valueExact_gt: 0, account_gt: "" }, orderBy: valueExact, orderDirection: desc) {
				account {
					id
				}
				value
			}
		}
	}
`;

export const NFT_BALANCES = (addr: string, block: number, pagingBy = 999, pagingFrom = 0, pagingTo: number = pagingFrom + pagingBy) => gql`
	{
		erc721Contract(id: "${addr}", block: { number: ${block} }) {
			tokens(first: ${pagingBy}, where: { identifier_gte: ${pagingFrom}, identifier_lt: ${pagingTo}, owner_gt: "" }) {
				owner {
					id
				}
			}
		}
	}
`;

export const CURR_BLOCK_NFT_BALANCES = (addr: string, pagingBy = 999, pagingFrom = 0, pagingTo: number = pagingFrom + pagingBy) => gql`
	{
		erc721Contract(id: "${addr}") {
			tokens(first: 999, where: { identifier_gte: ${pagingFrom}, identifier_lt: ${pagingTo}}) {
				identifier
				owner {
					id
				}
			}
		}
	}
`;
