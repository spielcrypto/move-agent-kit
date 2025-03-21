import { Tool } from "langchain/tools"
import { type AgentRuntime, parseJson } from "../.."

export class AptosGetTokenDetailTool extends Tool {
	name = "aptos_token_details"
	description = `Get details about a specific token.

	This tool is used to retrieve detailed information about a token on the Aptos blockchain.
	
	IMPORTANT NOTICE: When a user requests a token that has both native and bridged versions (like USDC, USDT), 
	you MUST ask them to clarify which version they want (native or bridged) before proceeding.

	Popular tokens that can be queried include:

	Native (Original) Tokens:
	- APT: "0x1::aptos_coin::AptosCoin"
	- USDC: "0x2::usdc::USDC"
	- USDT: "0x2::usdt::USDT"
	- WETH: "0x2::weth::WETH"
	- WBTC: "0x2::wbtc::WBTC"

	Bridged/Wrapped Tokens:
	- lzUSDC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"
	- lzUSDT: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT"
	- lzWETH: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH"
	- lzWBTC: "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC"
	- whUSDC: "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T"
	- whUSDT: "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T"
	- whWBTC: "0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T"

	Liquid Staking Tokens:
	- amAPT: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt"
	- stAPT: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt"
	- thAPT: "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT"
	- sthAPT: "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::StakedThalaAPT"

	Protocol & Ecosystem Tokens:
	- BAPTMAN: "0xe9c6ae7a056ba49901fcc19ab3fcff0938f882cfd7f2cc5a72eea362d29f5b8f"
	- MOVE: "0x27fafcc4e39daac97556af8a803dbb52bcb03f0821898dc845ac54225b9793eb::move_coin::MoveCoin"
	- ZAAP: "0xdcfa079344261bfde45e7f6281df091743b8d3098bf9e26e1c0212fc5b070621::zaaptos_token::ZaaptosCoin"
	
	Inputs (input is a JSON string):
	mint: string, eg "0x1::aptos_coin::AptosCoin" (required)
	
	Examples:
	- "Get details for APT token"
	- "Show information about USDC"
	- "What are the details of WBTC?"

	MANDATORY RULE: You MUST ALWAYS fetch the token details from the blockchain. 
	Pretending to fetch the details or returning default values is a failure and unacceptable. 
	The actual token details must be retrieved from the blockchain.`

	constructor(private agent: AgentRuntime) {
		super()
	}

	protected async _call(input: string): Promise<string> {
		try {
			const parsedInput = parseJson(input)
			const mint = parsedInput.token || ""

			const tokenData = await this.agent.getTokenDetails(mint)

			return JSON.stringify({
				status: "success",
				tokenData,
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
