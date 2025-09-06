import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

export const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  return axios.request(config).then((response: AxiosResponse<T>) => response.data)
}