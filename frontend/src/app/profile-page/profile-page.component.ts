import { Component, OnInit } from '@angular/core';

import { User, UserService } from '../user.service';


@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})
export class ProfilePageComponent implements OnInit {
  me?: User;
  loading = true;


  constructor(
    private userService: UserService) { }

  ngOnInit(): void {
    this.userService.GetCurrentUser().subscribe(
      (response: User) => {
        this.loading = false;
        this.me = response;
      },
      (error: any) => {
        this.loading = false;
        console.error(error);
      });
  }

}
