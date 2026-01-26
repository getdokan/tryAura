export const hasPro = () => {
	// @ts-ignore
	const hasPro = window?.tryAura?.hasPro;

	if (
		hasPro &&
		( hasPro === true ||
			hasPro === 'true' ||
			hasPro === '1' ||
			hasPro === 1 ||
			hasPro === 'yes' )
	) {
		return true;
	}

	return false;
};

export const getUpgradeToProUrl = () => {
	// @ts-ignore
	const upgradeToProUrl = window?.tryAura?.upgradeToProUrl;

	return upgradeToProUrl ?? '';
};
