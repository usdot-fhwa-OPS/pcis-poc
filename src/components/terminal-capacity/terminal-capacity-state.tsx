import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store'
import { TerminalCapacityDomain } from './terminal-capacity-domain'

// Define a type for the slice state
interface TerminalCapacityState {
  value: TerminalCapacityDomain[]
}

// Define the initial state using that type
const initialState: TerminalCapacityState = {
  value: [],
}

export const terminalCapacitySlice = createSlice({
  name: 'TerminalCapacityList',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    populate: (state, action: PayloadAction<TerminalCapacityDomain[]>) => {
      state.value = action.payload
    },
  },
})

export const { populate} = terminalCapacitySlice.actions

// Other code such as selectors can use the imported `RootState` type
export const getTerminalCapacityList = (state: RootState) => state.terminalCapacityList.value

export default terminalCapacitySlice.reducer