import * as actionTypes from './action-types';
import { AIStoreState } from './types';

// @ts-ignore
const initialState: AIStoreState = window?.tryAuraAiProviderModels ?? {
	aiProviders: {},
	defaultProvider: '',
	defaultImageModel: '',
	defaultVideoModel: '',
};

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
				aiProviders: {
					...state.aiProviders,
					[ action.providerId ]: {
						...action.providerData,
						...( state.aiProviders[ action.providerId ] || {} ),
					},
				},
			};

		case actionTypes.ADD_MODEL:
			return {
				...state,
				aiProviders: {
					...state.aiProviders,
					[ action.providerId ]: {
						...( state.aiProviders[ action.providerId ] || {} ),
						[ action.modelId ]: action.modelData,
					},
				},
			};

		case actionTypes.UPDATE_MODEL:
			return {
				...state,
				aiProviders: {
					...state.aiProviders,
					[ action.providerId ]: {
						...( state.aiProviders[ action.providerId ] || {} ),
						[ action.modelId ]: {
							...( state.aiProviders[ action.providerId ]?.[ action.modelId ] ||
								{} ),
							...action.modelData,
						},
					},
				},
			};

		case actionTypes.UPDATE_CAPABILITY:
			return {
				...state,
				aiProviders: {
					...state.aiProviders,
					[ action.providerId ]: {
						...( state.aiProviders[ action.providerId ] || {} ),
						[ action.modelId ]: {
							...( state.aiProviders[ action.providerId ]?.[ action.modelId ] ||
								{} ),
							capabilities: {
								...( state.aiProviders[ action.providerId ]?.[
									action.modelId
								]?.capabilities || {} ),
								[ action.capabilityId ]: {
									...( state.aiProviders[ action.providerId ]?.[
										action.modelId
									]?.capabilities?.[ action.capabilityId ] || {} ),
									...action.capabilityData,
								},
							},
						},
					},
				},
			};

		case actionTypes.UPDATE_PARAMETER:
			return {
				...state,
				aiProviders: {
					...state.aiProviders,
					[ action.providerId ]: {
						...( state.aiProviders[ action.providerId ] || {} ),
						[ action.modelId ]: {
							...( state.aiProviders[ action.providerId ]?.[ action.modelId ] ||
								{} ),
							parameters: {
								...( state.aiProviders[ action.providerId ]?.[
									action.modelId
								]?.parameters || {} ),
								[ action.parameterId ]: {
									...( state.aiProviders[ action.providerId ]?.[
										action.modelId
									]?.parameters?.[ action.parameterId ] || {} ),
									...action.parameterData,
								},
							},
						},
					},
				},
			};

		case actionTypes.SET_DEFAULT_PROVIDER:
			return {
				...state,
				defaultProvider: action.providerId,
			};

		case actionTypes.SET_DEFAULT_IMAGE_MODEL:
			return {
				...state,
				defaultImageModel: action.modelId,
			};

		case actionTypes.SET_DEFAULT_VIDEO_MODEL:
			return {
				...state,
				defaultVideoModel: action.modelId,
			};

		default:
			return state;
	}
}
