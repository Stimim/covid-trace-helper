import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PolicyPageComponent } from './policy-page/policy-page.component';
import { ProcessPageComponent } from './process-page/process-page.component';
import { UploadPageComponent } from './upload-page/upload-page.component';

const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { path: 'policy', component: PolicyPageComponent },
  { path: 'process', component: ProcessPageComponent },
  { path: 'upload', component: UploadPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
