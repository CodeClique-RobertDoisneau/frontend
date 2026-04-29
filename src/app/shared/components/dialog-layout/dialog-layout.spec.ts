import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogLayout } from './dialog-layout';

describe('DialogLayout', () => {
  let component: DialogLayout;
  let fixture: ComponentFixture<DialogLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
