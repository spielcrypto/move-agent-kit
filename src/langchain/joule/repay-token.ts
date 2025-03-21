import { convertAmountFromHumanReadableToOnChain } from "@aptos-labs/ts-sdk"
import { Tool } from "langchain/tools"
import { type AgentRuntime, parseJson } from "../.."

export class JouleRepayTokenTool extends Tool {
	name = "joule_repay_token"
	description = `this tool can be used to repay APT, tokens or fungible asset from a position

  if you want to repay APT, mint will be "0x1::aptos_coin::AptosCoin"
  if you want to repay token other than APT, you need to provide the mint of that specific token
  if you want to repay fungible asset, add "0x1::aptos_coin::AptosCoin" as mint and provide fungible asset address

  IMPORTANT: When a user requests a token that has both native and bridged versions (like USDC, USDT, etc.) 
  without explicitly specifying which version they want, the system will default to using the native version 
  (0x2::usdc::USDC for USDC and 0x2::usdt::USDT for USDT) unless explicitly specified otherwise.
  
  Popular tokens available in Joule Finance:
  Native (Original) Tokens:
  - APT (Native Aptos Coin): "0x1::aptos_coin::AptosCoin"
  - USDC (Native Circle USDC): "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"
  - USDt (Native Tether USD): "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b"
  - TruAPT (TruFin APT): "0xaef6a8c3182e076db72d64324617114cacf9a52f28325edc10b483f7f05da0e7"
  
  Bridged/Wrapped Tokens:
  - lzUSDC (LayerZero USDC): "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC"
  - lzUSDT (LayerZero USDT): "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT"
  - lzWETH (LayerZero WETH): "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WETH"
  - lzWBTC (LayerZero WBTC): "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::WBTC"
  - whUSDC (Wormhole USDC): "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T"
  - whUSDT (Wormhole USDT): "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T"
  - whWBTC (Wormhole WBTC): "0xae478ff7d83ed072dbc5e264250e67ef58f57c99d89b447efd8a0a2e8b2be76e::coin::T"
  
  Liquid Staking Tokens:
  - amAPT (Amnis Finance): "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::amapt_token::AmnisApt"
  - stAPT (Amnis Finance): "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::stapt_token::StakedApt"
  - sthAPT (Thala): "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::StakedThalaAPT"
  
  Protocol Tokens:
  - aBTC (Echo Protocol): "0x4e1854f6d332c9525e258fb6e66f84b6af8aba687bbcb832a24768c4e175feec::abtc::ABTC"
  - eAPT (Echo Protocol): "0xe3be68ed6c78b47be73c9c7f84d6f3a2fd8a568a2860b304446b0de36991956::coin::EchoCoinAPT"

  Examples:
  - "I want to repay 0.5 native APT to my Joule position"
  - "Repay 10 native USDC to position 1234"
  - "Pay back 2 lzWETH to Joule Finance"
  - "Repay 0.1 lzWBTC loan"
  - "Pay off 100 whUSDT on my Joule position"
  - "Repay 100 native USDC to the pool"
  - "Pay back 1 native APT to the lending pool"
  
  Inputs ( input is a JSON string ):
  amount: number, eg 1 or 0.01 (required)
  mint: string, eg "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT" (required)
  positionId: string, eg "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa" (required)
  fungibleAssetAddress: string, eg "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa" (optional)
  `

	constructor(private agent: AgentRuntime) {
		super()
	}

	protected async _call(input: string): Promise<string> {
		try {
			const parsedInput = parseJson(input)

			const mintDetail = await this.agent.getTokenDetails(parsedInput.mint)

			const repayTokenTransactionHash = await this.agent.repayToken(
				convertAmountFromHumanReadableToOnChain(parsedInput.amount, mintDetail.decimals || 8),
				parsedInput.mint,
				parsedInput.positionId
			)

			return JSON.stringify({
				status: "success",
				repayTokenTransactionHash,
				token: {
					name: mintDetail.name,
					decimals: mintDetail.decimals,
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
