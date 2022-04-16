import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


const API_URL = '/api/image';

export type ImageProcessState = 'NOT_STARTED' | 'STARTED' | 'FINISHED';


export interface Photo {
  checksum: string;
  mimetype: string;
  date: string;
  source: string;
  region: string;
  uploaded_by: string;  // this is a user_id
  process_state?: ImageProcessState;
};


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

  QueryByChecksum(checksum: string): Observable<any> {
    return this.http.get(API_URL + '/' + checksum);
  }

  QueryTextDetectionResult(checksum: string): Observable<any> {
    const params: any = { checksum }

    return this.http.get(API_URL + '/text_detection_result', { params });
  }

  SetProcessState(checksum: string, state: ImageProcessState): Observable<any> {
    const formData = new FormData();
    formData.append('checksum', checksum);
    formData.append('process_state', state);
    return this.http.post(API_URL + '/set_process_state', formData);
  }
}
