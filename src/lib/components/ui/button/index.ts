import Root, {
	type ButtonProps,
	type ButtonSize,
	type ButtonVariant,
	buttonVariants
} from './button.svelte';

export {
	Root,
	type ButtonProps as Props,
	//
	Root as Button,
	buttonVariants,
	type ButtonProps,
	type ButtonSize,
	type ButtonVariant
};

// Re-export event/slot types for TypeScript consumers
export type ButtonEvents = import('./button.svelte').ButtonEvents;
export type ButtonSlots = import('./button.svelte').ButtonSlots;
