import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
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
  filteredOptions!: Observable<string[]>;

  constructor(private imageService: ImageService) { }

  ngOnInit(): void {
    this.filteredOptions = this.formGroup.get("region")!.valueChanges.pipe(
      startWith(''),
      map(value => this._Filter(value)),
    );
  }

  private _Filter(value: string): string[] {
    const filterValue = value.replace('臺', '台');
    return RegionOptions.filter(option => option.includes(filterValue));
  }

  Search() {
    const date: Date = this.formGroup.value.date;

    const dateYear = date.getFullYear();
    const dateMonth = date.getMonth() + 1;
    const dateDate = date.getDate();
    const dateStr = `${dateYear}-${dateMonth}-${dateDate}`
    this.imageService.Query(
      dateStr, this.formGroup.value.region).subscribe(
      (event: any) => {
        if (event.results) {
          this.photoList = event.results;
        }
      });
  }

  GetURL(photo: Photo) {
    return `https://storage.cloud.google.com/${environment.storageBucketId}/${environment.storageRootFolder}/${photo.checksum}`;
  }
}
