import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface FormValueInterface {
  date: Date;
  source: string;
  region: string;
};


export interface UploadResult {
  name: string;
  checksum?: string;
  error?: string;
};


const API_URL = "/api/upload-image";


@Injectable({
  providedIn: 'root'
})
export class UploadImageService {
  constructor(private http: HttpClient) { }

  Upload(form_value: FormValueInterface, file_list: FileList): Observable<any> {
    const form_data = new FormData();

    for (let i = 0; i < file_list.length; i++) {
      form_data.append("image[]", file_list[i], file_list[i].name);
    }

    const year = form_value.date.getFullYear();
    const month = form_value.date.getMonth() + 1;
    const date = form_value.date.getDate();
    const date_str = `${year}-${month}-${date}`;
    form_data.append('date', date_str);

    form_data.append('source', form_value.source);
    form_data.append('region', form_value.region);

    return this.http.post(API_URL, form_data);
  }
}
