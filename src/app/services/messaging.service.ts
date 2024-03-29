import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { take } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';
import { UtilService } from './util.service';

@Injectable()
export class MessagingService {

  currentMessage = new BehaviorSubject(null);
  isUserOnline: any = false;

  constructor(
    private angularFireDB: AngularFireDatabase,
    private angularFireAuth: AngularFireAuth,
    private util: UtilService,
    private angularFireMessaging: AngularFireMessaging,
    ) {
     const ref = angularFireDB.database.ref('.info/connected');
     ref.on('value', (snap) => {
      if (snap.val() === true) {
        this.isUserOnline = true;
      } else {
        this.isUserOnline = false;
      }
     });
  }

  /**
   * update token in firebase database
   *
   * @param userId userId as a key
   * @param token token as a value
   */
  updateToken(userId, token) {
    // we can change this function to request our backend service
    this.angularFireAuth.authState.pipe(take(1)).subscribe(
      () => {
        const data = {};
        data[token] = token;
        this.angularFireDB.object('users/'+userId).update(data);
      });
  }

  submitUpdate(userId, tokenFb, deviceId, biometrics) {
    if( biometrics && deviceId ) {
      const data = {
        token: tokenFb,
        userid: userId,
        appversion: this.util.version,
        lastupdate: Date.now()
      };
      this.angularFireDB.object('kiosk/'+deviceId).update(data);
    }
  }

  /**
   * request permission for notification from firebase cloud messaging
   *
   * @param userId userId
   */
  requestPermission(userId, biometrics = false) {
    this.angularFireMessaging.requestToken.subscribe(
      (token) => {
        if(token) {
          //console.log(token);
          this.updateToken(userId, token);
        } else {
          Notification.requestPermission();
        }

        let sent: any = false;
        if (!navigator.mediaDevices?.enumerateDevices) {
          //this.submitUpdate(userId, token, 'none');
        } else {
          navigator.mediaDevices.enumerateDevices()
            .then((devices) => {
              devices.forEach((device) => {
                if(device.kind === 'videoinput' && !sent) {
                  this.submitUpdate(userId, token, device.deviceId, biometrics);
                  sent = true;
                }
              });
            })
            .catch((err) => {
              console.error(`${err.name}: ${err.message}`);
              //this.submitUpdate(userId, token, 'error');
            });
        }

      },
      (err) => {
        console.error('Unable to get permission to notify.', err);
      }
    );
  }

  /**
   * hook method when new notification received in foreground
   */
  receiveMessage() {
    this.angularFireMessaging.messages.subscribe(
      (payload: any) => {
        //this.util.modalAlert(payload.notification.title, '', payload.notification.body);
        if(payload?.notification?.title === 'reload') {
          location.reload();
        }
        //console.log('new message received. ', payload);
        this.currentMessage.next(payload);
      });
  }
}
