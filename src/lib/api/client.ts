import axios from 'axios'

/** The one axios instance. Interceptors (auth, error mapping) are added in module FE-0. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})
