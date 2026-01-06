import { AIStoreState, Provider, Model, Capability, Parameter } from './types';

export function getProviders( state: AIStoreState ): string[] {
	return Object.keys( state );
}

export function getProvider(
	state: AIStoreState,
	providerId: string
): Provider | undefined {
	return state[ providerId ];
}

export function getProviderModels(
	state: AIStoreState,
	providerId: string,
	filters?: {
		supported?: boolean;
		locked?: boolean;
		identity?: string;
	}
): Record< string, Model > | undefined {
	const models = state[ providerId ];

	if ( ! models || ! filters ) {
		return models;
	}

	const filteredModels: Record< string, Model > = {};

	for ( const [ modelId, model ] of Object.entries( models ) ) {
		let matches = true;

		if (
			filters.supported !== undefined &&
			model.supported !== filters.supported
		) {
			matches = false;
		}

		if (
			matches &&
			filters.locked !== undefined &&
			model.locked !== filters.locked
		) {
			matches = false;
		}

		if (
			matches &&
			filters.identity !== undefined &&
			model.identity !== filters.identity
		) {
			matches = false;
		}

		if ( matches ) {
			filteredModels[ modelId ] = model;
		}
	}

	return filteredModels;
}

export function getModel(
	state: AIStoreState,
	providerId: string,
	modelId: string
): Model | undefined {
	return state[ providerId ]?.[ modelId ];
}

export function getModelIdentity(
	state: AIStoreState,
	providerId: string,
	modelId: string
): string | undefined {
	return state[ providerId ]?.[ modelId ]?.identity;
}

export function getModelInputTypes(
	state: AIStoreState,
	providerId: string,
	modelId: string
): string[] | undefined {
	return state[ providerId ]?.[ modelId ]?.inputTypes;
}

export function getModelOutputTypes(
	state: AIStoreState,
	providerId: string,
	modelId: string
): string[] | undefined {
	return state[ providerId ]?.[ modelId ]?.outputTypes;
}

export function isModelSupported(
	state: AIStoreState,
	providerId: string,
	modelId: string
): boolean {
	return !! state[ providerId ]?.[ modelId ]?.supported;
}

export function isModelLocked(
	state: AIStoreState,
	providerId: string,
	modelId: string
): boolean {
	return !! state[ providerId ]?.[ modelId ]?.locked;
}

export function getCapabilities(
	state: AIStoreState,
	providerId: string,
	modelId: string
): Record< string, Capability > | undefined {
	return state[ providerId ]?.[ modelId ]?.capabilities;
}

export function getCapability(
	state: AIStoreState,
	providerId: string,
	modelId: string,
	capabilityId: string
): Capability | undefined {
	return state[ providerId ]?.[ modelId ]?.capabilities?.[ capabilityId ];
}

export function isCapabilitySupported(
	state: AIStoreState,
	providerId: string,
	modelId: string,
	capabilityId: string
): boolean {
	return !! state[ providerId ]?.[ modelId ]?.capabilities?.[ capabilityId ]
		?.supported;
}

export function isCapabilityLocked(
	state: AIStoreState,
	providerId: string,
	modelId: string,
	capabilityId: string
): boolean {
	return !! state[ providerId ]?.[ modelId ]?.capabilities?.[ capabilityId ]
		?.locked;
}

export function getParameters(
	state: AIStoreState,
	providerId: string,
	modelId: string
): Record< string, Parameter > | undefined {
	return state[ providerId ]?.[ modelId ]?.parameters;
}

export function getParameter(
	state: AIStoreState,
	providerId: string,
	modelId: string,
	parameterId: string
): Parameter | undefined {
	return state[ providerId ]?.[ modelId ]?.parameters?.[ parameterId ];
}

export function isParameterSupported(
	state: AIStoreState,
	providerId: string,
	modelId: string,
	parameterId: string
): boolean {
	return !! state[ providerId ]?.[ modelId ]?.parameters?.[ parameterId ]
		?.supported;
}

export function isParameterLocked(
	state: AIStoreState,
	providerId: string,
	modelId: string,
	parameterId: string
): boolean {
	return !! state[ providerId ]?.[ modelId ]?.parameters?.[ parameterId ]
		?.locked;
}
