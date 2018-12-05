import { NavController,Platform,MenuController, Content } from 'ionic-angular';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import { Observable } from 'rxjs/Observable';
import { ChangeDetectorRef, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { Contacts, Contact, ContactField, ContactName,ContactFindOptions } from '@ionic-native/contacts';
import { CallNumber } from '@ionic-native/call-number';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';
import { Component, NgZone } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { EmailComposer } from '@ionic-native/email-composer';
import { SocialSharing } from '@ionic-native/social-sharing';
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Storage } from '@ionic/storage';
import { MyApp } from '../../app/app.component';
import { Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { MapsPage } from '../maps/maps';
import { Sim } from '@ionic-native/sim';
import { convertUrlToSegments } from 'ionic-angular/navigation/url-serializer';

declare var ApiAIPromises: any;
declare var SMS:any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  queries: {
    content: new ViewChild('content')
  }
})
export class HomePage {

  @ViewChild('scrollMe') scrollElement: ElementRef;
  @ViewChild('content') content:any;

  matches: string[];
  isRecording = false;
  public allContacts: any;
  everybody;
  databasedb:any;
  textToWrite: any;
  answer;
  allMessages:any;
  allKeys=[];
  trailMessg=[];
  suggesionone:any = "SEND A MESSAGE";
  suggesiontwo:any = "CALL PRAKASH";
  // sugesssions = ["WHATSAPP MESSAGE","CALL PRAKASH"];

  elsestatus:any = false;
  neagtiveWords = ["Don't","never","ever","won't","don't","Won't","Ever","Never"];

