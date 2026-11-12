import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ChartModule } from 'primeng/chart';

@Component({
  selector: 'app-chart-pie-demo',
  standalone: true,
  imports: [ChartModule],
  templateUrl: './chart-pie-demo.component.html',
  styleUrls: ['./chart-pie-demo.component.css'],
  changeDetection: ChangeDetectionStrategy.Default, // OR ensure input gets new ref
})
export class ChartPieDemoComponent implements OnInit {
  @Input() customLabel = '';
  @Input() pieChartParams!: {
    chartLabels: string[];
    chartColors: string[];
    chartData: any[];
  };
  @Input() chartType:
    | 'bar'
    | 'line'
    | 'scatter'
    | 'bubble'
    | 'pie'
    | 'doughnut'
    | 'polarArea'
    | 'radar'
    | undefined = 'doughnut';

  data: any;
  options: any;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.initChart();
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['pieChartParams']) {
      this.initChart(); // ✅ reuse the chart setup method
    }
  }
  initChart() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');

    // Extract values from chartData for the chart
    console.log(this.pieChartParams);
    this.data = {
      labels: this.pieChartParams.chartLabels,
      datasets: [
        {
          label: this.customLabel,
          data: this.pieChartParams?.chartData,
          // backgroundColor: this.pieChartParams?.chartColors,
          // hoverBackgroundColor: this.pieChartParams?.chartColors,
        },
      ],
    };

    this.options = {
      plugins: {
        legend: {
          labels: {
            // usePointStyle: true,
            color: textColor,
          },
        },
      },
    };

    this.cd.markForCheck();
  }
}
