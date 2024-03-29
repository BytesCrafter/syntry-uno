import { Component, HostListener, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { MessagingService } from 'src/app/services/messaging.service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-rfid',
  templateUrl: './rfid.page.html',
  styleUrls: ['./rfid.page.scss'],
})
export class RfidPage implements OnInit {

  code: any = '';
  public userAvatar: any = '';
  public userFullname: any = '';
  public userTitle: any = '';
  public isSending: any = false;

  public currentAttd: any = null;

  public modalActive: any = false;
  public modalTitle: any = '';
  public modalMsg: any = '';

  timeouts: any;
  isLoading: any = true;
  advisories: any[] = [];

  public curDate: Date = new Date();
  public timer: any = 0;

  public slideOpt = {
    initialSlide: 0,
    speed: 500,
    direction: 'horizontal',
    slidesPerView: 1,
    loop: true,
  };
  public sliderRefs: any;

  reloadTimer: number = 0;

  // eslint-disable-next-line @typescript-eslint/member-ordering
  private serverDatetime: Date = new Date();
  public get currentDate(): any {
    return this.serverDatetime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  public get currentTime(): any {
    return this.serverDatetime.toLocaleTimeString();
  }

  private userDefault: any = 'assets/images/avatar.jpg';

  constructor(
    private api: ApiService,
    private util: UtilService,
    private msg: MessagingService
  ) {
    this.getAdvisories();
    this.reloadTimer = new Date().getTime();

    setInterval(()=> {
      this.curDate = new Date();
      if(this.timer > 0) {
        this.timer -= 1;
      }

      if(this.sinceLastLog() > 3600 && msg.isUserOnline) {
        location.reload();
        this.reloadTimer = new Date().getTime();
      }
    }, 1000);
  }

  sinceLastLog() {
    const timer = new Date().getTime() - this.reloadTimer;
    return timer/1000;
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {

    if(event.key !== 'Enter') {
      this.code += event.key;
    } else {
      if(!this.isSending) {
        const current = this.code+'';
        this.verifyUser(current);
      }
      this.code = '';
    }
  }

  stringToHtml(str) {
    const parser = new DOMParser();
	  return parser.parseFromString(str, 'text/html');
  }

  ngOnInit() {
  }

  ionSlidesDidLoad(slider: any) {
    setInterval(() => {
      slider.slideNext();
    }, 10000);
  }

  async getAdvisories() {
    this.isLoading = true;

    this.api.posts('advisories/listdata', {}).then((response: any) => {
      this.serverDatetime = new Date(response.stamp);

      if(response.success) {
        this.advisories = response.data;
      } else {
        this.util.modalAlert(
          'Something went wrong',
          this.serverDatetime.toLocaleTimeString(),
          'The server did not respond accordingly.'
        );
      }
    }).catch(error => {
      this.util.modalAlert('Error', 'Something went wrong!');
      console.log('error', error);
    }).finally(() => {
      this.isLoading = false;
    });
  }

  verifyUser(rfidNum: any) {
    this.userAvatar = this.userDefault;
    this.userFullname = '-';
    this.userTitle = '-';
    this.currentAttd = null;

    //A. Wait for the server to verify the user. Notify Verifying
    this.api.posts('users/getByRfid', {
      rfid: rfidNum
    }).catch(error => {
      this.warnUser('Something went wrong!');
      console.log('error', error);
    }).then((response: any) => {
      if(response.success) {
        this.logTime(response.data);
      } else {
        this.warnUser(response.message);
      }
    });
  }

  logTime(user: any) {
    //B1. If the user is verified, nbotify that currently Logging.
    this.isSending = true;
    clearTimeout(this.timeouts);

    this.userAvatar = user.image;
    this.userFullname = user.fname + ' ' + user.lname;
    this.userTitle = user.job_title;

    this.trySend(user.id);
  }

  trySend(userId: any = 0) {

    this.api.posts('attendance/log_rfid', {
      current: userId
    }).catch(error => {
      this.warnUser('Something went wrong!.');
    }).then((response: any) => {

      if(response.success === false) {
        this.warnUser(response.message);
        return;
      }

      this.currentAttd = response.attd; //Set latest attd

      this.timeouts = setTimeout(() => {
        this.isSending = false;
      }, 3500);

      this.util.playAudio();
    });
  }

  warnUser(msg: any, timer: any = 3000) {
    clearTimeout(this.timeouts);
    this.timeouts = setTimeout(() => {
      this.isSending = false;
    }, 2000);

    this.util.stopAudio();

    this.modalActive = true;
    this.modalTitle = 'Notification';
    this.modalMsg = msg;

    setTimeout(() => {
      this.modalActive = false;
      this.modalTitle = '';
      this.modalMsg = '';
    }, timer);
  }
}
