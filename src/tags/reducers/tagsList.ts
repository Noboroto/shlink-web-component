import { createAction, createSlice } from '@reduxjs/toolkit';
import type { ProblemDetailsError, ShlinkApiClient } from '../../api-contract';
import { parseApiError } from '../../api-contract/utils';
import type { createShortUrl } from '../../short-urls/reducers/shortUrlCreation';
import { createAsyncThunk } from '../../utils/redux';
import { createNewVisits } from '../../visits/reducers/visitCreation';
import type { CreateVisit } from '../../visits/types';
import type { TagStats } from '../data';
import { tagDeleted } from './tagDelete';
import { tagEdited } from './tagEdit';

const REDUCER_PREFIX = 'shlink/tagsList';

type TagsStatsMap = Record<string, TagStats>;

export interface TagsList {
  tags: string[];
  filteredTags: string[];
  stats: TagsStatsMap;
  loading: boolean;
  error: boolean;
  errorData?: ProblemDetailsError;
}

interface ListTags {
  tags: string[];
  stats: TagsStatsMap;
}

const initialState: TagsList = {
  tags: [],
  filteredTags: [],
  stats: {},
  loading: false,
  error: false,
};

type TagIncreaseRecord = Record<string, { bots: number; nonBots: number }>;
type TagIncrease = [string, { bots: number; nonBots: number }];

const renameTag = (oldName: string, newName: string) => (tag: string) =>
  tag === oldName ? newName : tag;
const rejectTag = (tags: string[], tagToReject: string) =>
  tags.filter((tag) => tag !== tagToReject);
const increaseVisitsForTags = (tags: TagIncrease[], stats: TagsStatsMap) =>
  tags.reduce(
    (theStats, [tag, increase]) => {
      if (!theStats[tag]) {
        return theStats;
      }

      const { bots, nonBots } = increase;
      const tagStats = theStats[tag];

      return {
        ...theStats,
        [tag]: {
          ...tagStats,
          visitsSummary: tagStats.visitsSummary && {
            total: tagStats.visitsSummary.total + bots + nonBots,
            bots: tagStats.visitsSummary.bots + bots,
            nonBots: tagStats.visitsSummary.nonBots + nonBots,
          },
          visitsCount: (tagStats.visitsCount ?? 0) + bots + nonBots,
        },
      };
    },
    { ...stats }
  );
const calculateVisitsPerTag = (createdVisits: CreateVisit[]): TagIncrease[] =>
  Object.entries(
    createdVisits.reduce<TagIncreaseRecord>((acc, { shortUrl, visit }) => {
      shortUrl?.tags.forEach((tag) => {
        if (!acc[tag]) {
          acc[tag] = { bots: 0, nonBots: 0 };
        }

        if (visit.potentialBot) {
          acc[tag].bots += 1;
        } else {
          acc[tag].nonBots += 1;
        }
      });

      return acc;
    }, {})
  );

export const listTags = (apiClientFactory: () => ShlinkApiClient) =>
  createAsyncThunk(
    `${REDUCER_PREFIX}/listTags`,
    async (): Promise<ListTags> => {
      const { data: stats } = await apiClientFactory().tagsStats();
      const processedStats = stats.reduce<TagsStatsMap>(
        (acc, { tag, ...rest }) => {
          acc[tag] = rest;
          return acc;
        },
        {}
      );
      const tags = Object.keys(processedStats);

      return { tags, stats: processedStats };
    }
  );

export const filterTags = createAction<string>(`${REDUCER_PREFIX}/filterTags`);

export const tagsListReducerCreator = (
  listTagsThunk: ReturnType<typeof listTags>,
  createShortUrlThunk: ReturnType<typeof createShortUrl>
) =>
  createSlice({
    name: REDUCER_PREFIX,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder.addCase(filterTags, (state, { payload: searchTerm }) => ({
        ...state,
        filteredTags: state.tags.filter((tag) =>
          tag.toLowerCase().match(searchTerm.toLowerCase())
        ),
      }));

      builder.addCase(listTagsThunk.pending, (state) => ({
        ...state,
        loading: true,
        error: false,
      }));
      builder.addCase(listTagsThunk.rejected, (_, { error }) => ({
        ...initialState,
        error: true,
        errorData: parseApiError(error),
      }));
      builder.addCase(listTagsThunk.fulfilled, (_, { payload }) => ({
        ...initialState,
        stats: payload.stats,
        tags: payload.tags,
        filteredTags: payload.tags,
      }));

      builder.addCase(
        tagDeleted,
        ({ tags, filteredTags, ...rest }, { payload: tag }) => ({
          ...rest,
          tags: rejectTag(tags, tag),
          filteredTags: rejectTag(filteredTags, tag),
        })
      );
      builder.addCase(
        tagEdited,
        ({ tags, filteredTags, stats, ...rest }, { payload }) => ({
          ...rest,
          stats: {
            ...stats,
            [payload.newName]: stats[payload.oldName],
          },
          tags: tags.map(renameTag(payload.oldName, payload.newName)).sort(),
          filteredTags: filteredTags
            .map(renameTag(payload.oldName, payload.newName))
            .sort(),
        })
      );
      builder.addCase(createNewVisits, (state, { payload }) => ({
        ...state,
        stats: increaseVisitsForTags(
          calculateVisitsPerTag(payload.createdVisits),
          state.stats
        ),
      }));

      builder.addCase(
        createShortUrlThunk.fulfilled,
        ({ tags: stateTags, ...rest }, { payload }) => ({
          ...rest,
          tags: stateTags.concat(
            payload.tags.filter((tag: string) => !stateTags.includes(tag))
          ), // More performant than [ ...new Set(...) ]
        })
      );
    },
  });
