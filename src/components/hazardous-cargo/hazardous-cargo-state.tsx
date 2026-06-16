import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../store'
import { HazardousCargoItem } from './hazardous-cargo-types'

// Define a type for the slice state
interface HazardousCargoState {
  value: HazardousCargoItem[]
}

// Define the initial state using that type
const initialState: HazardousCargoState = {
  value: [],
}

export const hazardousCargoSlice = createSlice({
  name: 'HazardousCargoList',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    // Use the PayloadAction type to declare the contents of `action.payload`
    populate: (state, action: PayloadAction<HazardousCargoItem[]>) => {
      state.value = action.payload
    },
  },
})

export const { populate} = hazardousCargoSlice.actions

// Other code such as selectors can use the imported `RootState` type
export const getHazardousCargoList = (state: RootState) => state.hazardousCargoList.value

export default hazardousCargoSlice.reducer