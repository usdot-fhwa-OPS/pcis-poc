import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store'
import { BerthConfigDomain } from './berth-config-domain'

// Define a type for the slice state
interface BerthConfigState {
  value: BerthConfigDomain[]
}

// Define the initial state using that type
const initialState: BerthConfigState = {
  value: [],
}

export const berthConfigSlice = createSlice({
  name: 'BerthConfigList',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    populate: (state, action: PayloadAction<BerthConfigDomain[]>) => {
      state.value = action.payload
    },
  },
})

export const { populate} = berthConfigSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const getBerthConfigList = (state: RootState) => state.berthConfigList.value

export default berthConfigSlice.reducer