import type Bottle from 'bottlejs';
import type { ConnectDecorator } from '../../container';
import { Overview } from '../Overview';

export function provideServices(bottle: Bottle, connect: ConnectDecorator) {
  bottle.serviceFactory('Overview', Overview, 'ShortUrlsTable', 'CreateShortUrl');
  bottle.decorator('Overview', connect(
    ['shortUrlsList', 'tagsList', 'mercureInfo', 'visitsOverview'],
    ['listShortUrls', 'createNewVisits', 'loadMercureInfo', 'loadVisitsOverview'],
  ));
}
