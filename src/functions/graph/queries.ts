import { gql } from 'graphql-request';

export const TOKEN_BALANCES = (addr: string, block: number) => gql`
	{
		erc20Contract(id: "${addr}", block: { number: ${block} }) {
			balances(first: 999, where: {valueExact_gt: 0, account_gt: ""}, orderBy: valueExact, orderDirection: desc) {
				account {
					id
				}
				value
			}
		}
	}
`;
