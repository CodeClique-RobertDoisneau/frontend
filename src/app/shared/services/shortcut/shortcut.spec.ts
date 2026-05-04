import { TestBed } from '@angular/core/testing';

import { Shortcut } from './shortcut';

describe('Shortcut', () => {
  let service: Shortcut;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Shortcut);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
