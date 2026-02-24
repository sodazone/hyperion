export function validateAddress(address: string): boolean {
	const minLength = 10;
	const maxLength = 100;
	const forbiddenChars = /[^a-zA-Z0-9\s,.-]/;

	return (
		address.length < minLength ||
		address.length > maxLength ||
		forbiddenChars.test(address)
	);
}
