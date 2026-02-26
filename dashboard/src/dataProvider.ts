import simpleRestProvider from "ra-data-simple-rest";
import { fetchUtils } from "react-admin";
import { API_BASE_URL } from "./utils/common";

const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetchUtils.fetchJson(url, { ...options, headers });
};

export const dataProvider = simpleRestProvider(API_BASE_URL, httpClient);
