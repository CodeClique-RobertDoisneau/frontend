import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeAboutDialog } from './ide-about-dialog';

describe('IdeAboutDialog', () => {
  let component: IdeAboutDialog;
  let fixture: ComponentFixture<IdeAboutDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeAboutDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeAboutDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
