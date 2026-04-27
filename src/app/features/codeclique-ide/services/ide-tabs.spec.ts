import { TestBed } from '@angular/core/testing';
import { IdeTabs } from './ide-tabs';

describe('IdeTabs', () => {
  let service: IdeTabs;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IdeTabs]
    });
    service = TestBed.inject(IdeTabs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
