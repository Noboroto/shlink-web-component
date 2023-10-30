import { HIGHLIGHTED_COLOR, HIGHLIGHTED_COLOR_ALPHA, MAIN_COLOR, MAIN_COLOR_ALPHA } from '@shlinkio/shlink-frontend-kit';
import type { ChartData, ChartDataset, ChartOptions, InteractionItem } from 'chart.js';
import type { FC, MutableRefObject } from 'react';
import { useRef } from 'react';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { pointerOnHover, renderChartLabel } from '../../utils/helpers/charts';
import { prettify } from '../../utils/helpers/numbers';
import type { Stats } from '../types';
import { fillTheGaps } from '../utils';

export interface HorizontalBarChartProps {
  label: string;
  stats: Stats;
  max?: number;
  highlightedStats?: Stats;
  highlightedLabel?: string;
  onClick?: (label: string) => void;
}

const dropLabelIfHidden = (label: string) => (label.startsWith('hidden') ? '' : label);
const statsAreDefined = (stats: Stats | undefined): stats is Stats => !!stats && Object.keys(stats).length > 0;
const determineHeight = (labels: string[]): number | undefined => (labels.length > 20 ? labels.length * 10 : undefined);

const generateChartDatasets = (
  data: number[],
  highlightedData: number[],
  highlightedLabel?: string,
): ChartDataset[] => {
  const mainDataset: ChartDataset = {
    data,
    label: highlightedLabel ? 'Non-selected' : 'Visits',
    backgroundColor: MAIN_COLOR_ALPHA,
    borderColor: MAIN_COLOR,
    borderWidth: 2,
  };

  if (highlightedData.every((value) => value === 0)) {
    return [mainDataset];
  }

  const highlightedDataset: ChartDataset = {
    label: highlightedLabel ?? 'Selected',
    data: highlightedData,
    backgroundColor: HIGHLIGHTED_COLOR_ALPHA,
    borderColor: HIGHLIGHTED_COLOR,
    borderWidth: 2,
  };

  return [mainDataset, highlightedDataset];
};
const generateChartData = (
  labels: string[],
  data: number[],
  highlightedData: number[],
  highlightedLabel?: string,
): ChartData => ({
  labels,
  datasets: generateChartDatasets(data, highlightedData, highlightedLabel),
});

const chartElementAtEvent = (labels: string[], [chart]: InteractionItem[], onClick?: (label: string) => void) => {
  if (!onClick || !chart) {
    return;
  }

  onClick(labels[chart.index]);
};

export const HorizontalBarChart: FC<HorizontalBarChartProps> = (
  { label: ariaLabel, stats, highlightedStats, highlightedLabel, onClick, max },
) => {
  const labels = Object.keys(stats).map(dropLabelIfHidden);
  const data = Object.values(
    !statsAreDefined(highlightedStats) ? stats : Object.keys(highlightedStats).reduce((acc, highlightedKey) => {
      if (acc[highlightedKey]) {
        acc[highlightedKey] -= highlightedStats[highlightedKey];
      }

      return acc;
    }, { ...stats }),
  );
  const highlightedData = fillTheGaps(highlightedStats ?? {}, labels);
  const refWithStats = useRef(null);
  const refWithoutStats = useRef(null);

  const options: ChartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'y',
        // Do not show tooltip on items with empty label when in a bar chart
        filter: ({ label }) => label !== '',
        callbacks: { label: renderChartLabel },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        stacked: true,
        max,
        ticks: {
          precision: 0,
          callback: prettify,
        },
      },
      y: { stacked: true },
    },
    onHover: pointerOnHover,
    indexAxis: 'y',
  };
  const chartData = generateChartData(labels, data, highlightedData, highlightedLabel);
  const height = determineHeight(labels);

  // Provide a key based on the height, to force re-render every time the dataset changes (example, due to pagination)
  const renderChartComponent = (customKey: string, theRef: MutableRefObject<any>) => (
    <Bar
      aria-label={ariaLabel}
      ref={theRef}
      key={`${height}_${customKey}`}
      data={chartData as any}
      options={options as any}
      height={height}
      onClick={(e) => chartElementAtEvent(labels, getElementAtEvent(theRef.current, e), onClick)}
    />
  );

  return (
    <>
      {/* It's VERY IMPORTANT to render two different components here, as one has 1 dataset and the other has 2 */}
      {/* Using the same component causes a crash when switching from 1 to 2 datasets, and then back to 1 dataset */}
      {highlightedStats !== undefined && renderChartComponent('with_stats', refWithStats)}
      {highlightedStats === undefined && renderChartComponent('without_stats', refWithoutStats)}
    </>
  );
};
