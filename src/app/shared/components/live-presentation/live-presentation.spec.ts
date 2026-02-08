import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivePresentation } from './live-presentation';

describe('LivePresentation', () => {
  let component: LivePresentation;
  let fixture: ComponentFixture<LivePresentation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LivePresentation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LivePresentation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
