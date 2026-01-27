import { spawn } from "bun";

export async function updateData({
	scriptPath,
	env,
}: {
	scriptPath: string;
	env?: Record<string, string | undefined>;
}) {
	const proc = spawn({
		cmd: ["bash", scriptPath],
		env,
		stdout: "inherit",
		stderr: "inherit",
	});

	const code = await proc.exited;

	if (code === 10) return false;
	if (code !== 0) {
		throw new Error(`update failed (exit ${code})`);
	}

	return true;
}
