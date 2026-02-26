import { AuthProvider, HttpError } from "react-admin";
import { API_BASE_URL } from "./utils/common";

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new HttpError(error.detail || "Unauthorized", response.status, {
        message: error.detail || "Invalid username or password",
      });
    }

    const { access_token } = await response.json();
    localStorage.setItem("token", access_token);

    // Fetch user info
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      // Transform to react-admin expected format
      const user = {
        id: userData.id,
        fullName: userData.full_name,
        email: userData.email,
        username: userData.username,
      };
      localStorage.setItem("user", JSON.stringify(user));
    }

    return Promise.resolve();
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return Promise.resolve();
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  checkAuth: () => {
    return localStorage.getItem("token") ? Promise.resolve() : Promise.reject();
  },

  getPermissions: () => {
    return Promise.resolve(undefined);
  },

  getIdentity: () => {
    const persistedUser = localStorage.getItem("user");
    const user = persistedUser ? JSON.parse(persistedUser) : null;
    return Promise.resolve(user);
  },
};

export default authProvider;
