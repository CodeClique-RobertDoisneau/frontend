import { TestBed } from '@angular/core/testing';

import { Node } from './node';

describe('Node', () => {
  let service: Node;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Node);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
