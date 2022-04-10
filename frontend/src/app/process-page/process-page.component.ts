import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { RegionOptions, RegionValidator } from '../utils/region-selector';


@Component({
  selector: 'app-process-page',
  templateUrl: './process-page.component.html',
  styleUrls: ['./process-page.component.css']
})
export class ProcessPageComponent implements OnInit {

  form_group = new FormGroup({
    // Use today as default value
    date: new FormControl(new Date()),
    region: new FormControl('', RegionValidator()),
  });
  filteredOptions!: Observable<string[]>;

  constructor() { }

  ngOnInit(): void {
    this.filteredOptions = this.form_group.get("region")!.valueChanges.pipe(
      startWith(''),
      map(value => this._Filter(value)),
    );
  }

  private _Filter(value: string): string[] {
    const filterValue = value.replace('臺', '台');
    return RegionOptions.filter(option => option.includes(filterValue));
  }
}
