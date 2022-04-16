import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { RegionOptions, RegionValidator } from '../utils/region-selector';
import { Photo, ImageService } from '../image.service';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-process-page',
  templateUrl: './process-page.component.html',
  styleUrls: ['./process-page.component.css']
})
export class ProcessPageComponent implements OnInit {
  readonly regionOptions = RegionOptions;

  photoList: Photo[] = [];

  formGroup = new FormGroup({
    // Use today as default value
    date: new FormControl(new Date()),
    region: new FormControl('', RegionValidator()),
  });

  photoEditorFormGroup = new FormGroup({
    fontSize: new FormControl('16'),
    showBoundary: new FormControl(false),
    showBoundingBox: new FormControl(false),
    showOriginalImage: new FormControl(true),
  });

  constructor(
    private imageService: ImageService,
    private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.info(params);
      const checksum: string = params['checksum'];
      if (checksum) {
        this.imageService.QueryByChecksum(checksum).subscribe(
          (response: any) => {
            if (response.results) {
              this.photoList = response.results;
            }
          }
        );
      }
    });
  }

  Search() {
    const date: Date = this.formGroup.value.date;

    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth() + 1;
    const dateDate = date.getDate();
    const dateStr = `${dateYear}-${dateMonth}-${dateDate}`
    this.imageService.Query(
      dateStr, this.formGroup.value.region).subscribe(
      (response: any) => {
        if (response.results) {
          this.photoList = response.results;
        }
      });
  }

  GetURL(photo: Photo) {
    return `https://storage.cloud.google.com/${environment.storageBucketId}/${environment.storageRootFolder}/${photo.checksum}`;
  }
}
