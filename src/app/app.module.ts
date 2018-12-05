import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { TextToSpeech } from '@ionic-native/text-to-speech';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { Contacts, Contact, ContactField, ContactName } from '@ionic-native/contacts';
import { HTTP } from '@ionic-native/http';
import { IonicStorageModule } from '@ionic/storage';
import { CallNumber } from '@ionic-native/call-number';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { SocialSharing } from '@ionic-native/social-sharing';
import { AndroidPermissions} from '@ionic-native/android-permissions';

import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { EmailComposer } from '@ionic-native/email-composer';
import { Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { NativeGeocoder, NativeGeocoderReverseResult, NativeGeocoderForwardResult, NativeGeocoderOptions } from '@ionic-native/native-geocoder';

import { Sim } from '@ionic-native/sim';
import { SMS } from '@ionic-native/sms';
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { MapsPage } from '../pages/maps/maps';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    MapsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    MapsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    TextToSpeech,
    SpeechRecognition,
    Contacts,
    CallNumber,
    HTTP,
    Geolocation,
    LocationAccuracy,
    SQLite,
    Sim,
    SMS,
    AndroidPermissions,
    SocialSharing,
    NativeGeocoder,
    EmailComposer,
    LaunchNavigator,
    LocalNotifications,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
