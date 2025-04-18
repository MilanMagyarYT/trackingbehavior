import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  uid: string | null
  email: string | null
}

const initialState: AuthState = {
  status: 'unauthenticated',
  uid: null,
  email: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ uid: string; email: string }>) => {
      state.status = 'authenticated'
      state.uid = action.payload.uid
      state.email = action.payload.email
    },
    clearUser: (state) => {
      state.status = 'unauthenticated'
      state.uid = null
      state.email = null
    },
    setLoading: (state) => {
      state.status = 'loading'
    },
  },
})

export const { setUser, clearUser, setLoading } = authSlice.actions
export default authSlice.reducer
