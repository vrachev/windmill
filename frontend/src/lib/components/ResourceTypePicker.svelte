<script lang="ts">
	import { createEventDispatcher } from 'svelte'

	import { ResourceService } from '$lib/gen'
	import { workspaceStore } from '$lib/stores'
	import IconedResourceType from './IconedResourceType.svelte'
	import { Button } from './common'

	let resources: string[] = []

	export let value: string | undefined

	export let notPickable = false
	export let nonePickable = false

	async function loadResources() {
		resources = await ResourceService.listResourceTypeNames({ workspace: $workspaceStore! })
	}

	const dispatch = createEventDispatcher()

	function onClick(resource: string | undefined) {
		value = resource
		dispatch('click', resource)
	}

	$: if ($workspaceStore) {
		loadResources()
	}
</script>

<div class="grid sm:grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-1 items-center mb-2">
	{#if nonePickable}
		{@const isPicked = value === undefined}
		<Button
			size="sm"
			variant="border"
			color={isPicked ? 'blue' : 'dark'}
			btnClasses={isPicked ? '!border-2 !bg-blue-50/75' : 'm-[1px]'}
			disabled={notPickable}
			on:click={() => onClick(undefined)}
		>
			None
		</Button>
	{/if}
	{#each resources as r}
		{@const isPicked = value === r}
		<Button
			size="sm"
			variant="border"
			color={isPicked ? 'blue' : 'dark'}
			btnClasses={isPicked ? '!border-2 !bg-blue-50/75' : 'm-[1px]'}
			disabled={notPickable}
			on:click={() => onClick(r)}
		>
			<IconedResourceType name={r} after={true} width="20px" height="20px" />
		</Button>
	{/each}
</div>
