import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoursesCatalog } from './courses-catalog';

describe('CoursesCatalog', () => {
  let component: CoursesCatalog;
  let fixture: ComponentFixture<CoursesCatalog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoursesCatalog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CoursesCatalog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
