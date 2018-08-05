import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ɵrenderComponent as renderComponent } from '@angular/core';

import { SampleComponent } from './sample/sample.component';

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
    renderComponent(SampleComponent, { host: 'app-root'});
  }
}
