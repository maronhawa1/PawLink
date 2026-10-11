import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthUser = {
  id: number;
  name: string | null;
  email: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

const TOKEN_KEY = "pawlink_token";
const USER_KEY = "pawlink_user";

// Restore the session saved in the browser, so a page refresh
// does not log the user out.
function loadInitialState(): AuthState {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);

    return {
      token,
      user: user ? (JSON.parse(user) as AuthUser) : null,
    };
  } catch {
    return { token: null, user: null };
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState,
  reducers: {
    loggedIn(
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    loggedOut(state) {
      state.token = null;
      state.user = null;
    },
  },
});

export const { loggedIn, loggedOut } = authSlice.actions;
export default authSlice.reducer;

export { TOKEN_KEY, USER_KEY };