import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface User {
  email: string,
  can_upload_photo: boolean,
  can_delete_photo: boolean,
};


@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  GetCurrentUser(): Observable<User> {
    return this.http.get('/api/user/me') as Observable<User>;
  }
}
