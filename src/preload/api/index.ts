// Consolidated Preload API modules - grouped by domain
export { invoke } from './invoke'

// User domain (accounts, users, friends)
export { accountApi, usersApi, friendsApi } from './user'

// Avatar domain (avatar, inventory, catalog)
export { avatarApi, inventoryApi, catalogApi } from './avatar'

// Games domain (games, groups)
export { gamesApi, groupsApi } from './games'

// System domain (system, pin, install, netlog)
export { systemApi, pinApi, installApi, netlogApi } from './system'

// Auth
export { authApi } from './auth'

// External APIs
export { rolimonsApi } from './rolimons'

// Transactions
export { transactionsApi } from './transactions'

// Updater
export { updaterApi } from './updater'
