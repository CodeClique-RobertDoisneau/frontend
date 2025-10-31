import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotebookViewerComponent } from './notebook-viewer-component';

describe('NotebookViewerComponent', () => {
  let component: NotebookViewerComponent;
  let fixture: ComponentFixture<NotebookViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotebookViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotebookViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
