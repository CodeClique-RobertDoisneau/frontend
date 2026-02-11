import { TestBed } from '@angular/core/testing';

import { Theming } from './theming';

describe('Theming', () => {
  let service: Theming;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Theming);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
