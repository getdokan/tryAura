export interface Capability {
	supported: boolean;
	locked: boolean;
	[ key: string ]: any;
}

export interface ParameterValue {
	label: string;
	value: string | number | boolean;
	locked: boolean;
	[ key: string ]: any;
}

export interface Parameter {
	supported: boolean;
	locked: boolean;
	default: string | number | boolean;
	values: ParameterValue[];
	[ key: string ]: any;
}

export interface Model {
	identity: string;
	supported: boolean;
	locked: boolean;
	capabilities: Record< string, Capability >;
	parameters: Record< string, Parameter >;
	[ key: string ]: any;
}

export interface Provider {
	[ modelId: string ]: Model;
}

export interface AIStoreState {
	[ providerId: string ]: Provider;
}
