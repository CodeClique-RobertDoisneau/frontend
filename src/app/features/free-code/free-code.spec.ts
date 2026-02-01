import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeCode } from './free-code';

describe('FreeCode', () => {
  let component: FreeCode;
  let fixture: ComponentFixture<FreeCode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeCode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeCode);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
