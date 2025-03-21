import Plausible from 'plausible-tracker';

const plausible = Plausible({
	domain: 'pepelsbey.dev',
});

plausible.enableAutoPageviews();

export default plausible;
