import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { ChartConfiguration, ChartData } from 'chart.js';
import { MatDivider } from '@angular/material/divider';
import { MatList, MatListItem, MatListItemIcon } from '@angular/material/list';
import { DecimalPipe } from '@angular/common';

type SummaryItem = {
  name: string;
  value: number;
  color: string;
};

@Component({
  selector: 'app-area-chart',
  templateUrl: './area-chart.html',
  styleUrl: './area-chart.scss',
  imports: [BaseChartDirective, MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatDivider, MatList, MatListItem, MatListItemIcon, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaChart {
  chartType = 'line' as const;

  chartData: ChartData<'line', number[], string> = {
    labels: ['Sept', 'Oct', 'Nov', 'Déc', 'Janv', 'Févr'],
    datasets: [
      {
        data: [44, 121, 135, 155, 227, 324],
        label: 'Mathématiques',
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        data: [20, 30, 45, 60, 120, 150],
        label: 'Physique',
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        data: [62, 80, 90, 150, 170, 175],
        label: 'NSI',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        max: 400,
      },
    },
  };

  get summary(): SummaryItem[] {
    return this.chartData.datasets.map(dataset => ({
      name: dataset.label ?? '',
      value: dataset.data[dataset.data.length - 1], // Last note
      color: dataset.borderColor?.toString() ?? '',
    }));
  }
}
