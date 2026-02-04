import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Outline } from './outline';

describe('Outline', () => {
  let component: Outline;
  let fixture: ComponentFixture<Outline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Outline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Outline);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
