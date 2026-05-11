import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store'
import { BerthRequestDomain } from './berth-request-domain'

// Define a type for the slice state
interface BerthRequestState {
  value: BerthRequestDomain[]
}

// Define the initial state using that type
const initialState: BerthRequestState = {
  value: [],
}

export const berthRequestSlice = createSlice({
  name: 'BerthRequestList',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    populate: (state, action: PayloadAction<BerthRequestDomain[]>) => {
      state.value = action.payload
    },
  },
})

export const { populate} = berthRequestSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const getBerthRequestList = (state: RootState) => state.berthRequestList.value

export default berthRequestSlice.reducer