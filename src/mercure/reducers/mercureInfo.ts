import { createSlice } from '@reduxjs/toolkit';
import type { ShlinkApiClient, ShlinkMercureInfo } from '../../api-contract';
import type { Settings } from '../../settings';
import { createAsyncThunk } from '../../utils/redux';

const REDUCER_PREFIX = 'shlink/mercure';

export interface MercureInfo extends Partial<ShlinkMercureInfo> {
  interval?: number;
  loading: boolean;
  error: boolean;
}

const initialState: MercureInfo = {
  loading: true,
  error: false,
};

export const mercureInfoReducerCreator = (
  apiClientFactory: () => ShlinkApiClient
) => {
  const loadMercureInfo = createAsyncThunk(
    `${REDUCER_PREFIX}/loadMercureInfo`,
    (settings?: Settings): Promise<ShlinkMercureInfo> => {
      if (
        settings &&
        settings.realTimeUpdates &&
        !settings.realTimeUpdates.enabled
      ) {
        throw new Error('Real time updates not enabled');
      }

      return apiClientFactory().mercureInfo();
    }
  );

  const { reducer } = createSlice({
    name: REDUCER_PREFIX,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(loadMercureInfo.pending, (state) => ({
        ...state,
        loading: true,
        error: false,
      }));
      builder.addCase(loadMercureInfo.rejected, (state) => ({
        ...state,
        loading: false,
        error: true,
      }));
      builder.addCase(loadMercureInfo.fulfilled, (_, { payload }) => ({
        ...payload,
        loading: false,
        error: false,
      }));
    },
  });

  return { loadMercureInfo, reducer };
};
