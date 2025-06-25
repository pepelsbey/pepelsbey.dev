import { propertiesOrder } from './stylelint.order.js';

export default {
	plugins: ['stylelint-order'],
	rules: {
		'order/order': [
			[
				'custom-properties',
				'declarations',
				'rules',
			],
			{
				severity: 'warning'
			},
		],
		'order/properties-order': [
			propertiesOrder,
			{
				unspecified: 'bottom',
				severity: 'warning',
			},
		],
	},
};
