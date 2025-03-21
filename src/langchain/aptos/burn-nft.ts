import { Tool } from "langchain/tools"
import { type AgentRuntime, parseJson } from "../.."

export class AptosBurnNFTTool extends Tool {
	name = "aptos_burn_nft"
	description = `Burn (destroy) an NFT.

	This tool is used to burn (destroy) an NFT from the current user's account.
	
	Inputs (input is a JSON string):
	tokenId: string, eg "123" (required)
	collection: string, eg "0x1::collection::Collection" (required)
	
	Examples:
	- "Burn NFT #123"
	- "Destroy my NFT from collection 0x789"
	- "Remove NFT token 456"

	MANDATORY RULE: You MUST ALWAYS create the transaction for the user to sign once they have agreed to burn the NFT. 
	Pretending the transaction was created or skipping the transaction creation step is a failure and unacceptable. 
	The transaction must be created and presented to the user for signature before proceeding.`

	constructor(private agent: AgentRuntime) {
		super()
	}

	protected async _call(input: string): Promise<string> {
		try {
			const parsedInput = parseJson(input)

			const transfer = await this.agent.burnNFT(parsedInput.mint)

			return JSON.stringify({
				status: "success",
				transfer,
				nft: parsedInput.mint,
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
