import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { RegionOptions, RegionValidator } from '../utils/region-selector';
import { ImageService } from '../image.service';
import { environment } from '../../environments/environment';


export interface Photo {
  checksum: string;
  mimetype: string;
  date: string;
  source: string;
  region: string;
  uploaded_by: string;  // this is a user_id
};


@Component({
  selector: 'app-process-page',
  templateUrl: './process-page.component.html',
  styleUrls: ['./process-page.component.css']
})
export class ProcessPageComponent implements OnInit {
  photoList: Photo[] = [
    //{
      //"checksum": "b1ae916c02f31d48dc13570ac3d8b23b6e290895f78365cca2f7da0860a263fb",
      //"date": "2022-4-12",
      //"mimetype": "image/jpeg",
      //"region": "台北市",
      //"source": "https://www.facebook.com/humansoftaipei/posts/281516480838928",
      //"uploaded_by": "accounts.google.com:100043699853766952083"
    //}
  ];

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
    return `https://storage.cloud.google.com/${environment.storageBucketId}/${environment.storageRootFolder}/${photo.checksum}`;
  }
}
