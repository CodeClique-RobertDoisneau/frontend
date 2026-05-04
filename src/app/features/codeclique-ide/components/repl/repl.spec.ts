import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Repl } from './repl';

describe('Repl', () => {
  let component: Repl;
  let fixture: ComponentFixture<Repl>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Repl]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Repl);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
