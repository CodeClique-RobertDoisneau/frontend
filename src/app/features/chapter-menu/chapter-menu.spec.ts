import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterMenu } from './chapter-menu';

describe('ChapterMenu', () => {
  let component: ChapterMenu;
  let fixture: ComponentFixture<ChapterMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChapterMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChapterMenu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
