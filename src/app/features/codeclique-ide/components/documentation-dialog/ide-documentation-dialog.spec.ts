import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeDocumentationDialog } from './ide-documentation-dialog';

describe('IdeDocumentationDialog', () => {
  let component: IdeDocumentationDialog;
  let fixture: ComponentFixture<IdeDocumentationDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IdeDocumentationDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdeDocumentationDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
