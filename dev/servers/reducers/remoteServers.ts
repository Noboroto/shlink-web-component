import type { HttpClient } from '@shlinkio/shlink-js-sdk';
import pack from '../../../package.json';
import type { ServerData } from '../data';
import { hasServerData } from '../data';
import { ServerInfo } from '@shlinkio/shlink-js-sdk';

const responseToServersList = (data: any): ServerInfo[] => {
  return Array.isArray(data)
    ? data.filter(hasServerData).map((item: ServerData) => {
        return {
          baseUrl: item.url,
          apiKey: item.apiKey,
        } as ServerInfo;
      })
    : [];
};

export const fetchServers = async (httpClient: HttpClient) => {
  const resp = await httpClient.jsonRequest<any>(
    `${pack.homepage}/servers.json`
  );
  const result = responseToServersList(resp);
  return result;
};
