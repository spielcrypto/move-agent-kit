import { AccountAddress } from "@aptos-labs/ts-sdk"
import { Tool } from "langchain/tools"
import { type AgentRuntime, parseJson } from "../.."

export class AptosTransferNFTTool extends Tool {
	name = "aptos_transfer_nft"
	description = `Transfer an NFT to another address.

	This tool is used to transfer an NFT from the current user's account to another address.
	
	Inputs (input is a JSON string):
	tokenId: string, eg "123" (required)
	collection: string, eg "0x1::collection::Collection" (required)
	to: string, eg "0x123..." (required)
	
	Examples:
	- "Transfer NFT #123 to 0x456..."
	- "Send my NFT from collection 0x789 to 0xabc..."
	- "Move NFT token 456 to 0xdef..."
	`

	constructor(private agent: AgentRuntime) {
		super()
	}

	protected async _call(input: string): Promise<string> {
		try {
			const parsedInput = parseJson(input)

			const transfer = await this.agent.transferNFT(AccountAddress.from(parsedInput.to), parsedInput.mint)

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
