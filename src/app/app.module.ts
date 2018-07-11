import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ɵrenderComponent as renderComponent } from '@angular/core';

import { IvytestComponent } from './sample/ivytest.component';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule
  ],
  entryComponents: [],
  providers: [],
  bootstrap: []
})
export class AppModule {
  ngDoBootstrap() {
    renderComponent(IvytestComponent, { host: 'app-root'});
  }
}
