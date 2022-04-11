import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { RegionOptions, RegionValidator } from '../utils/region-selector';
import { ImageService } from '../image.service';


interface Photo {
    checksum: string;
    mimetype: string;
    date: string;
    source: string;
    region: string;
    uploaded_by: string;  // this is a user_id
    text_data_key: string | null;
};


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
    let ext = '';
    switch (photo.mimetype) {
      case 'image/png':
        ext = 'png';
        break;
      case 'image/jpeg':
        ext = 'jpeg';
        break;
    }
    return `https://storage.cloud.google.com/taiwan-covid-trace-helper.appspot.com/staging/${photo.checksum}.${ext}`
  }
}
