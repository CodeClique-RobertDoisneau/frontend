import { Component } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartData } from 'chart.js';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

@Component({
  selector: 'app-bar-chart',
  imports: [BaseChartDirective, MatCard, MatCardContent, MatCardHeader, MatCardTitle, BaseChartDirective, MatCard, MatCardContent, MatCardHeader, MatCardTitle],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.scss',
})
export class BarChart {
  readonly chartData: ChartData<'bar'> = {
    labels: ['Mathématiques', 'Physique', 'NSI'],
    datasets: [
      {
        data: [15, 13, 17],
        label: 'Notes',
        backgroundColor: '#6366f1',
        borderRadius: 5,
      },
    ],
  };

  readonly chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 20,
      },
    },
  };
}
