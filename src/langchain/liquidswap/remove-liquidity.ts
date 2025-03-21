import { convertAmountFromHumanReadableToOnChain } from "@aptos-labs/ts-sdk"
import { Tool } from "langchain/tools"
import { type AgentRuntime, parseJson } from "../.."
import { getTokenByTokenName } from "../../utils/get-pool-address-by-token-name"
import { parseFungibleAssetAddressToWrappedAssetAddress } from "../../utils/parse-fungible-asset-to-wrapped-asset"

export class LiquidSwapRemoveLiquidityTool extends Tool {
	name = "liquidswap_remove_liquidity"
	description = `this tool can be used to remove liquidity from liquidswap pools

	IMPORTANT: When a user requests to remove liquidity for a token that has both native and bridged versions (like USDC, USDT, etc.) 
	without explicitly specifying which version they want, you MUST ask them to clarify whether they want the 
	native version or a specific bridged version (LayerZero/Wormhole) before proceeding.

	Popular tokens that can be removed as liquidity include:

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
	- thAPT (Thala): "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::ThalaAPT"
	- sthAPT (Thala): "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6::staking::StakedThalaAPT"

	Protocol & Ecosystem Tokens:
	- CASH: "0x61ed8b048636516b4eaf4c74250fa4f9440d9c3e163d96aeb863fe658a4bdc67::CASH::CASH"
	- HAIR: "0x96baeee6d7a4a8cd712144d1225cfcb6c26d0c6fefd463bd77a878e4526c7411::hair_coin::HairCoin"
	- EDOG: "0x5e975e7f36f2658d4cf146142899c659464a3e0d90f0f4d5f8b2447173c06ef6::EDOG::EDOG"
	- GUI: "0xe4ccb6d39136469f376242c31b34d10515c8eaaa38092f804db8e08a8f53c5b2::assets_v1::EchoCoin002"
	- LOON: "0x268d4a7a2ad93274edf6116f9f20ad8455223a7ab5fc73154f687e7dbc3e3ec6::LOON::LOON"
	- CELL: "0x2ebb2ccac5e027a87fa0e2e5f656a3a4238d6a48d93ec9b610d570fc0aa0df12"
	- MGPT: "0x63be1898a424616367e19bbd881f456a78470e123e2770b5b5dcdceb61279c54::movegpt_token::MovegptCoin"
	- UPTOS: "0x4fbed3f8a3fd8a11081c8b6392152a8b0cb14d70d0414586f0c9b858fcd2d6a7::UPTOS::UPTOS"
	- CHEWY: "0xc26a8eda1c3ab69a157815183ddda88c89d6758ee491dd1647a70af2907ce074::coin::Chewy"
	- BAPTMAN: "0xe9c6ae7a056ba49901fcc19ab3fcff0938f882cfd7f2cc5a72eea362d29f5b8f"
	- MOOMOO: "0xc5fbbcc4637aeebb4e732767abee8a21f2b0776f73b73e16ce13e7d31d6700da::MOOMOO::MOOMOO"
	- VIBE: "0xeedba439a4ab8987a995cf5cfefebd713000b3365718a29dfbc36bc214445fb8"

	Note: If you don't have the address of a token, you can use these token names:
	usdt, zusdt, zusdc, apt, sthapt, mod, thl, wusdc, zweth, wweth, cake, stapt, abtc, stone, truapt, sbtc, cash, hair, edog, gui, loon, cell, mgpt, uptos, chewy, baptman, moomoo, vibe
	or whatever name the user has provided, you can use the token name to get the address of the token.

	Cannot remove liquidity for fungible tokens - only coin standard pools allowed. If user is trying to remove liquidity for fungible tokens, direct them to use Panora instead.
	Coin standard format: string::string::string

	Inputs (input is a JSON string):
	mintX: string, eg "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT" or "usdt (name of the token)" (required)
	mintY: string, eg (same as mintX) (required)
	lpAmount: number, eg 1 or 0.01 (required)

	Examples:
	- "Remove liquidity of 0.1 LP tokens from native APT - native USDC pool"
	- "I want to remove 5 LP tokens from HAIR - lzUSDT pool"
	- "Remove liquidity of 10 LP tokens from CASH - whUSDC pool"
	- "Remove 2 LP tokens from BAPTMAN - native APT pool"
	- "Remove liquidity of 1 LP token from native APT - lzWETH pool"
	- "Remove 100 LP tokens from native USDC - whUSDC pool"

	`

	constructor(private agent: AgentRuntime) {
		super()
	}

	protected async _call(input: string): Promise<string> {
		try {
			const parsedInput = parseJson(input)

			// Resolve token names to addresses
			let mintX = parsedInput.mintX
			const tokenX = getTokenByTokenName(mintX)
			if (tokenX) {
				mintX = tokenX.tokenAddress
			}

			let mintY = parsedInput.mintY
			const tokenY = getTokenByTokenName(mintY)
			if (tokenY) {
				mintY = tokenY.tokenAddress
			}

			const mintXDetail = await this.agent.getTokenDetails(mintX)
			const mintYDetail = await this.agent.getTokenDetails(mintY)

			const removeLiquidityTransactionHash = await this.agent.removeLiquidity(
				parseFungibleAssetAddressToWrappedAssetAddress(mintX),
				parseFungibleAssetAddressToWrappedAssetAddress(mintY),
				convertAmountFromHumanReadableToOnChain(parsedInput.lpAmount, 6),
				convertAmountFromHumanReadableToOnChain(parsedInput.minMintX || 0, mintXDetail.decimals),
				convertAmountFromHumanReadableToOnChain(parsedInput.minMintY || 0, mintYDetail.decimals)
			)

			return JSON.stringify({
				status: "success",
				removeLiquidityTransactionHash,
				token: [
					{
						mintX: mintXDetail.name,
						decimals: mintXDetail.decimals,
					},
					{
						mintY: mintYDetail.name,
						decimals: mintYDetail.decimals,
					},
				],
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
