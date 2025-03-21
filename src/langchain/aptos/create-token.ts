import { Tool } from "langchain/tools"
import { type AgentRuntime, parseJson } from "../.."

export class AptosCreateTokenTool extends Tool {
	name = "aptos_create_token"
	description = `Create a new token.

	This tool is used to create a new token on the Aptos blockchain.
	
	Inputs (input is a JSON string):
	name: string, eg "My Token" (required)
	symbol: string, eg "MTK" (required)
	decimals: number, eg 8 (required)
	initialSupply: string, eg "100000000" (required)
	
	Examples:
	- "Create a new token called MyToken with symbol MTK"
	- "Generate a new token with 8 decimals and 1 million supply"
	- "Create a new token with symbol ABC and 1000 initial supply"

	MANDATORY RULE: You MUST ALWAYS create the transaction for the user to sign once they have agreed to create the token. 
	Pretending the transaction was created or skipping the transaction creation step is a failure and unacceptable. 
	The transaction must be created and presented to the user for signature before proceeding.`

	constructor(private agent: AgentRuntime) {
		super()
	}

	protected async _call(input: string): Promise<string> {
		try {
			const parsedInput = parseJson(input)

			const createTokenTransactionHash = await this.agent.createToken(
				parsedInput.name,
				parsedInput.symbol,
				parsedInput.iconURI,
				parsedInput.projectURI
			)

			return JSON.stringify({
				status: "success",
				createTokenTransactionHash,
				token: {
					name: parsedInput.name,
					decimals: 8,
				},
			})
		} catch (error: any) {
			return JSON.stringify({
				status: "error",
				message: error.message,
				code: error.code || "UNKNOWN_ERROR",
			})
		}
	}
}
