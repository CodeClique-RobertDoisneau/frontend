import { TestBed } from '@angular/core/testing';

import { Pyodide } from './pyodide';

describe('Pyodide', () => {
  let service: Pyodide;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pyodide);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
