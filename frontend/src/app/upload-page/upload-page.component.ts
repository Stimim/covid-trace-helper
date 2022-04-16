import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { UploadResult, UploadImageService } from '../upload-image.service';
import { RegionOptions, RegionValidator } from '../utils/region-selector';


@Component({
  selector: 'app-upload-page',
  templateUrl: './upload-page.component.html',
  styleUrls: ['./upload-page.component.css']
})
export class UploadPageComponent implements OnInit {

  readonly regionOptions = RegionOptions;

  uploading = false;
  upload_results: UploadResult[] = [];

  file_list?: FileList = undefined;
  form_group = new FormGroup({
    // Use today as default value
    date: new FormControl(new Date()),
    source: new FormControl('', Validators.pattern('http(s)?://.+')),
    region: new FormControl('', RegionValidator()),
  });

  constructor(private uploadImageService: UploadImageService) { }

  ngOnInit(): void { }

  onFileChange(event: any) {
    this.file_list = event.target.files;
    console.info(this.file_list);
  }

  Upload() {
    if (this.file_list === undefined) return;
    if (!this.form_group.valid) return;

    console.info('The following files will be uploaded: ', this.file_list);
    console.info(this.form_group.value);

    this.uploading = true;
    this.uploadImageService.Upload(this.form_group.value, this.file_list).subscribe(
      (response: any) => {
        console.info('Upload Image Result:', response);
        this.uploading = false;
        if (response.results) {
          this.upload_results.push(...response.results);
        } else if (response.error) {
          this.upload_results.push({name: '', error: response.error});
        }
      },
      (error: any) => {
        console.info('Upload Image Failed:', error);
        this.uploading = false;
        this.upload_results.push({name: '', error: error.error});
      }
    );
  }
}
