import { configureStore } from '@reduxjs/toolkit'
import { terminalCapacitySlice } from './components/terminal-capacity/terminal-capacity-state'
import { berthRequestSlice } from './components/berth-requests/berth-request-state'
import { berthConfigSlice } from './components/berth-requests/berth-config-state'
// ...

export const store = configureStore({
  reducer: {
    terminalCapacityList: terminalCapacitySlice.reducer,
    berthRequestList: berthRequestSlice.reducer,
    berthConfigList: berthConfigSlice.reducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch