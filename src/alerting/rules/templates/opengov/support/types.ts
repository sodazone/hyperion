export type OpenGovPayload = {
	id: number;
	chainId: string;
	triggeredBy: {
		name: string;
		data: { track: number };
		blockHash: string;
		blockNumber: string;
	};
	info: {
		track: number;
		origin: {
			type: string;
			value: {
				type: string;
			};
		};
	};
	execution: {
		result: { success: boolean };
	};
	blockNumber: string;
	decodedCall: {
		module: string;
		method: string;
		args: any;
	};
	content: {
		title?: string;
		link?: string;
	};
};
