import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoBlock } from './video-block';

describe('VideoBlock', () => {
  let component: VideoBlock;
  let fixture: ComponentFixture<VideoBlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoBlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoBlock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
