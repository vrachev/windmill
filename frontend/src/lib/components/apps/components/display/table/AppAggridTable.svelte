<script lang="ts">
	import 'ag-grid-community/styles/ag-grid.css'
	import 'ag-grid-community/styles/ag-theme-alpine.css'
	import AgGridSvelte from 'ag-grid-svelte/AgGridSvelte.svelte'

	import { isObject } from '$lib/utils'
	import { getContext } from 'svelte'
	import type { AppInput } from '../../../inputType'
	import type { AppViewerContext, RichConfigurations } from '../../../types'
	import RunnableWrapper from '../../helpers/RunnableWrapper.svelte'

	import { initConfig, initOutput } from '$lib/components/apps/editor/appUtils'
	import { components } from '$lib/components/apps/editor/component'
	import Alert from '$lib/components/common/alert/Alert.svelte'
	import ResolveConfig from '../../helpers/ResolveConfig.svelte'

	export let id: string
	export let componentInput: AppInput | undefined
	export let configuration: RichConfigurations
	export let initializing: boolean | undefined = undefined
	export let render: boolean

	let result: any[] | undefined = undefined

	const { worldStore, selectedComponent, componentControl } =
		getContext<AppViewerContext>('AppViewerContext')

	let resolvedConfig = initConfig(
		components['aggridcomponent'].initialData.configuration,
		configuration
	)

	let outputs = initOutput($worldStore, id, {
		selectedRowIndex: 0,
		selectedRow: {},
		selectedRows: [] as any[],
		result: [] as any[],
		loading: false,
		page: 0,
		newChange: { row: 0, column: '', value: undefined },
		ready: undefined as boolean | undefined
	})

	let selectedRowIndex = -1

	function toggleRow(row: any) {
		let rowIndex = row.rowIndex
		let data = { ...row.data }
		delete data['__index']
		if (selectedRowIndex !== rowIndex) {
			selectedRowIndex = rowIndex
			outputs?.selectedRow.set(data)
			outputs?.selectedRowIndex.set(rowIndex)
		}
	}

	function toggleRows(rows: any[]) {
		if (rows.length === 0) {
			outputs?.selectedRows.set([])
		}
		toggleRow(rows[0])
		outputs?.selectedRows.set(
			rows.map((x) => {
				let data = { ...x.data }
				delete data['__index']
				return data
			})
		)
	}

	$: outputs?.result?.set(value)

	let clientHeight
	let clientWidth

	function onCellValueChanged(event) {
		if (value) {
			let dataCell = event.newValue
			try {
				dataCell = JSON.parse(dataCell)
			} catch (e) {}
			outputs?.newChange?.set({
				row: event.node.rowIndex,
				column: event.colDef.field,
				value: dataCell
			})
			value[event.node.rowIndex][event.colDef.field] = dataCell
			let data = { ...value[event.node.rowIndex] }
			delete data['__index']
			outputs?.selectedRow?.set(data)
		}
	}

	$: value = (result ?? []).map((x, i) => ({ ...x, __index: i.toString() }))
</script>

{#each Object.keys(components['aggridcomponent'].initialData.configuration) as key (key)}
	<ResolveConfig
		{id}
		{key}
		bind:resolvedConfig={resolvedConfig[key]}
		configuration={configuration[key]}
	/>
{/each}

<RunnableWrapper {outputs} {render} {componentInput} {id} bind:initializing bind:result>
	{#if Array.isArray(result) && result.every(isObject)}
		{#if Array.isArray(resolvedConfig.columnDefs) && resolvedConfig.columnDefs.every(isObject)}
			<div
				class="border border-gray-300 shadow-sm divide-y divide-gray-300 flex flex-col h-full"
				bind:clientHeight
				bind:clientWidth
			>
				<div
					on:pointerdown|stopPropagation={() => {
						$selectedComponent = [id]
					}}
					style:height="{clientHeight}px"
					style:width="{clientWidth}px"
					class="ag-theme-alpine"
				>
					{#key resolvedConfig?.pagination}
						{#key resolvedConfig?.extraConfig}
							<AgGridSvelte
								bind:rowData={value}
								columnDefs={resolvedConfig?.columnDefs}
								pagination={resolvedConfig?.pagination}
								paginationAutoPageSize={resolvedConfig?.pagination}
								defaultColDef={{
									flex: resolvedConfig.flex ? 1 : 0,
									editable: resolvedConfig?.allEditable,
									onCellValueChanged
								}}
								onPaginationChanged={(event) => {
									outputs?.page.set(event.api.paginationGetCurrentPage())
								}}
								rowSelection={resolvedConfig?.multipleSelectable ? 'multiple' : 'single'}
								suppressRowDeselection={true}
								rowMultiSelectWithClick={resolvedConfig?.multipleSelectable
									? resolvedConfig.rowMultiselectWithClick
									: undefined}
								onSelectionChanged={(e) => {
									if (resolvedConfig?.multipleSelectable) {
										const rows = e.api.getSelectedNodes()
										if (rows != undefined) {
											toggleRows(rows)
										}
									} else {
										const row = e.api.getSelectedNodes()?.[0]
										if (row != undefined) {
											toggleRow(row)
										}
									}
								}}
								getRowId={(data) => data.data['__index']}
								{...resolvedConfig.extraConfig}
								onGridReady={(e) => {
									outputs?.ready.set(true)
									if (value.length > 0) {
										e.api.getRowNode('0')?.setSelected(true)
									}
									$componentControl[id] = {
										agGrid: { api: e.api, columnApi: e.columnApi },
										setSelectedIndex: (index) => {
											e.api.getRowNode(index.toString())?.setSelected(true)
										}
									}
								}}
							/>
						{/key}
					{/key}
				</div>
			</div>
		{:else if result != undefined}
			<Alert title="Parsing issues" type="error" size="xs">
				The columnDefs should be an array of objects, received:
				<pre class="overflow-auto">
				{JSON.stringify(resolvedConfig.columnDefs)}
			</pre>
			</Alert>
		{/if}
	{:else if result != undefined}
		<Alert title="Parsing issues" type="error" size="xs">
			The result should be an array of objects, received:
			<pre class="overflow-auto">
				{JSON.stringify(result)}
			</pre>
		</Alert>
	{/if}
</RunnableWrapper>
