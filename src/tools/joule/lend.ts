import {
	AccountAddress,
	InputGenerateTransactionPayloadData,
	MoveStructId,
} from "@aptos-labs/ts-sdk";
import { AgentRuntime } from "../../agent";

/**
 * Lend APT, tokens or fungible asset to a position
 * @param agent MoveAgentKit instance
 * @param amount Amount to mint
 * @param mint The Move struct ID of the token to lend
 * @param positionId The position ID to lend to
 * @param newPosition Whether to create a new position or not
 * @param fungibleAssetAddress The address of the fungible asset if the token is fungible (optional)
 * @returns Transaction signature and position ID
 * @example
 * ```ts
 * const transactionHash = await lendToken(agent, amount, APTOS_COIN, positionId, false); // For APT
 * const otherTransactionHash = await lendToken(agent, amount, OTHER_TOKEN, positionId, false); // For another token
 * const fungibleAssetTransactionHash = await lendToken(agent, amount, APTOS_COIN, positionId, false, fungibleAssetAddress); // For fungible asset
 */
export async function lendToken(
	agent: AgentRuntime,
	amount: number,
	mint: MoveStructId,
	positionId: string,
	newPosition: boolean,
	fungibleAsset: boolean,
): Promise<{ hash: string; positionId: string }> {
	let DEFAULT_FUNCTIONAL_ARGS = [positionId, amount, newPosition];

	let COIN_STANDARD_DATA: InputGenerateTransactionPayloadData = {
		function: `0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::lend`,
		typeArguments: [mint.toString()],
		functionArguments: DEFAULT_FUNCTIONAL_ARGS,
	};

	let FUNGIBLE_ASSET_DATA: InputGenerateTransactionPayloadData = {
		function: `0x2fe576faa841347a9b1b32c869685deb75a15e3f62dfe37cbd6d52cc403a16f6::pool::lend_fa`,
		functionArguments: [
			positionId,
			mint.toString(),
			newPosition,
			amount,
		],
	};

	try {
		const transaction = await agent.aptos.transaction.build.simple({
			sender: agent.account.getAddress(),
			data: fungibleAsset
				? FUNGIBLE_ASSET_DATA
				: COIN_STANDARD_DATA,
		});

		const committedTransactionHash =
			await agent.account.sendTransaction(transaction);

		const signedTransaction = await agent.aptos.waitForTransaction({
			transactionHash: committedTransactionHash,
		});

		// check transaction receipt

		if (!signedTransaction.success) {
			console.error(signedTransaction, "Token mint failed");
			throw new Error("Token mint failed");
		}

		return {
			hash: signedTransaction.hash,
			// @ts-ignore
			positionId: signedTransaction.events[0].data.position_id,
		};
	} catch (error: any) {
		throw new Error(`Token mint failed: ${error.message}`);
	}
}