  constructor(public navCtrl: NavController, 
      public menuCtrl : MenuController,
      public androidPermissions: AndroidPermissions,
      private tts: TextToSpeech,
      public platform: Platform, 
      public ngZone: NgZone,
      private speechRecognition: SpeechRecognition,
      private plt: Platform,
      private sim: Sim,
      private socialSharing: SocialSharing,
      private emailComposer: EmailComposer,
      private sqlite: SQLite,
      private geolocation: Geolocation,
      private storage: Storage,
      private locationAccuracy: LocationAccuracy,
      private launchNavigator: LaunchNavigator,
      private cd: ChangeDetectorRef,
      private localNotifications: LocalNotifications,
      public callNumber: CallNumber, public contacts: Contacts)
  { 

    //  this.navCtrl.push(MapsPage);
    
    var today = new Date();
    console.log(today,"today");

    this.speechRecognition.requestPermission().then((resp) => {
      this.sim.requestReadPermission().then(() => 
      { 
        this.geolocation.getCurrentPosition().then((resp) => {
          console.log(resp.coords.latitude);
          console.log(resp.coords.longitude);
          this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.READ_SMS]);
        });
      },
      () => console.log('Permission denied'));
    });
    this.textToWrite="";
    platform.ready().then(() => {
      ApiAIPromises.init({
        clientAccessToken: "ca233812e55d4696a22224bef8e0d214"
      }).then(result => console.log(result));
    });
    this.sqlite.create({
      name: 'data.db',
      location: 'default'
    }).then((db: SQLiteObject) => {
      this.databasedb = db;
      db.executeSql('create table Messages(said TEXT,message TEXT,time DATETIME)')
      .then(() => console.log('Executed SQL'))
      .catch(e => console.log(e,"eee"));

      db.executeSql('create table Keywords(request VARCHAR(100),key VARCHAR2(100))')
      .then(() => console.log('Executed SQL'))
      .catch(e => console.log(e,"eee"));
    
    }).catch(e => console.log(e,"fff"));

    this.sim.getSimInfo().then(
      (info) =>{
        console.log('Sim info: ', info.phoneNumber)
        console.log('Sim info: ', info.cards[0])
        console.log('Sim info: ', info.cards[1])
        console.log('Sim info: ', info.phoneNumber)
      });
    
    this.sim.hasReadPermission().then(
      (info) => console.log('Has permission: ', info)
    );
  }

  ionViewDidEnter(){
    this.storage.get('keys').then((val) => {
      if(!val)
      {
        this.onlyOneTime();
        if(this.allKeys)
        {
          for(let entry of this.allKeys)
          {
            console.log(entry,"entry");
            this.databasedb.executeSql("INSERT INTO Keywords VALUES (?, ?)",[entry.req,entry.key])
            .then(() => console.log('Inserted values'))
            .catch(e => console.log(e));
          }
        }
        this.storage.set('keys','Done');
      }
      else{
        this.allKeys = [];
        this.databasedb.executeSql('SELECT * FROM Keywords', {})
        .then(res => {
          for(var i=0; i<res.rows.length; i++) {
            this.allKeys.push({
              req:res.rows.item(i).request,
              key:res.rows.item(i).key
            });
          }
        })
        .catch(e => console.log(e));
      }
    });
  }
  ionViewDidLoad()
  {
    // this.content.scrollToBottom(300);
  }
  ngOnInit(){
    setTimeout(() => {
      this.allMessages=[];
      this.databasedb.executeSql('SELECT * FROM Messages',{})
        .then(res => {
          for(var i=0; i<res.rows.length; i++) {
            this.allMessages.push({
              said:res.rows.item(i).said,
              message:res.rows.item(i).message
            });
          }
          console.log(this.allMessages,"allMessages");
        })
        .catch(e => console.log(e));  
    }, 1000);
  }

  ask(question) {
    ApiAIPromises.requestText({
      query: question
    })
    .then(({result: {fulfillment: {speech}}}) => {
       this.ngZone.run(()=> {

        this.tts.speak(speech)
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));

         this.answer = speech;
       });
    })
  }

  isAndroid() {
    return this.plt.is('android');
  }
  
  isIos() {
    return this.plt.is('ios');
  }

  callContact(number: string) {
    this.callNumber.callNumber(number, true)
      .then(() => console.log('Dialer Launched!'))
      .catch(() => console.log('Error launching dialer'));
  }
 
  stopListening() {
    this.speechRecognition.stopListening().then(() => {
      this.isRecording = false;
    });

  }
 
  findContact(name)
  {
    var res:any;
    console.log(name,"fcmain");
    this.contacts.find(['*'],{filter:name}).then((res)=>{
      this.callContact(res[0].phoneNumbers[0].value);
      console.log(res[0].phoneNumbers[0].value);
    }).catch((reson:any)=>{
      this.tts.speak('Sorry no contact found')
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));
        var today = new Date();
      var data = ['bujji','Sorry no contact found',today];
      this.insertAndShow(data);
    });
  }

  myCurrentLocation(searchItem)
  {

    console.log(searchItem,"searchItem");
    for(let place = 0;place<searchItem.length;place++)
    {
      console.log(searchItem[place]);
      if(searchItem[place] == "near" || searchItem[place] == "Near")
      {
        let area = searchItem[place-1];
        this.geolocation.getCurrentPosition().then((resp) => {
          console.log(resp.coords.latitude);
          console.log(resp.coords.longitude);
          console.log(searchItem);
          this.navCtrl.push(MapsPage,{
            search:area,
            latit:resp.coords.latitude,
            longit:resp.coords.longitude
          });
        }).catch((error) => {
          console.log('Error getting location', error);
        });
      }
      else if(searchItem[place] == "nearest" || searchItem[place] == "Nearest")
      {
        let area = searchItem[place+1];
        this.geolocation.getCurrentPosition().then((resp) => {
          console.log(resp.coords.latitude);
          console.log(resp.coords.longitude);
          console.log(searchItem);
          this.navCtrl.push(MapsPage,{
            search:area,
            latit:resp.coords.latitude,
            longit:resp.coords.longitude
          });
        }).catch((error) => {
          console.log('Error getting location', error);
        });
      }
    }

    

  }

  startListening() {

    this.elsestatus = false;
    
    console.log(new Date(new Date().getTime() + 3600),"b");
    this.textToWrite="";
    let nm:string;
    let options = {
      language: 'en-US'
    }
    this.speechRecognition.startListening().subscribe(matches => {
      this.matches = matches; 
      console.log(this.matches,"matches");
      if(this.matches)
      {
        var today = new Date();
        var data = ['user',this.matches[0],today];
        this.insertAndShow(data);
        console.log("allkeys",this.allKeys);
        for(let key of this.allKeys)
        {
          console.log(key,"key");
          if(key.req == this.matches[0])
          {
            this.elsestatus = true;
            if(key.key == "whatsappsMessage")
            {
              this.whatsappsMessage();
              break;
            }
            if(key.key == "sendEmail")
            {
              this.sendAnEmail();
              break;
            }
            if(key.key == "readMessages")
            {
              this.getNewMessages()
              break;
            }
          }
        }
        var recognised = this.matches[0].split(" ");
  
        for(let i=0;i<recognised.length;i++)
        {
          if(recognised[i] == "call")
          {
            this.elsestatus = true;
            let neg = 0;
            for(let negative of this.neagtiveWords)
            {
              console.log(negative,"negative");
              if(negative == recognised[i-1])
              {
                console.log("stopedfromhere");
                var today = new Date();
                data = ['bujji','As Your wish',today];
                this.insertAndShow(data);
                this.tts.speak('As Your wish')
                .then(() => console.log('Success'))
                .catch((reason: any) => console.log(reason));
                neg = 1;
                break;        
              }
            }
            if(neg == 0)
            {
              nm=recognised[i+1];
              for(var j=i+2;j<recognised.length;j++)
              {
                nm=nm+" "+recognised[j];
              }
              console.log("callingfromhere");   
              this.findContact(nm);
              console.log(nm,"if");
            }
            break;
          }

        }

        if((this.matches[0].search(/near/gi) != -1 || this.matches[0].search(/nearest/gi) != -1) && ((this.matches[0].search(/to/gi) != -1) && (this.matches[0].search(/me/gi) != -1)))
        {
            this.elsestatus = true;
            this.myCurrentLocation(recognised);
            return;
        }

        if((this.matches[0].search(/from/gi) != -1 && this.matches[0].search(/to/gi) != -1) && ((this.matches[0].search(/route/gi) != -1) || (this.matches[0].search(/way/gi) != -1)))
        {
          this.elsestatus = true;
          this.showRouteFromTo(recognised);
          return;
        }
        
        else if((this.matches[0].search(/share/gi) != -1 && this.matches[0].search(/my/gi) != -1) && ((this.matches[0].search(/number/gi) != -1)))
        {
          this.elsestatus = true;
          console.log("cameHere");
          this.shareMyNumber(recognised);
          return;
        }
        
        else if((recognised[0] == "remind" && recognised[1] == "me"))
        {  
          this.elsestatus = true;
          this.goToRemaind(recognised);
          return;
        }
        else if(this.elsestatus == false)
        {
          let question = this.matches[0];
          ApiAIPromises.requestText({
            query: question
          })
          .then(({result: {fulfillment: {speech}}}) => {
            this.ngZone.run(()=> {
              var today = new Date();
              var data = ['bujji',speech,today];
              this.insertAndShow(data);
              this.tts.speak(speech)
              .then(() => console.log('Success'))
              .catch((reason: any) => console.log(reason));
              this.answer = speech;
            });
          })
        }
      }
      else{
        var today = new Date();
        data = ['bujji','Sorry come again',today];
        this.insertAndShow(data);
        this.tts.speak('Sorry come again')
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));
      } 
    });
    this.isRecording = true;
  }

  showRouteFromTo(fromTo:any)
  {
    console.log(fromTo,"fromTo");
    for(let place = 0;place<fromTo.length;place++)
    {
      console.log(fromTo[place]);
      if(fromTo[place] == "from" || fromTo[place] == "From")
      {
        var startPoint = fromTo[place+1];
        var endPoint = "";
        for(var j=place+2;(j<fromTo.length)&&(fromTo[j] != "to");j++)
        {
          startPoint=startPoint+" "+fromTo[j];
          console.log(j,"j");
        }
        console.log(j,"in J");
        for(var k=(j+1);k<fromTo.length;k++)
        {
          endPoint=endPoint+" "+fromTo[k];
        }
        console.log(startPoint,"startpoint");
        console.log(endPoint,"endpoint");
        let options: LaunchNavigatorOptions = {
          start: startPoint,
        };      
        this.launchNavigator.navigate(endPoint, options)
        .then(
          success => console.log('Launched navigator'),
          error => console.log('Error launching navigator', error)
        );   
      }
    }
  }

  shareMyNumber(shareNm)
  {
    for(let place = 0;place<shareNm.length;place++)
    {
      console.log(shareNm[place]);
      if(shareNm[place] == "to" || shareNm[place] == "To")
      {
        let nm=shareNm[place+1];
        for(var j=place+2;j<shareNm.length;j++)
        {
          nm=nm+" "+shareNm[j];
        }
        console.log(nm);


        // ttssmall.speak('Number sent succesfully to '+nm)
        // .then(() => console.log('Success'))
        // .catch((reason: any) => console.log(reason));

        this.contacts.find(['*'],{filter:nm}).then((res)=>{
          console.log(res[0].phoneNumbers[0].value);
          let receiver = res[0].phoneNumbers[0].value;
          this.sim.getSimInfo().then((info) =>{
            console.log('Sim info: ', info.phoneNumber)
            console.log('Sim info: ', info.cards[0])
            console.log('Sim info: ', info.cards[1])
            console.log('Sim info: ', info.phoneNumber)
            if(SMS) SMS.sendSMS(receiver, 'Hello '+nm+' this is my number '+info.phoneNumber, function()
            {
              console.log("success");
            }, function(){
              console.log("not success");
            });
          });
        }).catch((reson:any)=>{
          this.tts.speak('Sorry no contact found')
          .then(() => console.log('Success'))
          .catch((reason: any) => console.log(reason));
          var today = new Date();
          var data = ['bujji','Sorry no contact found',today];
          this.insertAndShow(data);
        });
        console.log(nm,"if");
      }
    }
  }

  getNewMessages()
  {
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.READ_SMS).then(
      success => console.log('Permission granted'),
    err => this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.READ_SMS)
    );
    
    // this.androidPermissions.requestPermissions([this.androidPermissions.PERMISSION.READ_SMS]);

    this.platform.ready().then((readySource) => {
      let filter = {
        box : 'inbox', // 'inbox' (default), 'sent', 'draft'
        indexFrom : 0, // start from index 0
        maxCount : 3, // count of SMS to return each time
        };
        if(SMS) SMS.listSMS(filter, (ListSms)=>{
          console.log("Sms",ListSms);
          for(let msg of ListSms)
          {
            console.log(msg,"MSG");
            var today = new Date();
            let data = ['card',msg.body,today];
            this.insertAndShow(data);
          }
        },
        Error=>{
          console.log('error list sms: ' + Error);
        });   
    });
  }
  goToRemaind(r:any)
  {
    if(r[4] == "minutes")
    {
      let sec = r[3]*60*1000;
      this.localNotifications.schedule({
        text: 'Alarm has expired!',
        trigger: {at: new Date(new Date().getTime() + sec)},
        // sound: isAndroid ? 'file://sound.mp3': 'file://beep.caf',
        data: { message : 'json containing app-specific information to be posted when alarm triggers' }
      });
      console.log(new Date(new Date().getTime() + sec),"in remaind")
    }
  }
  sendAnEmail()
  {
    var response:any;

    this.emailComposer.isAvailable().then((available: boolean) =>{
      if(available) {
        //Now we know we can send
      }
    });

    var today = new Date();
    var data = ['bujji','Okay Tell me email',today];
        this.insertAndShow(data);
        this.tts.speak('Okay Tell me email')
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));

    setTimeout(() => {    
      this.speechRecognition.startListening().subscribe(matches => {
        response = matches;
        console.log(response,"response");
        let res = response[0].split(" ");
        let email = "";
        for(let entry of res)
        {
          if(entry == "dot")
          {
            entry = '.';
          }
          if(entry == "underscore")
          {
            entry = '_';
          }
          email = email+entry;
        }
        if(email!="")
        {
          var today = new Date();
          var data = ['bujji','Tell me the message',today];
          this.insertAndShow(data);
          this.tts.speak('Tell me the message')
          .then(() => console.log('Success'))
          .catch((reason: any) => console.log(reason));
          setTimeout(() => {
            this.speechRecognition.startListening().subscribe(matches => {
              let r = matches;
              console.log(r,"r");
              if(r)
              {
                let mailToSend = {
                  to: email,
                  //cc: 'erika@mustermann.de',
                  //bcc: ['john@doe.com', 'jane@doe.com'],
                  // attachments: [
                  //   'file://img/logo.png',
                  //   'res://icon.png',
                  //   'base64:icon.png//iVBORw0KGgoAAAANSUhEUg...',
                  //   'file://README.pdf'
                  // ],
                  subject: 'Testing mail',
                  body: r[0],
                  isHtml: true
                };

                this.emailComposer.open(mailToSend);

              }
            });
         }, 1500);
        }
        console.log(email,"email");
      });
    }, 1500);
  }

  whatsappsMessage()
  {
    console.log("whatsappsMessage came here");
    var response:any;
    var today = new Date();
    var data = ['bujji','To whom you what to send message',today];
        this.insertAndShow(data);
        this.tts.speak('To whom you what to send message')
        .then(() => console.log('Success'))
        .catch((reason: any) => console.log(reason));

    setTimeout(() => {    
      this.speechRecognition.startListening().subscribe(matches => {
        response = matches;
        console.log(response,"response");
        var recognised = response[0].split(" ");
          
          if(recognised.length>1)
          {
            let nm=recognised[0];
            for(var j=1;j<recognised.length;j++)
            {
              nm=nm+" "+recognised[j];
            }   
            
            this.contacts.find(['*'],{filter:nm}).then((res)=>{
              //this.callContact(res[0].phoneNumbers[0].value);
              console.log(res[0].phoneNumbers[0].value);
              this.tts.speak('What is the message')
              .then(() => console.log('Success'))
              .catch((reason: any) => console.log(reason));
              var today = new Date();
              var data = ['bujji','What is the message',today];
              this.insertAndShow(data);    
              setTimeout(() => {
                this.speechRecognition.startListening().subscribe(matches => {
                  this.socialSharing.shareViaWhatsAppToReceiver(res[0].phoneNumbers[0].value, matches[0], null, null).then(() => {
                  }).catch(() => {
                  });
                });
              }, 1500);
            }).catch((reson:any)=>{
              this.tts.speak('Sorry no contact found')
                .then(() => console.log('Success'))
                .catch((reason: any) => console.log(reason))
                var today = new Date();
              var data = ['bujji','Sorry no contact found',today];
              this.insertAndShow(data);
            });
            console.log(nm,"if");
          }
          else
          {
            this.contacts.find(['*'],{filter:recognised[0]}).then((res)=>{
              console.log(res[0].phoneNumbers[0].value);
              this.tts.speak('What is the message')
              .then(() => console.log('Success'))
              .catch((reason: any) => console.log(reason))
              var today = new Date();
              var data = ['bujji','What is the message',today];
              this.insertAndShow(data);    
              setTimeout(() => {
                this.speechRecognition.startListening().subscribe(matches => {
                  this.socialSharing.shareViaWhatsAppToReceiver(res[0].phoneNumbers[0].value, matches[0], null, null).then(() => {
                  }).catch(() => {
                  });
                });
              }, 1500);
            }).catch((reson:any)=>{
              this.tts.speak('Sorry no contact found')
                .then(() => console.log('Success'))
                .catch((reason: any) => console.log(reason))
                var today = new Date();
              var data = ['bujji','Sorry no contact found',today];
              this.insertAndShow(data);
            });
            console.log(recognised[0],"else");
          }
      });
    }, 1500);
  }

  insertAndShow(data)
  {
    console.log(data,"data");

    var splitStr = data[1].toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
      splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);     
    }
    data[1] = splitStr.join(' ');

    if(this.trailMessg.length==5)
    {
      this.trailMessg.shift();
      console.log(this.trailMessg,"After pop")
      this.trailMessg.push({
        said:data[0],
        message:data[1]
      });
      console.log(this.trailMessg,"trailmsg");
    }
    else{
      this.trailMessg.push({
        said:data[0],
        message:data[1]
      });
      console.log(this.trailMessg,"trailmsg");
    }

    // this.content.scrollToBottom(300);

    this.databasedb.executeSql("INSERT INTO Messages VALUES (?,?,?)",data)
      .then(() => console.log('Inserted values'))
      .catch(e => console.log(e));
    this.databasedb.executeSql('SELECT * FROM Messages', {})
      .then(res => {
        this.allMessages=[];
        for(var i=0; i<res.rows.length; i++) {
          this.allMessages.push({
            said:res.rows.item(i).said,
            message:res.rows.item(i).message
          });
        }
        console.log(this.allMessages,"allMessages");
      })
    .catch(e => console.log(e));
  }

  onlyOneTime()
  {
    this.allKeys=[];
    this.allKeys.push({
      req:"send a message on WhatsApp",
      key:"whatsappsMessage"
    });
    this.allKeys.push({
      req:"send message on WhatsApp",
      key:"whatsappsMessage"
    });
    this.allKeys.push({
      req:"message on WhatsApp",
      key:"whatsappsMessage"
    });
    this.allKeys.push({
      req:"I want to send a message on WhatsApp",
      key:"whatsappsMessage"
    });
    this.allKeys.push({
      req:"I want to send message on WhatsApp",
      key:"whatsappsMessage"
    });
    this.allKeys.push({
      req:"message a friend on WhatsApp",
      key:"whatsappsMessage"
    });
    this.allKeys.push({
      req:"message to a friend on WhatsApp",
      key:"whatsappsMessage"
    });
    this.allKeys.push({
      req:"send mail",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"send a mail",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"send email",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"send an Email",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"I want to send email",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"I want to send a mail",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"I want to send an email",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"I want to send mail",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"message a friend on mail",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"message to a friend on mail",
      key:"sendEmail"
    });
    this.allKeys.push({
      req:"get new messages",
      key:"readMessages"
    });
    this.allKeys.push({
      req:"get my messages",
      key:"readMessages"
    });
    this.allKeys.push({
      req:"read new messages",
      key:"readMessages"
    });
    this.allKeys.push({
      req:"read latest messages",
      key:"readMessages"
    });

    console.log(this.allKeys,"allKeys");
  }
}