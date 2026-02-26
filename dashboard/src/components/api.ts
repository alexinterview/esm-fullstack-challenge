import { fetchUtils } from "react-admin";
import { API_BASE_URL } from "../utils/common";

export { API_BASE_URL };

export const httpClient = async (
  url: string,
  options: fetchUtils.Options = {},
) => {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const { json } = await fetchUtils.fetchJson(url, { ...options, headers });
  return json;
};
