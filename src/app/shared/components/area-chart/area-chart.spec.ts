import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaChart } from './area-chart';

describe('AreaChart', () => {
  let component: AreaChart;
  let fixture: ComponentFixture<AreaChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AreaChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AreaChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
