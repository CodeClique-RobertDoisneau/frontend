import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Persona } from './persona';

describe('Persona', () => {
  let component: Persona;
  let fixture: ComponentFixture<Persona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Persona]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Persona);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
