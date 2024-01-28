import { fromPartial } from '@total-typescript/shoehorn';
import { addDays, formatISO, subDays } from 'date-fns';
import type { ShlinkApiClient, ShlinkVisit, ShlinkVisits } from '../../../src/api-contract';
import type { RootState } from '../../../src/container/store';
import { formatIsoDate } from '../../../src/utils/dates/helpers/date';
import type { DateInterval } from '../../../src/utils/dates/helpers/dateIntervals';
import { rangeOf } from '../../../src/utils/helpers';
import {
  getNonOrphanVisits as getNonOrphanVisitsCreator,
  nonOrphanVisitsReducerCreator,
} from '../../../src/visits/reducers/nonOrphanVisits';
import type { LoadVisits, VisitsInfo } from '../../../src/visits/reducers/types';
import { createNewVisits } from '../../../src/visits/reducers/visitCreation';
import { problemDetailsError } from '../../__mocks__/ProblemDetailsError.mock';

describe('nonOrphanVisitsReducer', () => {
  const now = new Date();
  const dateForVisit = (day: number) => `2020-01-1${day}T00:00:00Z`;
  const visitsMocks = rangeOf(2, (index) => fromPartial<ShlinkVisit>({ date: dateForVisit(index) }));
  const getNonOrphanVisitsCall = vi.fn();
  const buildShlinkApiClient = () => fromPartial<ShlinkApiClient>({ getNonOrphanVisits: getNonOrphanVisitsCall });
  const getNonOrphanVisits = getNonOrphanVisitsCreator(buildShlinkApiClient);
  const { reducer, cancelGetVisits: cancelGetNonOrphanVisits } = nonOrphanVisitsReducerCreator(getNonOrphanVisits);

  describe('reducer', () => {
    const buildState = (data: Partial<VisitsInfo>) => fromPartial<VisitsInfo>(data);

    it('returns loading when pending', () => {
      const { loading } = reducer(
        buildState({ loading: false }),
        getNonOrphanVisits.pending('', fromPartial({}), undefined),
      );
      expect(loading).toEqual(true);
    });

    it('returns cancelLoad when loading is cancelled', () => {
      const { cancelLoad } = reducer(buildState({ cancelLoad: false }), cancelGetNonOrphanVisits());
      expect(cancelLoad).toEqual(true);
    });

    it('stops loading and returns error when rejected', () => {
      const { loading, errorData } = reducer(
        buildState({ loading: true, errorData: null }),
        getNonOrphanVisits.rejected(problemDetailsError, '', fromPartial({}), undefined, undefined),
      );

      expect(loading).toEqual(false);
      expect(errorData).toEqual(problemDetailsError);
    });

    it('return visits when fulfilled', () => {
      const actionVisits: ShlinkVisit[] = [fromPartial({}), fromPartial({})];
      const { loading, errorData, visits } = reducer(
        buildState({ loading: true, errorData: null }),
        getNonOrphanVisits.fulfilled({ visits: actionVisits }, '', fromPartial({}), undefined),
      );

      expect(loading).toEqual(false);
      expect(errorData).toBeNull();
      expect(visits).toEqual(actionVisits);
    });

    it.each([
      [{}, visitsMocks.length + 2],
      [
        fromPartial<VisitsInfo>({
          params: {
            dateRange: { endDate: subDays(now, 1) },
          },
        }),
        visitsMocks.length,
      ],
      [
        fromPartial<VisitsInfo>({
          params: {
            dateRange: { startDate: addDays(now, 1) },
          },
        }),
        visitsMocks.length,
      ],
      [
        fromPartial<VisitsInfo>({
          params: {
            dateRange: {
              startDate: subDays(now, 5),
              endDate: subDays(now, 2),
            },
          },
        }),
        visitsMocks.length,
      ],
      [
        fromPartial<VisitsInfo>({
          params: {
            dateRange: {
              startDate: subDays(now, 5),
              endDate: addDays(now, 3),
            },
          },
        }),
        visitsMocks.length + 2,
      ],
    ])('prepends new visits when visits are created', (state, expectedVisits) => {
      const prevState = buildState({ ...state, visits: visitsMocks });
      const visit = fromPartial<ShlinkVisit>({ date: formatIsoDate(now) ?? undefined });

      const { visits } = reducer(prevState, createNewVisits([{ visit }, { visit }]));

      expect(visits).toHaveLength(expectedVisits);
    });

    it('returns new progress when progress is changed', () => {
      const { progress } = reducer(undefined, getNonOrphanVisits.progressChanged(85));
      expect(progress).toEqual(85);
    });

    it('returns fallbackInterval when falling back to another interval', () => {
      const fallbackInterval: DateInterval = 'last30Days';
      const state = reducer(undefined, getNonOrphanVisits.fallbackToInterval(fallbackInterval));

      expect(state).toEqual(expect.objectContaining({ fallbackInterval }));
    });
  });

  describe('getNonOrphanVisits', () => {
    const dispatchMock = vi.fn();
    const getState = () => fromPartial<RootState>({
      orphanVisits: { cancelLoad: false },
    });

    it('dispatches start and success when promise is resolved', async () => {
      const visits = visitsMocks.map((visit) => ({ ...visit, visitedUrl: '' }));
      const getVisitsParam = { params: {}, options: {} };

      getNonOrphanVisitsCall.mockResolvedValue({
        data: visits,
        pagination: {
          currentPage: 1,
          pagesCount: 1,
          totalItems: 1,
        },
      });

      await getNonOrphanVisits(getVisitsParam)(dispatchMock, getState, {});

      expect(dispatchMock).toHaveBeenCalledTimes(2);
      expect(dispatchMock).toHaveBeenLastCalledWith(expect.objectContaining({
        payload: { ...getVisitsParam, visits },
      }));
      expect(getNonOrphanVisitsCall).toHaveBeenCalledOnce();
    });

    it.each([
      [
        [fromPartial<ShlinkVisit>({ date: formatISO(subDays(now, 5)) })],
        getNonOrphanVisits.fallbackToInterval('last7Days'),
        3,
      ],
      [
        [fromPartial<ShlinkVisit>({ date: formatISO(subDays(now, 200)) })],
        getNonOrphanVisits.fallbackToInterval('last365Days'),
        3,
      ],
      [[], expect.objectContaining({ type: getNonOrphanVisits.fulfilled.toString() }), 2],
    ])('dispatches fallback interval when the list of visits is empty', async (
      lastVisits,
      expectedSecondDispatch,
      expectedAmountOfDispatches,
    ) => {
      const buildVisitsResult = (data: ShlinkVisit[] = []): ShlinkVisits => ({
        data,
        pagination: {
          currentPage: 1,
          pagesCount: 1,
          totalItems: 1,
        },
      });
      getNonOrphanVisitsCall
        .mockResolvedValueOnce(buildVisitsResult())
        .mockResolvedValueOnce(buildVisitsResult(lastVisits));

      await getNonOrphanVisits({ params: {}, options: { doIntervalFallback: true } })(dispatchMock, getState, {});

      expect(dispatchMock).toHaveBeenCalledTimes(expectedAmountOfDispatches);
      expect(dispatchMock).toHaveBeenNthCalledWith(2, expectedSecondDispatch);
      expect(getNonOrphanVisitsCall).toHaveBeenCalledTimes(2);
    });

    it.each([
      // Strict date range and loadPrevInterval: true -> prev visits are loaded
      {
        dateRange: { startDate: subDays(now, 1), endDate: addDays(now, 1) },
        loadPrevInterval: true,
        expectsPrevVisits: true,
      },
      // Undefined date range and loadPrevInterval: true -> prev visits are NOT loaded
      {
        dateRange: undefined,
        loadPrevInterval: true,
        expectsPrevVisits: false,
      },
      // Empty date range and loadPrevInterval: true -> prev visits are NOT loaded
      {
        dateRange: {},
        loadPrevInterval: true,
        expectsPrevVisits: false,
      },
      // Start date only and loadPrevInterval: true -> prev visits are NOT loaded
      {
        dateRange: { startDate: subDays(now, 2) },
        loadPrevInterval: true,
        expectsPrevVisits: true,
      },
      // End date only and loadPrevInterval: true -> prev visits are NOT loaded
      {
        dateRange: { endDate: now },
        loadPrevInterval: true,
        expectsPrevVisits: false,
      },
      // Strict date range and loadPrevInterval: false -> prev visits are NOT loaded
      {
        dateRange: { startDate: subDays(now, 1), endDate: addDays(now, 1) },
        loadPrevInterval: false,
        expectsPrevVisits: false,
      },
    ])('returns visits from prev interval when requested and possible', async (
      { dateRange, loadPrevInterval, expectsPrevVisits },
    ) => {
      const getVisitsParam: LoadVisits = {
        params: { dateRange },
        options: { loadPrevInterval },
      };
      const prevVisits = expectsPrevVisits ? visitsMocks.map(
        ({ date, ...rest }, index) => ({ ...rest, date: dateForVisit(index + 1 + visitsMocks.length) }),
      ) : undefined;

      getNonOrphanVisitsCall.mockResolvedValue({
        data: visitsMocks,
        pagination: {
          currentPage: 1,
          pagesCount: 1,
          totalItems: 1,
        },
      });

      await getNonOrphanVisits(getVisitsParam)(dispatchMock, getState, {});

      expect(dispatchMock).toHaveBeenCalledTimes(2);
      expect(dispatchMock).toHaveBeenLastCalledWith(expect.objectContaining({
        payload: { visits: visitsMocks, prevVisits, ...getVisitsParam },
      }));
      expect(getNonOrphanVisitsCall).toHaveBeenCalledTimes(expectsPrevVisits ? 2 : 1);
    });
  });
});
