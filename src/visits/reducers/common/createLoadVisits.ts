import { range, splitEvery } from '@shlinkio/data-manipulation';
import type { ShlinkVisitsParams } from '@shlinkio/shlink-js-sdk/api-contract';
import type {
  ShlinkPaginator,
  ShlinkVisit,
  ShlinkVisitsList,
} from '../../../api-contract';

const ITEMS_PER_PAGE = 5000;
const PARALLEL_STARTING_PAGE = 2;

export const DEFAULT_BATCH_SIZE = 4;

const isLastPage = ({ currentPage, pagesCount }: ShlinkPaginator): boolean =>
  currentPage >= pagesCount;
const calcProgress = (total: number, current: number): number =>
  (current * 100) / total;

export type VisitsLoader = (
  query: ShlinkVisitsParams
) => Promise<ShlinkVisitsList>;

export type LastVisitLoader = (
  excludeBots?: boolean
) => Promise<ShlinkVisit | undefined>;

export type Loaders = {
  visitsLoader: VisitsLoader;
  lastVisitLoader: LastVisitLoader;
};

type CreateLoadVisitsOptions = {
  /** Used to load visits for a specific page and number of items */
  visitsLoader: VisitsLoader;
  /** Invoked before loading a batch, can be used to stop loading more batches if it returns true */
  shouldCancel: () => boolean;
  /**
   * When a lot of batches need to be loaded, this callback is invoked with a value from 0 to 100, so that callers know
   * the actual progress.
   */
  progressChanged: (progress: number) => void;
  /** Max amount of parallel loadings in the same batch */
  batchSize: number;
};

export type NonPageVisitsParams = Omit<
  ShlinkVisitsParams,
  'page' | 'itemsPerPage'
>;

/**
 * Creates a callback used to load visits in batches, using provided visits loader as the source of visits, and
 * notifying progress changes when needed.
 */
export const createLoadVisits = ({
  visitsLoader,
  shouldCancel,
  progressChanged,
  batchSize,
}: CreateLoadVisitsOptions) => {
  const loadVisitsInParallel = async (
    query: NonPageVisitsParams,
    pages: number[]
  ): Promise<ShlinkVisit[]> =>
    Promise.all(
      pages.map(async (page) =>
        visitsLoader({ ...query, page, itemsPerPage: ITEMS_PER_PAGE }).then(
          ({ data }) => data
        )
      )
    ).then((result) => result.flat());

  const loadPagesBlocks = async (
    query: NonPageVisitsParams,
    pagesBlocks: number[][],
    index = 0
  ): Promise<ShlinkVisit[]> => {
    if (shouldCancel()) {
      return [];
    }

    const data = await loadVisitsInParallel(query, pagesBlocks[index]);

    progressChanged(calcProgress(pagesBlocks.length, index + 1));

    if (index < pagesBlocks.length - 1) {
      return data.concat(await loadPagesBlocks(query, pagesBlocks, index + 1));
    }

    return data;
  };

  return async (query: NonPageVisitsParams): Promise<ShlinkVisit[]> => {
    // Start by loading first page
    const { pagination, data } = await visitsLoader({
      ...query,
      page: 1,
      itemsPerPage: ITEMS_PER_PAGE,
    });
    // If there are no more pages, just return data
    if (isLastPage(pagination)) {
      return data;
    }

    // If there are more pages, calculate how many page blocks (AKA batches) are needed, and trigger them
    const pagesRange = range(PARALLEL_STARTING_PAGE, pagination.pagesCount + 1);
    const pagesBlocks = splitEvery(pagesRange, batchSize);

    if (pagination.pagesCount - 1 > batchSize) {
      progressChanged(0);
    }

    return data.concat(await loadPagesBlocks(query, pagesBlocks));
  };
};

export const lastVisitLoaderForLoader =
  (
    doIntervalFallback: boolean,
    loader: (params: ShlinkVisitsParams) => Promise<ShlinkVisitsList>
  ): LastVisitLoader =>
  async (excludeBots?: boolean) =>
    !doIntervalFallback
      ? Promise.resolve(undefined)
      : loader({ page: 1, itemsPerPage: 1, excludeBots }).then(
          ({ data }) => data[0]
        );
