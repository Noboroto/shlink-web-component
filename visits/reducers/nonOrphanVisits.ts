import { isBetween } from '../../../src/utils/helpers/date';
import type { ShlinkApiClient } from '../../api-contract';
import { createVisitsAsyncThunk, createVisitsReducer, lastVisitLoaderForLoader } from './common';
import type { VisitsInfo } from './types';

const REDUCER_PREFIX = 'shlink/orphanVisits';

const initialState: VisitsInfo = {
  visits: [],
  loading: false,
  loadingLarge: false,
  error: false,
  cancelLoad: false,
  progress: 0,
};

export const getNonOrphanVisits = (apiClient: ShlinkApiClient) => createVisitsAsyncThunk({
  typePrefix: `${REDUCER_PREFIX}/getNonOrphanVisits`,
  createLoaders: ({ query = {}, doIntervalFallback = false }) => {
    const { getNonOrphanVisits: shlinkGetNonOrphanVisits } = apiClient;
    const visitsLoader = async (page: number, itemsPerPage: number) =>
      shlinkGetNonOrphanVisits({ ...query, page, itemsPerPage });
    const lastVisitLoader = lastVisitLoaderForLoader(doIntervalFallback, shlinkGetNonOrphanVisits);

    return [visitsLoader, lastVisitLoader];
  },
  getExtraFulfilledPayload: ({ query = {} }) => ({ query }),
  shouldCancel: (getState) => getState().orphanVisits.cancelLoad,
});

export const nonOrphanVisitsReducerCreator = (
  asyncThunkCreator: ReturnType<typeof getNonOrphanVisits>,
) => createVisitsReducer({
  name: REDUCER_PREFIX,
  initialState,
  asyncThunkCreator,
  filterCreatedVisits: ({ query = {} }, createdVisits) => {
    const { startDate, endDate } = query;
    return createdVisits.filter(({ visit }) => isBetween(visit.date, startDate, endDate));
  },
});
