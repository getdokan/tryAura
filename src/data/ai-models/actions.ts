import * as actionTypes from './action-types';
import { AIStoreState, Model, Capability, Parameter, Provider } from './types';

export function setProviders( providers: AIStoreState ) {
	return {
		type: actionTypes.SET_PROVIDERS,
		providers,
	};
}

export function addProvider( providerId: string, providerData: Provider = {} ) {
	return {
		type: actionTypes.ADD_PROVIDER,
		providerId,
		providerData,
	};
}

export function addModel( providerId: string, modelId: string, modelData: Model ) {
	return {
		type: actionTypes.ADD_MODEL,
		providerId,
		modelId,
		modelData,
	};
}

export function updateModel(
	providerId: string,
	modelId: string,
	modelData: Partial< Model >
) {
	return {
		type: actionTypes.UPDATE_MODEL,
		providerId,
		modelId,
		modelData,
	};
}

export function updateCapability(
	providerId: string,
	modelId: string,
	capabilityId: string,
	capabilityData: Partial< Capability >
) {
	return {
		type: actionTypes.UPDATE_CAPABILITY,
		providerId,
		modelId,
		capabilityId,
		capabilityData,
	};
}

export function updateParameter(
	providerId: string,
	modelId: string,
	parameterId: string,
	parameterData: Partial< Parameter >
) {
	return {
		type: actionTypes.UPDATE_PARAMETER,
		providerId,
		modelId,
		parameterId,
		parameterData,
	};
}
