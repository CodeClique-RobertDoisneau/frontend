import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MermaidBlock } from './mermaid-block';

describe('MermaidBlock', () => {
  let component: MermaidBlock;
  let fixture: ComponentFixture<MermaidBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MermaidBlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MermaidBlock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
