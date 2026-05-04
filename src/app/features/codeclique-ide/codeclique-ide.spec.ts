import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CodeCliqueIde } from './codeclique-ide';

describe('CodeCliqueIde', () => {
  let component: CodeCliqueIde;
  let fixture: ComponentFixture<CodeCliqueIde>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodeCliqueIde]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CodeCliqueIde);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
