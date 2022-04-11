import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


const API_URL = '/api/image';


@Injectable({
  providedIn: 'root'
})
export class ImageService {

  constructor(private http: HttpClient) { }

  Query(date: string, region?: string): Observable<any> {
    const params: any = { date };

    if (region && region !== '') {
      params['region'] = region;
    }
    return this.http.get(API_URL, { params });
  }
}
