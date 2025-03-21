import { Tool } from "langchain/tools"
import type { AgentRuntime } from "../.."

export class AriesCreateProfileTool extends Tool {
	name = "aries_create_profile"
	description = `This tool can be used to create a profile in Aries lending protocol.
	
	Examples:
	- "Create an Aries profile"
	- "Setup my Aries account"
	- "Initialize my profile on Aries protocol"
	
	Inputs (input is a JSON string):
	No inputs required for this tool.
    `

	constructor(private agent: AgentRuntime) {
		super()
	}

	protected async _call(): Promise<string> {
		try {
			const createProfileTransactionHash = await this.agent.createAriesProfile()

			return JSON.stringify({
				status: "success",
				createProfileTransactionHash,
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
