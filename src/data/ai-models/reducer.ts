import * as actionTypes from './action-types';
import { AIStoreState } from './types';

// @ts-ignore
const initialState: AIStoreState = window?.tryAuraAiProviderModels ?? {};

export default function reducer(
	state = initialState,
	action: any
): AIStoreState {
	switch ( action.type ) {
		case actionTypes.SET_PROVIDERS:
			return action.providers;

		case actionTypes.ADD_PROVIDER:
			return {
				...state,
				[ action.providerId ]: {
					...action.providerData,
					...( state[ action.providerId ] || {} ),
				},
			};

		case actionTypes.ADD_MODEL:
			return {
				...state,
				[ action.providerId ]: {
					...( state[ action.providerId ] || {} ),
					[ action.modelId ]: action.modelData,
				},
			};

		case actionTypes.UPDATE_MODEL:
			return {
				...state,
				[ action.providerId ]: {
					...( state[ action.providerId ] || {} ),
					[ action.modelId ]: {
						...( state[ action.providerId ]?.[ action.modelId ] || {} ),
						...action.modelData,
					},
				},
			};

		case actionTypes.UPDATE_CAPABILITY:
			return {
				...state,
				[ action.providerId ]: {
					...( state[ action.providerId ] || {} ),
					[ action.modelId ]: {
						...( state[ action.providerId ]?.[ action.modelId ] || {} ),
						capabilities: {
							...( state[ action.providerId ]?.[ action.modelId ]?.capabilities || {} ),
							[ action.capabilityId ]: {
								...( state[ action.providerId ]?.[ action.modelId ]?.capabilities?.[
									action.capabilityId
								] || {} ),
								...action.capabilityData,
							},
						},
					},
				},
			};

		case actionTypes.UPDATE_PARAMETER:
			return {
				...state,
				[ action.providerId ]: {
					...( state[ action.providerId ] || {} ),
					[ action.modelId ]: {
						...( state[ action.providerId ]?.[ action.modelId ] || {} ),
						parameters: {
							...( state[ action.providerId ]?.[ action.modelId ]?.parameters || {} ),
							[ action.parameterId ]: {
								...( state[ action.providerId ]?.[ action.modelId ]?.parameters?.[
									action.parameterId
								] || {} ),
								...action.parameterData,
							},
						},
					},
				},
			};

		default:
			return state;
	}
}
