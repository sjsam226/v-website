import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home/home.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ReusabilityModule } from '../reusability/reusability.module';

import { TruncateModule } from '@yellowspot/ng-truncate';

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    TruncateModule,
    InfiniteScrollModule,
    AngularEditorModule,
    FormsModule,
    ReusabilityModule
  ]
})
export class HomeModule { }
