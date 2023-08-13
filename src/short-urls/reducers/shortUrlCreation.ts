import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { ProblemDetailsError, ShlinkApiClient } from '../../api-contract';
import { parseApiError } from '../../api-contract/utils';
import { createAsyncThunk } from '../../utils/redux';
import type { ShortUrl, ShortUrlData } from '../data';

const REDUCER_PREFIX = 'shlink/shortUrlCreation';

export type ShortUrlCreation = {
  saving: false;
  saved: false;
  error: false;
} | {
  saving: true;
  saved: false;
  error: false;
} | {
  saving: false;
  saved: false;
  error: true;
  errorData?: ProblemDetailsError;
} | {
  result: ShortUrl;
  saving: false;
  saved: true;
  error: false;
};

export type CreateShortUrlAction = PayloadAction<ShortUrl>;

const initialState: ShortUrlCreation = {
  saving: false,
  saved: false,
  error: false,
};

export const createShortUrl = (apiClientFactory: () => ShlinkApiClient) => createAsyncThunk(
  `${REDUCER_PREFIX}/createShortUrl`,
  (data: ShortUrlData): Promise<ShortUrl> => apiClientFactory().createShortUrl(data),
);

export const shortUrlCreationReducerCreator = (createShortUrlThunk: ReturnType<typeof createShortUrl>) => {
  const { reducer, actions } = createSlice({
    name: REDUCER_PREFIX,
    initialState: initialState as ShortUrlCreation, // Without this casting it infers type ShortUrlCreationWaiting
    reducers: {
      resetCreateShortUrl: () => initialState,
    },
    extraReducers: (builder) => {
      builder.addCase(createShortUrlThunk.pending, () => ({ saving: true, saved: false, error: false }));
      builder.addCase(
        createShortUrlThunk.rejected,
        (_, { error }) => ({ saving: false, saved: false, error: true, errorData: parseApiError(error) }),
      );
      builder.addCase(
        createShortUrlThunk.fulfilled,
        (_, { payload: result }) => ({ result, saving: false, saved: true, error: false }),
      );
    },
  });

  const { resetCreateShortUrl } = actions;

  return {
    reducer,
    resetCreateShortUrl,
  };
};
