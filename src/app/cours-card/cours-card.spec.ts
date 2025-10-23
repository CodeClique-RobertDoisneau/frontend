import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursCard } from './cours-card';

describe('CoursCard', () => {
  let component: CoursCard;
  let fixture: ComponentFixture<CoursCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoursCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
