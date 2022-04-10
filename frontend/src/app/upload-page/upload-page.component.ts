import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { UploadImageService } from '../upload-image.service';
import { RegionOptions, RegionValidator } from '../utils/region-selector';


@Component({
  selector: 'app-upload-page',
  templateUrl: './upload-page.component.html',
  styleUrls: ['./upload-page.component.css']
})
export class UploadPageComponent implements OnInit {

  file_list?: FileList = undefined;

  form_group = new FormGroup({
    // Use today as default value
    date: new FormControl(new Date()),
    source: new FormControl('', Validators.pattern('http(s)?://.+')),
    region: new FormControl('', RegionValidator()),
  });

  filteredOptions!: Observable<string[]>;

  constructor(private uploadImageService: UploadImageService) { }

  ngOnInit(): void {
    this.filteredOptions = this.form_group.get("region")!.valueChanges.pipe(
      startWith(''),
      map(value => this._Filter(value)),
    );
  }

  onFileChange(event: any) {
    this.file_list = event.target.files;
    console.info(this.file_list);
  }

  Upload() {
    if (this.file_list === undefined) return;
    if (!this.form_group.valid) return;

    console.info('The following files will be uploaded: ', this.file_list);
    console.info(this.form_group.value);

    this.uploadImageService.Upload(this.form_group.value, this.file_list).subscribe(
      (event: any) => {
        console.info(event);
      }
    );
  }

  private _Filter(value: string): string[] {
    const filterValue = value.replace('臺', '台');
    return RegionOptions.filter(option => option.includes(filterValue));
  }
}
