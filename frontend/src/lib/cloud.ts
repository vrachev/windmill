import { BROWSER } from 'esm-env'
import { get } from 'svelte/store'
import { premiumStore, userStore, workspaceStore } from './stores'
import { getUserExt } from './user'
import { WorkspaceService } from './gen'

export function isCloudHosted(): boolean {
	return BROWSER && window.location.hostname == 'app.windmill.dev'
}

if (BROWSER) {
	workspaceStore.subscribe(async (workspace) => {
		if (workspace) {
			try {
				localStorage.setItem('workspace', String(workspace))
			} catch (e) {
				console.error('Could not persist workspace to local storage', e)
			}
			const user = await getUserExt(workspace)
			userStore.set(user)
			if (isCloudHosted() && user?.is_admin) {
				premiumStore.set(await WorkspaceService.getPremiumInfo({ workspace }))
			}
		} else {
			userStore.set(undefined)
		}
	})

	setInterval(async () => {
		try {
			const workspace = get(workspaceStore)
			const user = get(userStore)

			if (workspace && user) {
				userStore.set(await getUserExt(workspace))
				console.log('refreshed user')
			}
		} catch (e) {
			console.error('Could not refresh user', e)
		}
	}, 300000)
}
