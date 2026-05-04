import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeTabView } from './ide-tab-view';

describe('IdeTabView', () => {
  let component: IdeTabView;
  let fixture: ComponentFixture<IdeTabView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeTabView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeTabView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
