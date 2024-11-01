import { ShlinkApiClient } from '@shlinkio/shlink-js-sdk';
import { FetchHttpClient } from '@shlinkio/shlink-js-sdk/browser';
import type { FC } from 'react';
import { useCallback } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ShlinkWebComponent } from '../src';
import type { Settings } from '../src/settings';
import { ShlinkWebSettings } from '../src/settings';
import type { SemVer } from '../src/utils/helpers/version';
import type { ServerInfo } from './server-info/useServerInfo';
import { useServerInfo } from './server-info/useServerInfo';
import { isServerInfoSet } from './server-info/useServerInfo';
import { MainHeader } from './common/MainHeader';
import { fetchServers } from './servers/reducers/remoteServers';

export const App: FC = () => {
	const [httpClient, setHttpClient] = useState<FetchHttpClient>(new FetchHttpClient());
  const [serverInfo, updateServerInfo] = useServerInfo();
  const [serverVersion, setServerVersion] = useState<SemVer>();
  const onServerInfoChange = useCallback((newServerInfo: ServerInfo) => {
    updateServerInfo(newServerInfo);
    setServerVersion(undefined);
  }, [updateServerInfo]);

	// Fetch servers when the app starts and update the server info
	useEffect(() => {
		fetchServers(httpClient).then((servers) => {
			if (servers.length > 0) {
				onServerInfoChange(servers[0]);
			}
		});
	}, []);

  const apiClient = useMemo(
    () => 
			{
				return isServerInfoSet(serverInfo) ? new ShlinkApiClient(httpClient, serverInfo) : null
			},
    [serverInfo],
  );
  const [settings, setSettings] = useState<Settings>({});
  const routesPrefix = useMemo(
    () => (window.location.pathname.startsWith('/sub/route') ? '/sub/route' : undefined),
    [],
  );

  useEffect(() => {
    if (!serverVersion) {
      apiClient?.health().then((result) => setServerVersion(result.version as SemVer));
    }
  }, [apiClient, serverVersion]);

  return (
    <BrowserRouter>
      <header className="header fixed-top text-white d-flex justify-content-between">
				<MainHeader />
      </header>
      <div className="wrapper">
        <Routes>
          <Route
            path="/settings/*"
            element={(
              <div className="container pt-4">
                <ShlinkWebSettings
                  settings={settings}
                  updateSettings={setSettings}
                  defaultShortUrlsListOrdering={{}}
                />
              </div>
            )}
          />
					<Route 
            path={routesPrefix ? `${routesPrefix}*` : '*'}
            element={apiClient && serverVersion ? (
              <ShlinkWebComponent
                serverVersion={serverVersion}
                apiClient={apiClient}
                settings={settings}
                routesPrefix={routesPrefix}
              />
            ) : <div className="container pt-4">Not connected</div>}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};
