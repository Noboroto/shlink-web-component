import { FetchHttpClient } from '@shlinkio/shlink-js-sdk/browser';
import pack from '../../package.json';

const responseToauthorizedList = (data: any): String[] => {
	return Array.isArray(data) ? 
		data.map((item) => (item as string).split("@")[0])
		: [];
};

const fetchAuthorizedList = async () => {
	const sessionList = sessionStorage.getItem('authorizedList');
	if (sessionList) {
		return responseToauthorizedList(JSON.parse(sessionList));
	}
	else {
		const httpClient = new FetchHttpClient();
		const resp = await httpClient.jsonRequest<any>(
			`${pack.homepage}/authorized.json`
		);
		const result = responseToauthorizedList(resp);
		sessionStorage.setItem('authorizedList', JSON.stringify(result));
		return result;
	}
};

export const isAuthorized = (username: string) => {
	username = username.split('@')[0];
	return fetchAuthorizedList().then((authorizedList) => {
		return authorizedList.includes(username);
	});
};