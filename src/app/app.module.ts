import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ɵrenderComponent as renderComponent, ɵdefineComponent as defineComponent, } from '@angular/core';

import { AppComponent } from './app.component';
import { IvytestComponent } from './ivytest/ivytest.component';

// console.log('あああああ', ivytest);

@NgModule({
  declarations: [
    // AppComponent,
  ],
  imports: [
    BrowserModule
  ],
  entryComponents: [],
  providers: [],
  bootstrap: [
    // AppComponent
  ]
})
export class AppModule {
  ngDoBootstrap() {
    renderComponent(IvytestComponent, { host: 'app-root'});
  }
}
