import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreePythonIde } from './free-python-ide';

describe('FreePythonIde', () => {
  let component: FreePythonIde;
  let fixture: ComponentFixture<FreePythonIde>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreePythonIde]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreePythonIde);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
