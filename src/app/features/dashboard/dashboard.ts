import { Component } from '@angular/core';
import { BarChart } from '@shared/components/bar-chart/bar-chart';
import { AreaChart } from '@shared/components/area-chart/area-chart';

@Component({
  selector: 'app-dashboard',
  imports: [BarChart, AreaChart],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

}