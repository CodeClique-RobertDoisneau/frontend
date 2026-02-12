import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterCard } from './chapter-card';

describe('ChapterCard', () => {
  let component: ChapterCard;
  let fixture: ComponentFixture<ChapterCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChapterCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChapterCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
