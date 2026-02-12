import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterShowcaseComponent } from './chapter-showcase';

describe('ChapterShowcase', () => {
  let component: ChapterShowcaseComponent;
  let fixture: ComponentFixture<ChapterShowcaseComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChapterShowcaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChapterShowcaseComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
