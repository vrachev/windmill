<script lang="ts">
	import SimpleEditor from '$lib/components/SimpleEditor.svelte'
	export let code: string | undefined
	export let value: any = undefined
	export let error = ''
	export let editor: SimpleEditor | undefined = undefined
	export let small = false

	$: tooBig = code && code?.length > 1000000
	function parseJson() {
		try {
			value = JSON.parse(code ?? '')
			error = ''
		} catch (e) {
			error = e.message
		}
	}
	$: code && parseJson()
</script>

{#if tooBig}
	<span class="text-gray-600">JSON to edit is too big</span>
{:else}
	<div class="flex flex-col w-full">
		<div class="border border-gray-300 w-full">
			<SimpleEditor
				{small}
				on:focus
				bind:this={editor}
				on:change
				autoHeight
				lang="json"
				bind:code
			/>
		</div>
		{#if error != ''}
			<span class="text-red-600 text-xs">{error}</span>
		{/if}
	</div>
{/if}
