import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessPageComponent } from './process-page.component';

describe('ProcessPageComponent', () => {
  let component: ProcessPageComponent;
  let fixture: ComponentFixture<ProcessPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcessPageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
