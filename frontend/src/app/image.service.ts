import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ImageService {
  const API_URL = '/api/image';

  constructor(private http: HttpClient) { }

  Query(date: string, region: string?) {
  }
}
